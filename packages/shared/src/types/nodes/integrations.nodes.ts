import type z from "zod";
import type { gitHubNodeSchema, gmailNodeSchema } from "@/schemas/index.js";

export type GmailNode = z.infer<typeof gmailNodeSchema>;
export type GitHubNode = z.infer<typeof gitHubNodeSchema>;
