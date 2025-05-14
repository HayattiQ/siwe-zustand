import { z } from "zod";

// リクエストスキーマ
export const LoginRequestSchema = z.object({
	message: z.string().min(1, "メッセージは必須です"),
	signature: z.string().min(1, "署名は必須です"),
});

// レスポンススキーマ
export const LoginSuccessResponseSchema = z.object({
	token: z.string(),
});

export const ErrorResponseSchema = z.object({
	error: z.string(),
	message: z.string().optional(),
	details: z.unknown().optional(),
});

// JSON文字列からLoginRequestを直接パースするスキーマ
export const LoginRequestStringSchema = z
	.string()
	.transform((str: string, ctx: z.RefinementCtx) => {
		try {
			const parsed = JSON.parse(str);
			return LoginRequestSchema.parse(parsed);
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `有効なJSONではないか、期待する形式ではありません: ${errorMessage}`,
			});
			return z.NEVER;
		}
	});

// JSON文字列からLoginSuccessResponseを直接パースするスキーマ
export const LoginSuccessResponseStringSchema = z
	.string()
	.transform((str: string, ctx: z.RefinementCtx) => {
		try {
			const parsed = JSON.parse(str);
			return LoginSuccessResponseSchema.parse(parsed);
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `有効なJSONではないか、期待する形式ではありません: ${errorMessage}`,
			});
			return z.NEVER;
		}
	});

// JSON文字列からErrorResponseを直接パースするスキーマ
export const ErrorResponseStringSchema = z
	.string()
	.transform((str: string, ctx: z.RefinementCtx) => {
		try {
			const parsed = JSON.parse(str);
			return ErrorResponseSchema.parse(parsed);
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `有効なJSONではないか、期待する形式ではありません: ${errorMessage}`,
			});
			return z.NEVER;
		}
	});

// 型定義のエクスポート
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginSuccessResponse = z.infer<typeof LoginSuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// エラーレスポンスを生成するヘルパー関数
export function createErrorResponse(
	error: string,
	message?: string,
	details?: unknown,
): ErrorResponse {
	const response: ErrorResponse = { error };
	if (message) response.message = message;
	if (details) response.details = details;
	return response;
}


export const JwtPayloadSchema = z.object({
	address: z.string().startsWith("0x"),
	sub: z.string().uuid(),
	role: z.literal("authenticated"),
	aud: z.literal("authenticated"),
	iat: z.number().int().positive(),
	exp: z.number().int().positive(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
