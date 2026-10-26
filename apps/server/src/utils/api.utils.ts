import { DrizzleQueryError } from "@nodebase/db";
import type {
	ErrorRequestHandler,
	NextFunction,
	Request,
	RequestHandler,
	Response,
} from "express";
import { flattenError, type ZodType } from "zod";

type RequestField = "body" | "params" | "query";

type ValidationOptions = {
	parse?: boolean;
	key?: string;
};

export const validateRequest = (
	schema: ZodType,
	field: RequestField,
	options: ValidationOptions = {},
): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!field) {
			return res.status(500).json({
				error: "InternalServerError",
				message: "request field not assigned",
			});
		}

		let data = req[field];

		/* If request contains file uploads then parse the data field */
		if (field === "body" && options.parse) {
			if (!req.body.data) {
				return res.status(400).json({
					error: "MissingData",
					message: "Expected data field in request body",
				});
			}

			try {
				data = JSON.parse(req.body.data);
			} catch (e: unknown) {
				console.log("JSON parse error:", e);
				return res.status(400).json({
					error: "InvalidJSON",
					message: "Failed to parse request data",
				});
			}
		}
		if (options.key) {
			if (!(options.key in data)) {
				return res.status(400).json({
					error: "MissingKey",
					message: `Expected key "${options.key}" in request ${field}`,
				});
			}
			data = data[options.key];
		}
		const zodResponse = schema.safeParse(data);

		if (!zodResponse.success) {
			return res.status(400).json({
				error: "ValidationError",
				message: "Invalid data",
				errors: flattenError(zodResponse.error),
			});
		}

		if (options.key) {
			(req[field] as Record<string, unknown>)[options.key] = zodResponse.data;
		} else {
			req[field] = zodResponse.data;
		}
		next();
	};
};

export const asyncHandler =
	(handler: RequestHandler) =>
	(req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(handler(req, res, next)).catch((error) => {
			next(error);
		});
	};

export const isDBQueryError = (error: unknown): { code: string } | null => {
	if (
		error instanceof DrizzleQueryError &&
		error.cause &&
		typeof error.cause === "object" &&
		"code" in error.cause &&
		typeof (error.cause as Record<string, unknown>).code === "string"
	) {
		return error.cause as { code: string };
	}
	return null;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	const dbErrorMap = {
		"22P02": { status: 400, message: "the id provided is not in valid format" },
		"23505": { status: 409, message: "Duplicate entry exists" },
		"23503": { status: 400, message: "Referenced resource not found" },
		"23502": { status: 400, message: "Required field is missing" },
		"23514": { status: 400, message: "Check constraint violation" },
		"42703": { status: 500, message: "Database schema error" },
		"42P01": { status: 500, message: "Database table not found" },
	} as const;

	const dbError = isDBQueryError(err);

	if (dbError) {
		const errorCode = dbError.code as keyof typeof dbErrorMap;
		const mappedError = dbErrorMap[errorCode];
		console.error("Database request failed", err);

		if (mappedError) {
			return res.status(mappedError.status).json({
				message:
					mappedError.status >= 500
						? "Something went wrong. Please try again."
						: mappedError.message,
			});
		}
	}

	if (dbError) {
		return res
			.status(500)
			.json({ message: "Something went wrong. Please try again." });
	}

	const candidateStatus =
		err && typeof err === "object" && "statusCode" in err
			? err.statusCode
			: undefined;
	const statusCode =
		typeof candidateStatus === "number" &&
		Number.isInteger(candidateStatus) &&
		candidateStatus >= 400 &&
		candidateStatus <= 599
			? candidateStatus
			: 500;
	const canExpose =
		statusCode < 500 &&
		err instanceof Error &&
		!("expose" in err && err.expose === false);
	if (statusCode >= 500) console.error("Request failed", err);
	const message = canExpose
		? err.message
		: "Something went wrong. Please try again.";
	return res.status(statusCode).json({ message });
};

const REQUEST_TIMEOUT_MS = 30_000;

export const RequestTimeOutHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	req.setTimeout(REQUEST_TIMEOUT_MS);
	res.setTimeout(REQUEST_TIMEOUT_MS);
	res.on("timeout", () => {
		if (!res.headersSent) {
			res.status(504).json({ message: "Request timed out" });
		}
	});
	next();
};
