'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Center, Stack, Card, Title, Text, Button, Alert } from '@mantine/core';
import { IconAlertTriangle, IconMail, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'Verification':
        return {
          title: 'Email Verification Failed',
          message: 'The verification link has expired or is invalid. Please request a new sign-in email.',
          suggestion: 'Try signing in again to get a fresh verification link.'
        };
      case 'Callback':
        return {
          title: 'Authentication Error',
          message: 'There was a problem with the authentication process.',
          suggestion: 'Please try signing in again.'
        };
      case 'OAuthSignin':
        return {
          title: 'Sign-in Error',
          message: 'Error occurred during the sign-in process.',
          suggestion: 'Please try a different sign-in method.'
        };
      case 'OAuthCallback':
        return {
          title: 'OAuth Error',
          message: 'Error occurred during OAuth callback.',
          suggestion: 'Please try signing in again.'
        };
      case 'OAuthCreateAccount':
        return {
          title: 'Account Creation Error',
          message: 'Could not create OAuth account.',
          suggestion: 'Please try again or contact support.'
        };
      case 'EmailCreateAccount':
        return {
          title: 'Email Account Error',
          message: 'Could not create account with this email.',
          suggestion: 'Please try again or contact support.'
        };
      case 'SessionRequired':
        return {
          title: 'Session Required',
          message: 'You need to be signed in to access this page.',
          suggestion: 'Please sign in to continue.'
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          suggestion: 'Please try again or contact support if the problem persists.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Center h="100vh" p="md">
      <Card shadow="md" padding="xl" radius="md" withBorder style={{ maxWidth: 500, width: '100%' }}>
        <Stack align="center" gap="lg">
          <IconAlertTriangle size={64} color="red" />
          
          <Stack align="center" gap="sm">
            <Title order={2} ta="center">{errorInfo.title}</Title>
            <Text c="dimmed" ta="center" size="sm">
              {errorInfo.message}
            </Text>
          </Stack>

          <Alert 
            icon={<IconMail size={16} />} 
            title="What happened?" 
            color="blue"
            variant="light"
            style={{ width: '100%' }}
          >
            <Text size="sm">{errorInfo.suggestion}</Text>
          </Alert>

          <Stack gap="sm" style={{ width: '100%' }}>
            <Button 
              component={Link}
              href="/auth/signin"
              leftSection={<IconRefresh size={16} />}
              fullWidth
            >
              Try Sign In Again
            </Button>
            
            <Button 
              component={Link}
              href="/"
              variant="light"
              fullWidth
            >
              Return to Home
            </Button>
          </Stack>

          {error && (
            <Text size="xs" c="dimmed" ta="center">
              Error Code: {error}
            </Text>
          )}
        </Stack>
      </Card>
    </Center>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <Center h="100vh">
        <Text>Loading...</Text>
      </Center>
    }>
      <ErrorContent />
    </Suspense>
  );
}
