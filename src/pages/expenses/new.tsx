import {
  Container,
  Heading,
  VStack,
  Button,
  Box,
  Input,
  Textarea,
  Field,
  HStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUsers } from '@/features/users/hooks/useUsers';
import {
  expenseFormSchema,
  type ExpenseFormInput,
  type ExpenseFormData,
} from '@/features/expenses/types';
import { useCreateExpense } from '@/features/expenses/hooks/useCreateExpense';
import { getErrorMessage } from '@/lib/error';
import { PageLoading } from '@/components/PageLoading';
import { PageError } from '@/components/PageError';

export default function NewExpensePage() {
  const router = useRouter();
  const { data: users, isLoading: isLoadingUsers, error } = useUsers();
  const createExpense = useCreateExpense();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      user_guid: '',
      name: '',
      price: '',
      note: '',
      paid_at: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await createExpense.mutateAsync(data);
      router.push('/expenses');
    } catch (error) {
      alert(getErrorMessage(error, '支出の作成に失敗しました'));
    }
  };

  if (error) {
    return <PageError error={error} backHref="/expenses" backLabel="支出一覧に戻る" />;
  }

  if (isLoadingUsers) {
    return <PageLoading />;
  }

  return (
    <Container maxW="3xl" py="8">
      <VStack gap="6" align="stretch">
        <HStack justify="space-between">
          <Heading as="h1" size="2xl">
            支出の新規作成
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
                <option value="">選択してください</option>
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

            <HStack justify="flex-end" gap="4" mt="4">
              <Button asChild variant="outline">
                <Link href="/expenses">キャンセル</Link>
              </Button>
              <Button
                type="submit"
                colorPalette="blue"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                作成
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
