'use client'

import { Container, Paper, Title, Text, Button, Stack, Group, ThemeIcon, List, Center } from '@mantine/core'
import { IconShieldX, IconMail, IconHome, IconUserPlus } from '@tabler/icons-react'
import Link from 'next/link'

export default function AccessDenied() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--mantine-color-gray-0)',
      padding: '1rem'
    }}>
      <Container size="sm">
        <Paper 
          shadow="lg" 
          p="xl" 
          radius="md" 
          style={{ maxWidth: 500, margin: '0 auto' }}
        >
          <Stack align="center" gap="lg">
            {/* Icon */}
            <ThemeIcon 
              size={80} 
              radius="xl" 
              variant="light" 
              color="red"
            >
              <IconShieldX size={40} />
            </ThemeIcon>

            {/* Title */}
            <Title order={2} ta="center" c="red">
              Account Not Found
            </Title>

            {/* Description */}
            <Text ta="center" c="dimmed" size="md">
              We couldn't find your account in our system. This usually means you haven't been invited to this platform yet.
            </Text>

            {/* What this means list */}
            <Paper p="md" radius="sm" style={{ backgroundColor: 'var(--mantine-color-gray-1)', width: '100%' }}>
              <Text size="sm" fw={500} mb="xs">
                This could happen if:
              </Text>
              <List size="sm" spacing="xs" c="dimmed">
                <List.Item>You haven't received an invitation yet</List.Item>
                <List.Item>Your invitation is still being processed</List.Item>
                <List.Item>There was a typo in your email address</List.Item>
              </List>
            </Paper>

            {/* Call to Actions */}
            <Stack gap="md" style={{ width: '100%' }}>
              <Text ta="center" fw={500} size="sm">
                What would you like to do next?
              </Text>
              
              <Group grow gap="md">
                <Button
                  component={Link}
                  href="/auth/request-invitation"
                  leftSection={<IconUserPlus size={16} />}
                  variant="filled"
                  color="blue"
                  size="md"
                >
                  Request Invitation
                </Button>
                
                <Button
                  component={Link}
                  href="/"
                  leftSection={<IconHome size={16} />}
                  variant="light"
                  color="gray"
                  size="md"
                >
                  Go to Homepage
                </Button>
              </Group>
            </Stack>

            {/* Support contact */}
            <Paper p="md" radius="sm" style={{ backgroundColor: 'var(--mantine-color-blue-0)', width: '100%' }}>
              <Group gap="sm">
                <ThemeIcon size="sm" variant="light" color="blue">
                  <IconMail size={14} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>
                    Need help?
                  </Text>
                  <Text size="xs" c="dimmed">
                    Contact your administrator or email support for assistance
                  </Text>
                </div>
              </Group>
            </Paper>
          </Stack>
        </Paper>
      </Container>
    </div>
  )
}
