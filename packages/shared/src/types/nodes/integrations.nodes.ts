import type z from "zod";
import type { gmailNodeSchema } from "@/schemas/index.js";

export type GmailNode = z.infer<typeof gmailNodeSchema>;
