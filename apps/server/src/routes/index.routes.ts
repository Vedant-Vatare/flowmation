import { Router, type Router as routerType } from "express";
import authRouter from "@/routes/auth.routes.js";
import nodeRouter from "@/routes/node.routes.js";
import workflowConnectionsRouter from "@/routes/workflow.connections.routes.js";
import workflowExecutionsRouter from "@/routes/workflow.executions.routes.js";
import workflowNodesRouter from "@/routes/workflow.nodes.routes.js";
import workflowRouter from "@/routes/workflow.routes.js";
import { webhook } from "./webhook.routes.js";

const router = Router() as routerType;

router.use("/auth", authRouter);
router.use("/nodes", nodeRouter);
router.use("/workflows", workflowRouter);
router.use("/workflow-nodes", workflowNodesRouter);
router.use("/workflow-connections", workflowConnectionsRouter);
router.use("/executions", workflowExecutionsRouter);

router.post("/webhooks/:webhookId", webhook);
export default router;
