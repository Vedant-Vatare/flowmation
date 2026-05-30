import { z } from "zod";

export const userSignupSchema = z.object({
	email: z.email({ message: "Invalid email field" }),
});

export const userLoginSchema = z.object({
	email: z.email({ message: "Invalid email field" }),
});
