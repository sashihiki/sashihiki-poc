import {
  Container,
  Heading,
  VStack,
  Button,
  Box,
  Input,
  Field,
  HStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUsers } from '@/features/users/hooks/useUsers';
import { matchingFormSchema, type MatchingFormData } from '@/features/matchings/types';
import { useCreateMatching } from '@/features/matchings/hooks/useCreateMatching';
import { PageLoading } from '@/components/PageLoading';
import { PageError } from '@/components/PageError';

export default function NewMatchingPage() {
  const router = useRouter();
  const { data: users, isLoading: isLoadingUsers, error } = useUsers();
  const createMatching = useCreateMatching();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MatchingFormData>({
    resolver: zodResolver(matchingFormSchema),
    defaultValues: {
      name: '',
      created_user_guid: '',
    },
  });

  const onSubmit = async (data: MatchingFormData) => {
    try {
      const result = await createMatching.mutateAsync(data);
      if (result.matching?.guid) {
        router.push(`/matchings/${result.matching.guid}`);
      } else {
        router.push('/matchings');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'マッチングの作成に失敗しました');
    }
  };

  if (error) {
    return <PageError error={error} backHref="/matchings" backLabel="マッチング一覧に戻る" />;
  }

  if (isLoadingUsers) {
    return <PageLoading />;
  }

  return (
    <Container maxW="3xl" py="8">
      <VStack gap="6" align="stretch">
        <HStack justify="space-between">
          <Heading as="h1" size="2xl">
            マッチングの新規作成
          </Heading>
          <Button asChild variant="outline">
            <Link href="/matchings">戻る</Link>
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
            <Field.Root required invalid={!!errors.name}>
              <Field.Label>マッチング名</Field.Label>
              <Input {...register('name')} placeholder="例: 2024年12月の精算" />
              {errors.name && <Field.ErrorText>{errors.name.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root required invalid={!!errors.created_user_guid}>
              <Field.Label>作成者</Field.Label>
              <select
                {...register('created_user_guid')}
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
              {errors.created_user_guid && (
                <Field.ErrorText>{errors.created_user_guid.message}</Field.ErrorText>
              )}
            </Field.Root>

            <HStack justify="flex-end" gap="4" mt="4">
              <Button asChild variant="outline">
                <Link href="/matchings">キャンセル</Link>
              </Button>
              <Button
                type="submit"
                colorPalette="green"
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
