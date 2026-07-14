import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const redisNodeValueSchemas = {
	operation: withExpr(z.string()),
	key: withExpr(z.string()),
	value: withExpr(z.string()),
	keyType: withExpr(z.string()),
	pattern: withExpr(z.string()),
	channel: withExpr(z.string()),
	data: withExpr(z.string()),
	tail: withExpr(z.string()),
	expire: withExpr(z.string()),
	ttl: withExpr(z.string()),
	getValues: withExpr(z.string()),
} as const;

const showFor = (operations: string[]) =>
	z
		.array(z.object({ parameter: z.string(), values: z.array(z.unknown()) }))
		.default([{ parameter: "operation", values: operations }]);

export const redisNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.redis"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: redisNodeValueSchemas.operation,
				default: z.literal("get").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Get", value: "get" },
						{ label: "Set", value: "set" },
						{ label: "Delete", value: "delete" },
						{ label: "Keys", value: "keys" },
						{ label: "Increment", value: "incr" },
						{ label: "Info", value: "info" },
						{ label: "Push", value: "push" },
						{ label: "Pop", value: "pop" },
						{ label: "List Length", value: "llen" },
						{ label: "Publish", value: "publish" },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Key"),
				name: z.literal("key"),
				type: z.literal("input"),
				value: redisNodeValueSchemas.key,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: showFor(["get", "set", "delete", "incr", "push", "pop", "llen"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Value"),
				name: z.literal("value"),
				type: z.literal("input"),
				value: redisNodeValueSchemas.value,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: showFor(["set", "push"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Key Type"),
				name: z.literal("keyType"),
				type: z.literal("dropdown"),
				value: redisNodeValueSchemas.keyType,
				default: z.literal("automatic").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Automatic", value: "automatic" },
						{ label: "String", value: "string" },
						{ label: "Hash", value: "hash" },
						{ label: "List", value: "list" },
						{ label: "Set", value: "sets" },
					]),
				dependsOn: showFor(["get", "set"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Key Pattern"),
				name: z.literal("pattern"),
				type: z.literal("input"),
				value: redisNodeValueSchemas.pattern,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: showFor(["keys"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Channel"),
				name: z.literal("channel"),
				type: z.literal("input"),
				value: redisNodeValueSchemas.channel,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: showFor(["publish"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Data"),
				name: z.literal("data"),
				type: z.literal("input"),
				value: redisNodeValueSchemas.data,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: showFor(["publish"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("End of List"),
				name: z.literal("tail"),
				type: z.literal("boolean"),
				value: redisNodeValueSchemas.tail,
				default: z.literal("false").optional(),
				required: z.boolean().default(false),
				description: z.string().optional(),
				dependsOn: showFor(["push", "pop"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Expire"),
				name: z.literal("expire"),
				type: z.literal("boolean"),
				value: redisNodeValueSchemas.expire,
				default: z.literal("false").optional(),
				required: z.boolean().default(false),
				description: z.string().optional(),
				dependsOn: showFor(["set", "incr"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("TTL (seconds)"),
				name: z.literal("ttl"),
				type: z.literal("number"),
				value: redisNodeValueSchemas.ttl,
				default: z.literal("60").optional(),
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(z.object({ parameter: z.string(), values: z.array(z.unknown()) }))
					.default([
						{ parameter: "operation", values: ["set", "incr"] },
						{ parameter: "expire", values: ["true"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Get Values"),
				name: z.literal("getValues"),
				type: z.literal("boolean"),
				value: redisNodeValueSchemas.getValues,
				default: z.literal("true").optional(),
				required: z.boolean().default(false),
				description: z.string().optional(),
				dependsOn: showFor(["keys"]),
			}),
		]),
	),
});
