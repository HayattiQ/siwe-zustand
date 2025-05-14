import { z } from "zod";

export const JwtPayloadSchema = z.object({
	address: z.string().startsWith("0x"),
	sub: z.string().uuid(),
	role: z.literal("authenticated"),
	aud: z.literal("authenticated"),
	iat: z.number().int().positive(),
	exp: z.number().int().positive(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
