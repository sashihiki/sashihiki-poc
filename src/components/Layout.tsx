import { Box, Container, Flex, Heading, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();

  const isActive = (path: string) =>
    router.pathname === path || router.pathname.startsWith(path + '/');

  return (
    <Box minH="100vh" bg="gray.50">
      <Box as="header" bg="white" borderBottom="1px" borderColor="gray.200" py="4">
        <Container maxW="6xl">
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="lg">
              <Link href="/" style={{ textDecoration: 'none' }}>
                差し引き
              </Link>
            </Heading>
            <Flex gap="4">
              <Button
                asChild
                variant={isActive('/expenses') ? 'solid' : 'outline'}
                colorPalette="blue"
              >
                <Link href="/expenses">支出</Link>
              </Button>
              <Button
                asChild
                variant={isActive('/matchings') ? 'solid' : 'outline'}
                colorPalette="green"
              >
                <Link href="/matchings">マッチング</Link>
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>
      <Box as="main" py="8">
        {children}
      </Box>
    </Box>
  );
};
