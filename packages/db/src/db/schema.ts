import type {
	NodeConfig,
	NodeCredentials,
	NodeParameters,
} from "@nodebase/shared";
import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const nodeTypeEnum = pgEnum("nodesEnum", ["action", "trigger"]);
export const WorkflowStatusEnum = pgEnum("WorkflowStatusEnum", [
	"active",
	"waiting",
	"cancelled",
	"executed",
	"failed",
	"running",
	"stopped",
]);

export const usersTable = pgTable("users", {
	id: uuid().defaultRandom().primaryKey(),
	email: varchar({ length: 255 }).notNull().unique(),
	name: varchar({ length: 255 }).notNull(),
	password: text(),
	googleOauthId: varchar("google_oauth_id", { length: 255 }).unique(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const nodesTable = pgTable("nodes", {
	id: uuid().defaultRandom().primaryKey(),
	name: varchar({ length: 255 }).unique().notNull(),
	type: nodeTypeEnum().notNull(),
	task: varchar({ length: 255 }).unique().notNull(),
	description: text().notNull(),
	parameters: jsonb().$type<NodeParameters[]>().notNull(),
	credentials: jsonb().$type<NodeCredentials>(),
	outputPorts: jsonb("output_ports")
		.$type<{ name: string; label: string }>()
		.array(),
	inputPorts: jsonb("input_ports")
		.$type<{ name: string; label: string }>()
		.array(),
});

export const userWorkflowsTable = pgTable(
	"user_workflows",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.references(() => usersTable.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar({ length: 255 }).unique(),
		description: text(),
		status: WorkflowStatusEnum().$default(() => "active"),
		executionCount: integer("execution_count").notNull().default(0),
		lastExecutedAt: timestamp("last_executed_at"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [index("user_id_idx").on(t.userId)],
);

export const workflowNodesTable = pgTable(
	"workflow_nodes",
	{
		id: uuid().defaultRandom().primaryKey(),
		workflowId: uuid("workflow_id")
			.references(() => userWorkflowsTable.id, { onDelete: "cascade" })
			.notNull(),
		nodeId: uuid("node_id")
			.references(() => nodesTable.id, { onDelete: "cascade" })
			.notNull(),
		positionX: integer("position_x").notNull(),
		positionY: integer("position_y").notNull(),
		name: varchar({ length: 255 }).notNull(),
		type: nodeTypeEnum().notNull(),
		task: varchar({ length: 255 }).notNull(),
		description: text(),
		credentials: jsonb().$type<NodeCredentials>(),
		config: jsonb("config").$type<NodeConfig>().default({}).notNull(),
		parameters: jsonb().$type<NodeParameters[]>().notNull().default([]),
		outputPorts: jsonb("output_ports")
			.$type<{ name: string; label: string }[]>()
			.notNull()
			.default([{ name: "default", label: "Default" }]),
		inputPorts: jsonb("input_ports")
			.$type<{ name: string; label: string }[]>()
			.notNull()
			.default([{ name: "default", label: "Default" }]),
	},
	(t) => [
		index("workflow_nodes_workflow_id_idx").on(t.workflowId),
		unique("unique_workflow_node_name").on(t.workflowId, t.name),
	],
);

export const workflowConnectionsTable = pgTable(
	"workflow_connections",
	{
		id: uuid().defaultRandom().primaryKey(),
		workflowId: uuid("workflow_id")
			.references(() => userWorkflowsTable.id, { onDelete: "cascade" })
			.notNull(),
		sourceId: uuid("source_id")
			.references(() => workflowNodesTable.id, { onDelete: "cascade" })
			.notNull(),
		targetId: uuid("target_id")
			.references(() => workflowNodesTable.id, { onDelete: "cascade" })
			.notNull(),
		// schema.ts
		sourcePort: varchar("source_port", { length: 255 })
			.notNull()
			.default("default"),
		targetPort: varchar("target_port", { length: 255 })
			.notNull()
			.default("default"),
	},
	(t) => [
		index("workflow_conn_workflowId_idx").on(t.workflowId),
		unique("unique_connection").on(
			t.sourceId,
			t.sourcePort,
			t.targetId,
			t.targetPort,
		),
	],
);

export const workflowExecutionTable = pgTable(
	"workflow_executions",
	{
		id: uuid().defaultRandom().primaryKey(),
		workflowId: uuid("workflow_id")
			.references(() => userWorkflowsTable.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id")
			.references(() => usersTable.id, { onDelete: "cascade" })
			.notNull(),
		status: WorkflowStatusEnum().default("running").notNull(),
		executedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		result: text(),
	},
	(t) => [index("workflow_exec_workflowId_idx").on(t.workflowId)],
);

export const nodeExecutionTable = pgTable(
	"node_executions",
	{
		id: uuid().defaultRandom().primaryKey(),
		workflowExecutionId: uuid("workflow_execution_id")
			.references(() => workflowExecutionTable.id, { onDelete: "cascade" })
			.notNull(),
		workflowId: uuid("workflow_id")
			.references(() => userWorkflowsTable.id, { onDelete: "cascade" })
			.notNull(),
		instanceId: uuid("instance_id")
			.references(() => workflowNodesTable.id, { onDelete: "cascade" })
			.notNull(),
		executedAt: timestamp("executed_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		output: jsonb("output").$type<unknown>(),
	},
	(t) => [
		index("node_exec_workflowId_idx").on(t.workflowId),
		index("node_workflow_execution_idx").on(t.workflowExecutionId),
	],
);

export const userWorkflowsRelations = relations(
	userWorkflowsTable,
	({ many }) => ({
		nodes: many(workflowNodesTable),
		connections: many(workflowConnectionsTable),
		executions: many(workflowExecutionTable),
	}),
);

export const workflowNodesRelations = relations(
	workflowNodesTable,
	({ one }) => ({
		workflow: one(userWorkflowsTable, {
			fields: [workflowNodesTable.workflowId],
			references: [userWorkflowsTable.id],
		}),
	}),
);

export const workflowConnectionsRelations = relations(
	workflowConnectionsTable,
	({ one }) => ({
		workflow: one(userWorkflowsTable, {
			fields: [workflowConnectionsTable.workflowId],
			references: [userWorkflowsTable.id],
		}),
	}),
);

export const workflowExecutionRelations = relations(
	workflowExecutionTable,
	({ one }) => ({
		workflow: one(userWorkflowsTable, {
			fields: [workflowExecutionTable.workflowId],
			references: [userWorkflowsTable.id],
		}),
	}),
);
