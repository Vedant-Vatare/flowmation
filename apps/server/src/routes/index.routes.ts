import { Router } from "express";
import authRouter from "@/routes/auth.routes.js";
import credentialsRouter from "@/routes/credentials.routes.js";
import nodeRouter from "@/routes/node.routes.js";
import templatesRouter from "@/routes/templates.routes.js";
import webhookRouter from "@/routes/webhook.routes.js";
import workflowConnectionsRouter from "@/routes/workflow.connections.routes.js";
import workflowExecutionsRouter from "@/routes/workflow.executions.routes.js";
import workflowNodesRouter from "@/routes/workflow.nodes.routes.js";
import workflowRouter from "@/routes/workflow.routes.js";

const router = Router() as Router;

router.use("/auth", authRouter);
router.use("/credentials", credentialsRouter);
router.use("/nodes", nodeRouter);
router.use("/workflows", workflowRouter);
router.use("/workflow-nodes", workflowNodesRouter);
router.use("/workflow-connections", workflowConnectionsRouter);
router.use("/executions", workflowExecutionsRouter);
router.use("/webhooks", webhookRouter);
router.use("/templates", templatesRouter);
export default router;
