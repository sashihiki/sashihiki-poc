import { Container, Heading, VStack, Button, Box, Input, Textarea, Field, HStack, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useUsers } from '@/features/users/hooks/useUsers';
import {
  expenseFormSchema,
  type ExpenseFormInput,
  type ExpenseFormData,
} from '@/features/expenses/types';
import { useExpense } from '@/features/expenses/hooks/useExpense';
import { useUpdateExpense } from '@/features/expenses/hooks/useUpdateExpense';
import { useDeleteExpense } from '@/features/expenses/hooks/useDeleteExpense';
import { matchingKeys } from '@/features/matchings/hooks/keys';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/error';
import { PageLoading } from '@/components/PageLoading';
import { PageError } from '@/components/PageError';

export default function EditExpensePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = router.query;
  const expenseId = typeof id === 'string' ? id : undefined;

  const { data: users, isLoading: isLoadingUsers, error: usersError } = useUsers();
  const { data: expense, isLoading: isLoadingExpense, error: expenseError } = useExpense(expenseId);
  const error = usersError || expenseError;
  const updateExpense = useUpdateExpense(expenseId!);
  const deleteExpense = useDeleteExpense();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
  });

  useEffect(() => {
    if (expense) {
      reset({
        user_guid: expense.user_guid,
        name: expense.name,
        price: String(expense.price),
        note: expense.note || '',
        paid_at: new Date(expense.paid_at).toISOString().split('T')[0],
      });
    }
  }, [expense, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await updateExpense.mutateAsync(data);
      router.push('/expenses');
    } catch (error) {
      alert(getErrorMessage(error, '支出の更新に失敗しました'));
    }
  };

  const handleDelete = async () => {
    let message = 'この支出を削除してもよろしいですか?';

    // 紐づきマッチングがある場合は警告を追加
    if (expense?.linked_matchings && expense.linked_matchings.length > 0) {
      const matchingNames = expense.linked_matchings.map((m) => m.name).join('、');
      message = `この支出は以下のマッチングに紐づいています:\n\n${matchingNames}\n\n削除してもマッチングの精算には影響しませんが、支出一覧からは消えます。削除しますか?`;
    }

    if (!confirm(message)) {
      return;
    }

    try {
      await deleteExpense.mutateAsync(expenseId!);
      // Cross-feature cache invalidation at page level
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
      router.push('/expenses');
    } catch (error) {
      alert(getErrorMessage(error, '支出の削除に失敗しました'));
    }
  };

  if (error) {
    return <PageError error={error} backHref="/expenses" backLabel="支出一覧に戻る" />;
  }

  if (isLoadingUsers || isLoadingExpense) {
    return <PageLoading />;
  }

  if (!expense) {
    return (
      <Container maxW="3xl" py="8">
        <VStack gap="8">
          <Text>支出が見つかりませんでした</Text>
          <Button asChild>
            <Link href="/expenses">支出一覧に戻る</Link>
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="3xl" py="8">
      <VStack gap="6" align="stretch">
        <HStack justify="space-between">
          <Heading as="h1" size="2xl">
            支出の編集
          </Heading>
          <Button asChild variant="outline">
            <Link href="/expenses">戻る</Link>
          </Button>
        </HStack>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          borderWidth="1px"
          borderRadius="lg"
          p="6"
          bg="white"
        >
          <VStack gap="4" align="stretch">
            <Field.Root required invalid={!!errors.user_guid}>
              <Field.Label>ユーザー</Field.Label>
              <select
                {...register('user_guid')}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              >
                {users?.map((user) => (
                  <option key={user.guid} value={user.guid}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.user_guid && <Field.ErrorText>{errors.user_guid.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root required invalid={!!errors.name}>
              <Field.Label>支出名</Field.Label>
              <Input {...register('name')} placeholder="例: ランチ代" />
              {errors.name && <Field.ErrorText>{errors.name.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root required invalid={!!errors.price}>
              <Field.Label>金額</Field.Label>
              <Input type="number" {...register('price')} placeholder="0" min="0" />
              {errors.price && <Field.ErrorText>{errors.price.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root required invalid={!!errors.paid_at}>
              <Field.Label>支払日</Field.Label>
              <Input type="date" {...register('paid_at')} />
              {errors.paid_at && <Field.ErrorText>{errors.paid_at.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.note}>
              <Field.Label>メモ</Field.Label>
              <Textarea {...register('note')} placeholder="メモを入力" />
              {errors.note && <Field.ErrorText>{errors.note.message}</Field.ErrorText>}
            </Field.Root>

            <HStack justify="space-between" mt="4">
              <Button
                type="button"
                colorPalette="red"
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                削除
              </Button>
              <HStack gap="4">
                <Button asChild variant="outline">
                  <Link href="/expenses">キャンセル</Link>
                </Button>
                <Button
                  type="submit"
                  colorPalette="blue"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  更新
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
