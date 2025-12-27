import { z } from 'zod';

// フォームバリデーション用
export const matchingFormSchema = z.object({
  name: z
    .string()
    .min(1, 'マッチング名を入力してください')
    .max(255, '255文字以内で入力してください'),
  created_user_guid: z.string().min(1, '作成者を選択してください'),
});

export type MatchingFormData = z.infer<typeof matchingFormSchema>;

export const addExpenseToMatchingFormSchema = z.object({
  expense_guid: z.string(),
  request_amount: z.coerce.number().optional().nullable(),
});

export type AddExpenseToMatchingFormData = z.infer<typeof addExpenseToMatchingFormSchema>;

// APIレスポンス用
export const expenseMatchingSchema = z.object({
  guid: z.string(),
  name: z.string(),
  created_user_guid: z.string(),
  settled_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type ExpenseMatching = z.infer<typeof expenseMatchingSchema>;

// マッチング内の支出（スナップショット）
export const matchingExpenseSchema = z.object({
  matching_expense_id: z.number(),
  expense_guid: z.string().nullable(), // 削除済みの場合はnull
  user_guid: z.string(),
  name: z.string(),
  price: z.number(),
  paid_at: z.coerce.date(),
  request_amount: z.number().nullable(),
  is_deleted: z.boolean(),
});

export type MatchingExpense = z.infer<typeof matchingExpenseSchema>;
