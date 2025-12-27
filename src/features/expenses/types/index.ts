import { z } from 'zod';

// フォームバリデーション用（HTML inputは文字列を返すため、stringで受けてnumberに変換）
export const expenseFormSchema = z.object({
  user_guid: z.string().min(1, 'ユーザーを選択してください'),
  name: z.string().min(1, '支出名を入力してください').max(255, '255文字以内で入力してください'),
  price: z
    .string()
    .min(1, '金額を入力してください')
    .transform((val) => Number(val))
    .pipe(z.number().min(0, '金額は0以上で入力してください')),
  note: z.string().max(1000, '1000文字以内で入力してください').optional().nullable(),
  paid_at: z.string().min(1, '支払日を選択してください'),
});

export type ExpenseFormInput = z.input<typeof expenseFormSchema>;
export type ExpenseFormData = z.output<typeof expenseFormSchema>;

// APIレスポンス用
export const linkedMatchingSchema = z.object({
  guid: z.string(),
  name: z.string(),
});

export type LinkedMatching = z.infer<typeof linkedMatchingSchema>;

export const expenseSchema = z.object({
  guid: z.string(),
  user_guid: z.string(),
  name: z.string(),
  price: z.number(),
  note: z.string().nullable(),
  paid_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  linked_matchings: z.array(linkedMatchingSchema),
});

export type Expense = z.infer<typeof expenseSchema>;
