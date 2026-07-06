import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const trelloNodeValueSchemas = {
	operation: withExpr(z.string()),
	cardId: withExpr(z.string()),
	listId: withExpr(z.string()),
	boardId: withExpr(z.string()),
	name: withExpr(z.string()),
	description: withExpr(z.string()),
	commentText: withExpr(z.string()),
} as const;

export const trelloNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.trello"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: trelloNodeValueSchemas.operation,
				default: z.literal("create_card").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Card", value: "create_card" },
						{ label: "Get Card", value: "get_card" },
						{ label: "Update Card", value: "update_card" },
						{ label: "Add Comment", value: "add_comment" },
						{ label: "Create Board", value: "create_board" },
						{ label: "Get Board", value: "get_board" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Card ID"),
				name: z.literal("cardId"),
				type: z.literal("input"),
				value: trelloNodeValueSchemas.cardId,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("get_card"),
									z.literal("update_card"),
									z.literal("add_comment"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("List ID"),
				name: z.literal("listId"),
				type: z.literal("input"),
				value: trelloNodeValueSchemas.listId,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_card")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Board ID"),
				name: z.literal("boardId"),
				type: z.literal("input"),
				value: trelloNodeValueSchemas.boardId,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("get_board")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Name"),
				name: z.literal("name"),
				type: z.literal("input"),
				value: trelloNodeValueSchemas.name,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("create_card"), z.literal("create_board")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Description"),
				name: z.literal("description"),
				type: z.literal("textarea"),
				value: trelloNodeValueSchemas.description,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("create_card"),
									z.literal("update_card"),
									z.literal("create_board"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Comment Text"),
				name: z.literal("commentText"),
				type: z.literal("textarea"),
				value: trelloNodeValueSchemas.commentText,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("add_comment")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
