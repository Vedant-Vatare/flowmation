import { and, db, eq, workflowExecutionTable } from "@nodebase/db";
import { verifyJWT } from "@nodebase/shared";

type HandleUserAuth = {
	req: Bun.BunRequest<"/updates/:executionId">;
	executionId: string;
};

const handleUserAuth = async ({ req, executionId }: HandleUserAuth) => {
	const authHeader = req.headers.get("authorization");
	const token = authHeader?.split(" ")[1];
	if (!token) return new Response("Invalid token", { status: 401 });

	try {
		const decoded = await verifyJWT(token);
		const userWorkflowExecution =
			await db.query.workflowExecutionTable.findFirst({
				where: and(
					eq(workflowExecutionTable.id, executionId),
					eq(workflowExecutionTable.userId, decoded.userId),
				),
			});

		if (!userWorkflowExecution) {
			return new Response("Workflow execution not found", { status: 404 });
		}
	} catch (e: unknown) {
		if (e instanceof Error) {
			return new Response(e.message || "interal server error", {
				status: 401,
			});
		}
	}

	return null;
};

export const sseClients = new Map<
	string,
	Bun.ReadableStreamController<unknown>
>();

Bun.serve({
	port: process.env.SSE_SERVER_PORT,
	routes: {
		"/updates/:executionId": {
			POST: async (req, server) => {
				const executionId = req.params.executionId;
				const authError = await handleUserAuth({ req, executionId });
				if (authError) return authError;

				const stream = new ReadableStream({
					start(controller) {
						sseClients.set(executionId, controller);
						controller.enqueue(`data: SSE connection established\n\n`);
					},

					cancel() {
						sseClients.delete(executionId);
					},
				});

				server.timeout(req, 0);

				return new Response(stream, {
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Content-Type": "text/event-stream;charset=utf-8",
						"Cache-Control": "no-cache, no-transform",
						Connection: "keep-alive",
					},
				});
			},
		},
	},
});
