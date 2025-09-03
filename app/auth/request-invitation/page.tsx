'use client'

import { Container, Paper, Title, Text, Button, Stack, Group, ThemeIcon, TextInput, Textarea, Alert } from '@mantine/core'
import { IconMail, IconArrowLeft, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { useState } from 'react'
import Link from 'next/link'

export default function RequestInvitation() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    position: '',
    notes: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/invitation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit request')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
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
              <ThemeIcon 
                size={80} 
                radius="xl" 
                variant="light" 
                color="green"
              >
                <IconCheck size={40} />
              </ThemeIcon>

              <Title order={2} ta="center" c="green">
                Request Submitted!
              </Title>

              <Text ta="center" c="dimmed" size="md">
                Thank you for your interest! We've received your invitation request and our team will review it soon.
              </Text>

              <Alert icon={<IconMail size={16} />} color="blue" style={{ width: '100%' }}>
                <Text size="sm">
                  You'll receive an email confirmation shortly. Our team typically reviews requests within 1-2 business days.
                </Text>
              </Alert>

              <Group gap="md" style={{ width: '100%' }}>
                <Button
                  component={Link}
                  href="/"
                  leftSection={<IconArrowLeft size={16} />}
                  variant="light"
                  fullWidth
                >
                  Return to Homepage
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Container>
      </div>
    )
  }

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
          <Stack gap="lg">
            {/* Header */}
            <div>
              <Title order={2} ta="center" mb="xs">
                Request Platform Access
              </Title>
              <Text ta="center" c="dimmed" size="md">
                Fill out this form and we'll review your request for platform access.
              </Text>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {error}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <Group grow gap="md">
                  <TextInput
                    label="First Name"
                    placeholder="Enter your first name"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Enter your last name"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </Group>

                <TextInput
                  label="Email Address"
                  placeholder="Enter your email address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />

                <Group grow gap="md">
                  <TextInput
                    label="Company"
                    placeholder="Your company name"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                  <TextInput
                    label="Position"
                    placeholder="Your job title"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  />
                </Group>

                <Textarea
                  label="Additional Notes"
                  placeholder="Tell us why you'd like access to our platform..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />

                <Stack gap="sm">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    leftSection={<IconMail size={16} />}
                    size="md"
                    fullWidth
                  >
                    Submit Request
                  </Button>
                  
                  <Button
                    component={Link}
                    href="/auth/access-denied"
                    variant="light"
                    color="gray"
                    size="md"
                    fullWidth
                  >
                    Back
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </div>
  )
}
