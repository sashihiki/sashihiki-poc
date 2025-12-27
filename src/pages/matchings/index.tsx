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
} from '@chakra-ui/react';
import Link from 'next/link';
import { useMatchings } from '@/features/matchings/hooks/useMatchings';
import type { ExpenseMatching } from '@/features/matchings/types';
import { PageLoading } from '@/components/PageLoading';
import { PageError } from '@/components/PageError';
import { formatDate } from '@/lib/format';

export default function MatchingsPage() {
  const { data: matchings, isLoading, error } = useMatchings();

  const isSettled = (matching: ExpenseMatching) => matching.settled_at !== null;

  if (error) {
    return <PageError error={error} />;
  }

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <Container maxW="6xl" py="8">
      <VStack gap="6" align="stretch">
        <HStack justify="space-between">
          <Heading as="h1" size="2xl">
            マッチング一覧
          </Heading>
          <Button asChild colorPalette="green">
            <Link href="/matchings/new">新規作成</Link>
          </Button>
        </HStack>

        {!matchings || matchings.length === 0 ? (
          <Box p="8" textAlign="center" borderWidth="1px" borderRadius="lg" bg="white">
            <Text color="gray.500">マッチングがありません</Text>
          </Box>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>マッチング名</Table.ColumnHeader>
                  <Table.ColumnHeader>ステータス</Table.ColumnHeader>
                  <Table.ColumnHeader>作成日</Table.ColumnHeader>
                  <Table.ColumnHeader>操作</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {matchings.map((matching) => (
                  <Table.Row key={matching.guid}>
                    <Table.Cell fontWeight="medium">{matching.name}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={isSettled(matching) ? 'green' : 'blue'}>
                        {isSettled(matching) ? '精算済み' : '未精算'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatDate(matching.created_at)}</Table.Cell>
                    <Table.Cell>
                      <Button asChild size="sm" variant="outline" colorPalette="green">
                        <Link href={`/matchings/${matching.guid}`}>詳細</Link>
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
