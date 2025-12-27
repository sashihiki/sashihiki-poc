import {
  Container,
  Heading,
  VStack,
  Button,
  Box,
  Table,
  Text,
  HStack,
  Badge,
  Card,
  Input,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserMap } from '@/features/users/hooks/useUserMap';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { expenseKeys } from '@/features/expenses/hooks/keys';
import type { Expense } from '@/features/expenses/types';
import { useMatching } from '@/features/matchings/hooks/useMatching';
import { useAddExpenseToMatching } from '@/features/matchings/hooks/useAddExpenseToMatching';
import { useRemoveExpenseFromMatching } from '@/features/matchings/hooks/useRemoveExpenseFromMatching';
import { useSettleMatching } from '@/features/matchings/hooks/useSettleMatching';
import { useDeleteMatching } from '@/features/matchings/hooks/useDeleteMatching';
import type { MatchingExpense } from '@/features/matchings/types';
import { PageLoading } from '@/components/PageLoading';
import { PageError } from '@/components/PageError';
import { formatDate, formatCurrency } from '@/lib/format';

export default function MatchingDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = router.query;
  const matchingId = typeof id === 'string' ? id : undefined;

  const { userMap, users, isLoading: isLoadingUsers, error: usersError } = useUserMap();
  const { data: allExpenses, isLoading: isLoadingExpenses, error: expensesError } = useExpenses();
  const {
    data: matching,
    isLoading: isLoadingMatching,
    error: matchingError,
  } = useMatching(matchingId);

  const addExpense = useAddExpenseToMatching(matchingId || '');
  const removeExpense = useRemoveExpenseFromMatching(matchingId || '');
  const settleMatching = useSettleMatching(matchingId || '');
  const deleteMatching = useDeleteMatching();

  // 請求額入力用のstate
  const [requestAmounts, setRequestAmounts] = useState<Record<string, string>>({});

  const loading = isLoadingUsers || isLoadingExpenses || isLoadingMatching;
  const error = usersError || expensesError || matchingError;
  const submitting =
    addExpense.isPending ||
    removeExpense.isPending ||
    settleMatching.isPending ||
    deleteMatching.isPending;

  // マッチング内の支出にユーザー名を追加
  const matchingExpenses = useMemo(() => {
    if (!matching?.expenses) return [];
    return matching.expenses.map((e: MatchingExpense) => ({
      ...e,
      user_name: userMap.get(e.user_guid) || 'Unknown',
    }));
  }, [matching, userMap]);

  // 利用可能な支出を計算（expense_guidでフィルタリング）
  const availableExpenses = useMemo(() => {
    if (!allExpenses || !matching?.expenses) return [];
    const matchingExpenseGuids = new Set(
      matching.expenses.map((e) => e.expense_guid).filter((g): g is string => g !== null)
    );
    return allExpenses
      .filter((e: Expense) => !matchingExpenseGuids.has(e.guid))
      .map((e: Expense) => ({
        ...e,
        user_name: userMap.get(e.user_guid) || 'Unknown',
      }));
  }, [allExpenses, matching, userMap]);

  const isSettled = matching?.settled_at !== null;

  const calculateBalance = () => {
    if (!matchingExpenses || matchingExpenses.length === 0 || !users || users.length === 0) {
      return null;
    }

    // 各ユーザーが相手に請求する合計額を計算
    const claims = new Map<string, number>();
    users.forEach((u) => claims.set(u.guid, 0));

    matchingExpenses.forEach((expense) => {
      // request_amount は「相手に請求する金額」
      // 未設定の場合は半額（切り捨て）
      const claimAmount = expense.request_amount ?? Math.floor(expense.price / 2);
      const current = claims.get(expense.user_guid) || 0;
      claims.set(expense.user_guid, current + claimAmount);
    });

    const userTotals = users.map((u) => ({
      user: u,
      total: claims.get(u.guid) || 0,
    }));

    const grandTotal = userTotals.reduce((sum, ut) => sum + ut.total, 0);

    // 2人の場合: 請求額の差分が精算額
    // User A の請求額 - User B の請求額 = User A の受取額（マイナスなら支払い）
    const balances = userTotals.map((ut, index) => {
      const otherTotal = userTotals[1 - index]?.total || 0;
      return {
        ...ut,
        balance: ut.total - otherTotal,
      };
    });

    return { userTotals, grandTotal, balances };
  };

  const handleAddExpense = async (expenseGuid: string) => {
    try {
      const expense = availableExpenses.find((e) => e.guid === expenseGuid);
      const requestAmountStr = requestAmounts[expenseGuid];
      // 未入力の場合は半額（切り捨て）をデフォルトとする
      const requestAmount = requestAmountStr
        ? parseInt(requestAmountStr, 10)
        : Math.floor((expense?.price || 0) / 2);
      await addExpense.mutateAsync({
        expense_guid: expenseGuid,
        request_amount: requestAmount,
      });
      // Cross-feature cache invalidation at page level
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      // 入力をクリア
      setRequestAmounts((prev) => {
        const next = { ...prev };
        delete next[expenseGuid];
        return next;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : '支出の追加に失敗しました');
    }
  };

  const handleRemoveExpense = async (expenseGuid: string) => {
    if (!confirm('この支出をマッチングから削除しますか?')) {
      return;
    }

    try {
      await removeExpense.mutateAsync(expenseGuid);
      // Cross-feature cache invalidation at page level
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    } catch (error) {
      alert(error instanceof Error ? error.message : '支出の削除に失敗しました');
    }
  };

  const handleSettle = async () => {
    if (!confirm('このマッチングを精算済みにしますか?')) {
      return;
    }

    try {
      await settleMatching.mutateAsync();
    } catch (error) {
      alert(error instanceof Error ? error.message : '精算処理に失敗しました');
    }
  };

  const handleDeleteMatching = async () => {
    if (!matchingId) return;

    if (!confirm('このマッチングを削除しますか？紐づいている支出情報も削除されます。')) {
      return;
    }

    try {
      await deleteMatching.mutateAsync(matchingId);
      router.push('/matchings');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'マッチングの削除に失敗しました');
    }
  };

  if (error) {
    return <PageError error={error} backHref="/matchings" backLabel="マッチング一覧に戻る" />;
  }

  if (loading) {
    return <PageLoading />;
  }

  if (!matching) {
    return (
      <Container maxW="6xl" py="8">
        <VStack gap="8">
          <Text>マッチングが見つかりませんでした</Text>
          <Button asChild>
            <Link href="/matchings">マッチング一覧に戻る</Link>
          </Button>
        </VStack>
      </Container>
    );
  }

  const balance = calculateBalance();

  return (
    <Container maxW="6xl" py="8">
      <VStack gap="6" align="stretch">
        <HStack justify="space-between">
          <VStack align="start" gap="2">
            <Heading as="h1" size="2xl">
              {matching.name}
            </Heading>
            <Badge colorPalette={isSettled ? 'green' : 'blue'} size="lg">
              {isSettled ? '精算済み' : '未精算'}
            </Badge>
          </VStack>
          <HStack gap="2">
            <Button
              variant="outline"
              colorPalette="red"
              onClick={handleDeleteMatching}
              disabled={submitting}
            >
              削除
            </Button>
            <Button asChild variant="outline">
              <Link href="/matchings">一覧に戻る</Link>
            </Button>
          </HStack>
        </HStack>

        {/* 差額計算 */}
        {balance && (
          <Card.Root>
            <Card.Header>
              <Heading size="lg">差額計算</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap="4" align="stretch">
                {balance.userTotals.map((ut) => (
                  <HStack key={ut.user.guid} justify="space-between">
                    <Text fontWeight="medium">{ut.user.name}の請求額合計</Text>
                    <Text fontSize="lg">{formatCurrency(ut.total)}</Text>
                  </HStack>
                ))}
                <Box borderTopWidth="1px" pt="4">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">請求額合計</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {formatCurrency(balance.grandTotal)}
                    </Text>
                  </HStack>
                </Box>
                {users && users.length === 2 && (
                  <Box bg="blue.50" p="4" borderRadius="md">
                    {(() => {
                      const diff = balance.balances[0].balance;
                      if (Math.abs(diff) < 1) {
                        return (
                          <Text textAlign="center" fontWeight="medium">
                            差額なし（精算不要）
                          </Text>
                        );
                      }
                      const payer = diff > 0 ? balance.balances[1].user : balance.balances[0].user;
                      const receiver =
                        diff > 0 ? balance.balances[0].user : balance.balances[1].user;
                      return (
                        <Text textAlign="center" fontWeight="medium" fontSize="lg">
                          {payer.name}さんが{receiver.name}さんに{formatCurrency(Math.abs(diff))}
                          支払う
                        </Text>
                      );
                    })()}
                  </Box>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* マッチング内の支出 */}
        <Box>
          <HStack justify="space-between" mb="4">
            <Heading size="lg">マッチング内の支出</Heading>
            {!isSettled && (
              <Button colorPalette="green" onClick={handleSettle} loading={submitting}>
                精算する
              </Button>
            )}
          </HStack>

          {matchingExpenses.length === 0 ? (
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
                    <Table.ColumnHeader>請求額</Table.ColumnHeader>
                    <Table.ColumnHeader>支払日</Table.ColumnHeader>
                    {!isSettled && <Table.ColumnHeader>操作</Table.ColumnHeader>}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {matchingExpenses.map((expense) => (
                    <Table.Row
                      key={expense.matching_expense_id}
                      opacity={expense.is_deleted ? 0.6 : 1}
                    >
                      <Table.Cell>{expense.user_name}</Table.Cell>
                      <Table.Cell fontWeight="medium">
                        {expense.name}
                        {expense.is_deleted && (
                          <Badge ml="2" colorPalette="gray" size="sm">
                            削除済み
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>{formatCurrency(expense.price)}</Table.Cell>
                      <Table.Cell>
                        {expense.request_amount !== null
                          ? formatCurrency(expense.request_amount)
                          : '-'}
                      </Table.Cell>
                      <Table.Cell>{formatDate(expense.paid_at)}</Table.Cell>
                      {!isSettled && (
                        <Table.Cell>
                          {expense.expense_guid && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorPalette="red"
                              onClick={() => handleRemoveExpense(expense.expense_guid!)}
                              disabled={submitting}
                            >
                              削除
                            </Button>
                          )}
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Box>

        {/* 追加可能な支出 */}
        {!isSettled && (
          <Box>
            <Heading size="lg" mb="4">
              追加可能な支出
            </Heading>

            {availableExpenses.length === 0 ? (
              <Box p="8" textAlign="center" borderWidth="1px" borderRadius="lg" bg="white">
                <Text color="gray.500">追加可能な支出がありません</Text>
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
                      <Table.ColumnHeader>請求額</Table.ColumnHeader>
                      <Table.ColumnHeader>操作</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {availableExpenses.map((expense) => (
                      <Table.Row key={expense.guid}>
                        <Table.Cell>{expense.user_name}</Table.Cell>
                        <Table.Cell fontWeight="medium">{expense.name}</Table.Cell>
                        <Table.Cell>{formatCurrency(expense.price)}</Table.Cell>
                        <Table.Cell>{formatDate(expense.paid_at)}</Table.Cell>
                        <Table.Cell>
                          <Input
                            type="number"
                            size="sm"
                            w="100px"
                            placeholder={String(Math.floor(expense.price / 2))}
                            value={requestAmounts[expense.guid] ?? ''}
                            onChange={(e) =>
                              setRequestAmounts((prev) => ({
                                ...prev,
                                [expense.guid]: e.target.value,
                              }))
                            }
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="sm"
                            colorPalette="blue"
                            onClick={() => handleAddExpense(expense.guid)}
                            disabled={submitting}
                          >
                            追加
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
}
