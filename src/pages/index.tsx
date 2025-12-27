import {
  Box,
  Container,
  Heading,
  VStack,
  Button,
  HStack,
  Text,
  Card,
  Badge,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useMatchings } from '@/features/matchings/hooks/useMatchings';
import { PageLoading } from '@/components/PageLoading';
import { PageError } from '@/components/PageError';

export default function DashboardPage() {
  const { data: matchings, isLoading: isLoadingMatchings, error: matchingsError } = useMatchings();

  const loading = isLoadingMatchings;
  const error = matchingsError;

  const unsettledMatchings = useMemo(
    () => matchings?.filter((m) => m.settled_at === null) || [],
    [matchings]
  );

  const settledMatchings = useMemo(
    () => matchings?.filter((m) => m.settled_at !== null) || [],
    [matchings]
  );

  if (error) {
    return <PageError error={error} />;
  }

  if (loading) {
    return <PageLoading />;
  }

  return (
    <Container maxW="6xl" py="8">
      <VStack gap="8" align="stretch">
        {/* 未精算マッチング */}
        <Box>
          <HStack justify="space-between" mb="4">
            <Heading as="h2" size="lg">
              未精算マッチング
            </Heading>
            <Badge colorPalette="blue" size="lg">
              {unsettledMatchings.length}件
            </Badge>
          </HStack>
          {unsettledMatchings.length === 0 ? (
            <Box p="6" textAlign="center" borderWidth="1px" borderRadius="lg" bg="white">
              <Text color="gray.500">未精算のマッチングはありません</Text>
            </Box>
          ) : (
            <VStack gap="3" align="stretch">
              {unsettledMatchings.slice(0, 5).map((matching) => (
                <Card.Root key={matching.guid}>
                  <Card.Body>
                    <HStack justify="space-between">
                      <VStack align="start" gap="1">
                        <Text fontWeight="bold">{matching.name}</Text>
                        <Text color="gray.500" fontSize="sm">
                          作成日: {new Date(matching.created_at).toLocaleDateString('ja-JP')}
                        </Text>
                      </VStack>
                      <Button asChild size="sm" colorPalette="green">
                        <Link href={`/matchings/${matching.guid}`}>詳細を見る</Link>
                      </Button>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              ))}
              {unsettledMatchings.length > 5 && (
                <Button asChild variant="outline">
                  <Link href="/matchings">すべて表示 ({unsettledMatchings.length}件)</Link>
                </Button>
              )}
            </VStack>
          )}
        </Box>

        {/* 精算済みマッチング */}
        <Box>
          <HStack justify="space-between" mb="4">
            <Heading as="h2" size="lg">
              精算済みマッチング
            </Heading>
            <Badge colorPalette="green" size="lg">
              {settledMatchings.length}件
            </Badge>
          </HStack>
          {settledMatchings.length === 0 ? (
            <Box p="6" textAlign="center" borderWidth="1px" borderRadius="lg" bg="white">
              <Text color="gray.500">精算済みのマッチングはありません</Text>
            </Box>
          ) : (
            <VStack gap="3" align="stretch">
              {settledMatchings.slice(0, 3).map((matching) => (
                <Card.Root key={matching.guid}>
                  <Card.Body>
                    <HStack justify="space-between">
                      <VStack align="start" gap="1">
                        <HStack>
                          <Text fontWeight="bold">{matching.name}</Text>
                          <Badge colorPalette="green">精算済み</Badge>
                        </HStack>
                        <Text color="gray.500" fontSize="sm">
                          精算日:{' '}
                          {matching.settled_at
                            ? new Date(matching.settled_at).toLocaleDateString('ja-JP')
                            : '-'}
                        </Text>
                      </VStack>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/matchings/${matching.guid}`}>詳細を見る</Link>
                      </Button>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              ))}
              {settledMatchings.length > 3 && (
                <Button asChild variant="outline">
                  <Link href="/matchings">すべて表示 ({settledMatchings.length}件)</Link>
                </Button>
              )}
            </VStack>
          )}
        </Box>
      </VStack>
    </Container>
  );
}
