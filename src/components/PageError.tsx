import { Container, VStack, Text, Button } from '@chakra-ui/react';
import Link from 'next/link';

type PageErrorProps = {
  error: Error | unknown;
  backHref?: string;
  backLabel?: string;
};

export const PageError = ({ error, backHref, backLabel }: PageErrorProps) => {
  const errorMessage = error instanceof Error ? error.message : 'データの取得に失敗しました';

  return (
    <Container maxW="6xl" py="8">
      <VStack gap="8">
        <Text color="red.500">エラーが発生しました: {errorMessage}</Text>
        {backHref && (
          <Button asChild>
            <Link href={backHref}>{backLabel || '戻る'}</Link>
          </Button>
        )}
      </VStack>
    </Container>
  );
};
