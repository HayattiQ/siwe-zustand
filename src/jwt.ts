import { type RefinementCtx, z } from "zod";

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
	sub: z.string().startsWith("0x"),
	role: z.literal("authenticated"),
	aud: z.literal("authenticated"),
	iat: z.number().int().positive(),
	exp: z.number().int().positive(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

export const RequestCoinCreationPayloadSchema = z.object({
	name: z
		.string()
		.min(1, "トークン名は1文字以上で入力してください。")
		.max(50, "トークン名は50文字以内で入力してください。"),
	symbol: z
		.string()
		.min(3, "トークンシンボルは3文字以上で入力してください。")
		.max(8, "トークンシンボルは8文字以内で入力してください。")
		.regex(
			/^[A-Z0-9]+$/,
			"トークンシンボルは英大文字アルファベットと数字のみ使用できます。",
		),
	logo_url: z
		.string()
		.url("ロゴURLは有効なURL形式で入力してください。")
		.optional(),
	description: z
		.string()
		.min(1, "コイン説明は1文字以上で入力してください。")
		.max(1000, "コイン説明は1000文字以内で入力してください。"),
	reserve_token_address: z
		.string()
		.min(1, "準備金トークンを選択してください。"), // Consider more specific address validation later
	mint_royalty_bps: z
		.number()
		.int()
		.min(0, "ミントロイヤリティは0以上で入力してください。")
		.max(1000, "ミントロイヤリティは10%以下で入力してください (1000 BPS)。"), // max 1000 (10%)
	burn_royalty_bps: z
		.number()
		.int()
		.min(0, "バーンロイヤリティは0以上で入力してください。")
		.max(1000, "バーンロイヤリティは10%以下で入力してください (1000 BPS)。"), // max 1000 (10%)
	bonding_curve_steps: z
		.array(
			z.object({
				range: z
					.string()
					.refine(
						(val: string) => /^\d+$/.test(val) && Number.parseInt(val, 10) > 0,
						{
							message: "ステップ範囲は正の整数で入力してください。",
						},
					),
				price: z
					.string()
					.refine(
						(val: string) =>
							/^\d+(\.\d+)?$/.test(val) && Number.parseFloat(val) >= 0,
						{
							message: "ステップ価格は0以上の数値で入力してください。",
						},
					),
			}),
		)
		.min(1, "ボンディングカーブステップを1つ以上設定してください。"),
	manual_verification_requested: z.boolean(),
});

export type RequestCoinCreationPayload = z.infer<
	typeof RequestCoinCreationPayloadSchema
>;

// Schema for confirming coin creation payload
export const ConfirmCoinCreationPayloadSchema = z
	.object({
		coin_id: z.string().uuid({ message: "無効な coin_id 形式です。" }),
		transaction_hash: z
			.string()
			.regex(/^0x[a-fA-F0-9]{64}$/, "無効なトランザクションハッシュ形式です。"),
		status: z.enum(["confirmed", "reverted"], {
			errorMap: () => ({
				message:
					"status は 'confirmed' または 'reverted' である必要があります。",
			}),
		}),
		contract_address: z
			.string()
			.regex(/^0x[a-fA-F0-9]{40}$/, "無効なコントラクトアドレス形式です。")
			.optional(),
		error_message: z.string().optional(),
	})
	.superRefine(
		(
			data: {
				status: "confirmed" | "reverted";
				contract_address?: string | undefined;
			},
			ctx: RefinementCtx,
		) => {
			if (data.status === "confirmed" && !data.contract_address) {
				ctx.addIssue({
					code: "custom",
					message:
						"status が 'confirmed' の場合、contract_address は必須です。",
					path: ["contract_address"],
				});
			}
			if (data.status === "reverted" && data.contract_address) {
				ctx.addIssue({
					code: "custom",
					message:
						"status が 'reverted' の場合、contract_address は指定できません。",
					path: ["contract_address"],
				});
			}
		},
	);

export type ConfirmCoinCreationPayload = z.infer<
	typeof ConfirmCoinCreationPayloadSchema
>;

// Common error response schema (can be used by both frontend and functions if needed)
export const FunctionErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		data: z.unknown().optional(), // any から unknown に変更
	}),
});
export type FunctionErrorResponse = z.infer<typeof FunctionErrorResponseSchema>;
