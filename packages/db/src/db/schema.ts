import {
	CREDENTIALS_TYPE,
	EXECUTION_STATUSES,
	NODE_EXECUTION_STATUSES,
	type NodeParameters,
	type NodeSettings,
	WORKFLOW_STATUSES,
	type WorkflowConnection,
	type WorkflowNode,
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

export const workflowStatusEnum = pgEnum("workflow_status", WORKFLOW_STATUSES);
export const executionStatusEnum = pgEnum(
	"execution_status",
	EXECUTION_STATUSES,
);
export const nodeExecutionStatusEnum = pgEnum(
	"node_execution_status",
	NODE_EXECUTION_STATUSES,
);

export const nodeTypeEnum = pgEnum("nodesEnum", ["action", "trigger"]);

export const credentialTypesEnum = pgEnum("credentialTypes", CREDENTIALS_TYPE);

export const credentialsTable = pgTable("credentials", {
	id: uuid().defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.references(() => usersTable.id, { onDelete: "cascade" })
		.notNull(),
	type: credentialTypesEnum().notNull(),
	provider: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
	fields: jsonb("fields").$type<Record<string, string>>(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const usersTable = pgTable("users", {
	id: uuid().defaultRandom().primaryKey(),
	email: varchar({ length: 255 }).notNull().unique(),
	name: varchar({ length: 255 }).notNull(),
	googleOauthId: varchar("google_oauth_id", { length: 255 }).unique(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const passkeysTable = pgTable(
	"passkeys",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.references(() => usersTable.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar({ length: 255 }).notNull(),
		publicKey: text("public_key").notNull(),
		credentialId: text("credential_id").notNull().unique(),
		counter: integer("counter").notNull().default(0),
		transports: varchar("transports", { length: 255 }).array(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
	},
	(t) => [index("passkeys_userId_idx").on(t.userId)],
);

export const nodesTable = pgTable("nodes", {
	id: uuid().defaultRandom().primaryKey(),
	name: varchar({ length: 255 }).unique().notNull(),
	type: nodeTypeEnum().notNull(),
	task: varchar({ length: 255 }).unique().notNull(),
	description: text(),
	parameters: jsonb().$type<NodeParameters[]>().notNull(),
	credentialProvider: varchar("credential_provider", { length: 255 }),
	outputPorts: jsonb("output_ports")
		.$type<{ name: string; label: string }>()
		.array(),
	inputPorts: jsonb("input_ports")
		.$type<{ name: string; label: string }>()
		.array(),
	settings: jsonb("settings").$type<NodeSettings>().notNull(),
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
		status: workflowStatusEnum().$default(() => "active"),
		executionCount: integer("execution_count").notNull().default(0),
		lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
		credentialId: uuid("credential_id").references(() => credentialsTable.id, {
			onDelete: "set null",
		}),
		settings: jsonb("config").$type<NodeSettings>().notNull(),
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
		status: executionStatusEnum().default("running").notNull(),
		executedAt: timestamp("started_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
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
		status: nodeExecutionStatusEnum().notNull(),
		executedAt: timestamp("executed_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		output: jsonb("output").$type<unknown>(),
	},
	(t) => [
		index("node_exec_workflowId_idx").on(t.workflowId),
		index("node_workflow_execution_idx").on(t.workflowExecutionId),
	],
);

export const workflowSnapshotsTable = pgTable(
	"workflow_snapshots",
	{
		id: uuid().defaultRandom().primaryKey(),
		workflowId: uuid("workflow_id")
			.references(() => userWorkflowsTable.id, { onDelete: "cascade" })
			.notNull(),
		nodes: jsonb().$type<WorkflowNode[]>().notNull(),
		connections: jsonb().$type<WorkflowConnection[]>().notNull(),
		publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
	},
	(t) => [index("snapshot_workflowId_idx").on(t.workflowId)],
);

export const usersRelations = relations(usersTable, ({ many }) => ({
	passkeys: many(passkeysTable),
	credentials: many(credentialsTable),
	workflows: many(userWorkflowsTable),
}));

export const passkeysRelations = relations(passkeysTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [passkeysTable.userId],
		references: [usersTable.id],
	}),
}));

export const credentialsRelations = relations(
	credentialsTable,
	({ one, many }) => ({
		user: one(usersTable, {
			fields: [credentialsTable.userId],
			references: [usersTable.id],
		}),
		workflowNodes: many(workflowNodesTable),
	}),
);

export const userWorkflowsRelations = relations(
	userWorkflowsTable,
	({ many }) => ({
		nodes: many(workflowNodesTable),
		connections: many(workflowConnectionsTable),
		executions: many(workflowExecutionTable),
		snapshots: many(workflowSnapshotsTable),
	}),
);

export const workflowNodesRelations = relations(
	workflowNodesTable,
	({ one }) => ({
		workflow: one(userWorkflowsTable, {
			fields: [workflowNodesTable.workflowId],
			references: [userWorkflowsTable.id],
		}),
		credential: one(credentialsTable, {
			fields: [workflowNodesTable.credentialId],
			references: [credentialsTable.id],
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

export const workflowSnapshotsRelations = relations(
	workflowSnapshotsTable,
	({ one }) => ({
		workflow: one(userWorkflowsTable, {
			fields: [workflowSnapshotsTable.workflowId],
			references: [userWorkflowsTable.id],
		}),
	}),
);
