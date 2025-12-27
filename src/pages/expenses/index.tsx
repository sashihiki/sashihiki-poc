import { Container, Heading, VStack, Button, Box, Table, Text, HStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useUserMap } from '@/features/users/hooks/useUserMap';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { PageLoading } from '@/components/PageLoading';
import { PageError } from '@/components/PageError';
import { formatDate, formatCurrency } from '@/lib/format';

export default function ExpensesPage() {
  const { userMap, users, isLoading: isLoadingUsers, error: usersError } = useUserMap();
  const { data: expenses, isLoading: isLoadingExpenses, error: expensesError } = useExpenses();
  const [selectedUserGuid, setSelectedUserGuid] = useState<string>('all');

  const loading = isLoadingUsers || isLoadingExpenses;
  const error = usersError || expensesError;

  const expensesWithUser = useMemo(() => {
    return (
      expenses?.map((e) => ({
        ...e,
        user_name: userMap.get(e.user_guid) || `User`,
      })) || []
    );
  }, [expenses, userMap]);

  const filteredExpenses = useMemo(() => {
    if (selectedUserGuid === 'all') return expensesWithUser;
    return expensesWithUser.filter((e) => e.user_guid === selectedUserGuid);
  }, [expensesWithUser, selectedUserGuid]);

  if (error) {
    return <PageError error={error} />;
  }

  if (loading) {
    return <PageLoading />;
  }

  return (
    <Container maxW="6xl" py="8">
      <VStack gap="6" align="stretch">
        <HStack justify="space-between">
          <Heading as="h1" size="2xl">
            支出一覧
          </Heading>
          <Button asChild colorPalette="blue">
            <Link href="/expenses/new">新規作成</Link>
          </Button>
        </HStack>

        <HStack gap="4">
          <Text fontWeight="medium">ユーザー絞り込み:</Text>
          <select
            value={selectedUserGuid}
            onChange={(e) => setSelectedUserGuid(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="all">すべて</option>
            {users?.map((user) => (
              <option key={user.guid} value={user.guid}>
                {user.name}
              </option>
            ))}
          </select>
        </HStack>

        {filteredExpenses.length === 0 ? (
          <Box p="8" textAlign="center" borderWidth="1px" borderRadius="lg" bg="white">
            <Text color="gray.500">支出がありません</Text>
          </Box>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>ユーザー</Table.ColumnHeader>
                  <Table.ColumnHeader>支出名</Table.ColumnHeader>
                  <Table.ColumnHeader>金額</Table.ColumnHeader>
                  <Table.ColumnHeader>支払日</Table.ColumnHeader>
                  <Table.ColumnHeader>操作</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredExpenses.map((expense) => (
                  <Table.Row key={expense.guid}>
                    <Table.Cell>{expense.user_name}</Table.Cell>
                    <Table.Cell fontWeight="medium">{expense.name}</Table.Cell>
                    <Table.Cell>{formatCurrency(expense.price)}</Table.Cell>
                    <Table.Cell>{formatDate(expense.paid_at)}</Table.Cell>
                    <Table.Cell>
                      <Button asChild size="sm" variant="outline" colorPalette="blue">
                        <Link href={`/expenses/${expense.guid}/edit`}>編集</Link>
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
