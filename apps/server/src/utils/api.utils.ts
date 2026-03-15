import { DrizzleQueryError } from "@nodebase/db";
import type {
	ErrorRequestHandler,
	NextFunction,
	Request,
	RequestHandler,
	Response,
} from "express";
import { DatabaseError } from "pg";
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
		req.body = zodResponse.data;
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

export const isDBQueryError = (error: unknown): DatabaseError | null => {
	if (
		error instanceof DrizzleQueryError &&
		error.cause instanceof DatabaseError
	) {
		return error.cause;
	} else {
		return null;
	}
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
		console.log({ errorCode, dbError });

		if (mappedError) {
			return res.status(mappedError.status).json({
				message: mappedError.message,
			});
		}
	}

	const statusCode =
		"statusCode" in err && typeof err.statusCode === "number"
			? err.statusCode
			: 500;

	const message = err instanceof Error ? err.message : "something went wrong";

	return res.status(statusCode).json({ message });
};
