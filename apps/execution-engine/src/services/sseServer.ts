import { and, db, eq, or, workflowExecutionTable } from "@nodebase/db";
import { verifyJWT } from "@nodebase/shared/utils";

type HandleUserAuth = {
	req: Bun.BunRequest<"/updates/:executionId">;
	executionId: string;
};

const authenticateUser = async ({
	req,
}: HandleUserAuth): Promise<string | Response> => {
	try {
		const authHeader = req.headers.get("authorization");
		const token = authHeader?.split(" ")[1];

		if (!token) return new Response("Invalid token", { status: 401 });

		const decoded = await verifyJWT(token);
		return decoded.userId;
	} catch (e: unknown) {
		if (e instanceof Error) {
			return new Response(e.message || "internal server error", {
				status: 401,
			});
		}
	}
	return new Response("failed to authenticate user", { status: 401 });
};

const checkWorkflowStatus = async (executionId: string, userId: string) => {
	const userWorkflowExecution = await db.query.workflowExecutionTable.findFirst(
		{
			where: and(
				eq(workflowExecutionTable.id, executionId),
				or(
					eq(workflowExecutionTable.status, "waiting"),
					eq(workflowExecutionTable.status, "running"),
				),
				eq(workflowExecutionTable.userId, userId),
			),
		},
	);

	if (!userWorkflowExecution) {
		return new Response("Workflow not found", { status: 404 });
	}
};

export const sseClients = new Map<
	string,
	Bun.ReadableStreamController<unknown>
>();

Bun.serve({
	port: process.env.SSE_SERVER_PORT,

	routes: {
		"/updates/:executionId": {
			OPTIONS: (req) => {
				const origin = req.headers.get("origin");

				if (origin !== process.env.CLIENT_URL) {
					return new Response("Forbidden", { status: 403 });
				}

				return new Response(null, {
					status: 200,
					headers: {
						"Access-Control-Allow-Origin": process.env.CLIENT_URL,
						"Access-Control-Allow-Methods": "GET, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				});
			},

			GET: async (req, server) => {
				const origin = req.headers.get("origin");

				if (origin !== process.env.CLIENT_URL) {
					return new Response("Forbidden", { status: 403 });
				}

				const executionId = req.params.executionId;

				const authResult = await authenticateUser({
					req,
					executionId,
				});
				if (authResult instanceof Response) return authResult;

				const workflowResponse = await checkWorkflowStatus(
					executionId,
					authResult,
				);

				if (workflowResponse instanceof Response) return workflowResponse;

				const stream = new ReadableStream({
					start(controller) {
						sseClients.set(executionId, controller);

						controller.enqueue(
							`data: ${JSON.stringify({
								type: "connected",
							})}\n\n`,
						);
					},

					cancel() {
						sseClients.delete(executionId);
					},
				});

				server.timeout(req, 0);

				return new Response(stream, {
					headers: {
						"Access-Control-Allow-Origin": process.env.CLIENT_URL,
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
						"Content-Type": "text/event-stream; charset=utf-8",
						"Cache-Control": "no-cache, no-transform",
						Connection: "keep-alive",
					},
				});
			},
		},
	},
});
