import { Container, VStack, Spinner } from '@chakra-ui/react';

export const PageLoading = () => {
  return (
    <Container maxW="6xl" py="8">
      <VStack gap="8">
        <Spinner size="xl" />
      </VStack>
    </Container>
  );
};
