'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Paper, 
  Text, 
  Group, 
  Badge, 
  Table, 
  Avatar, 
  ActionIcon,
  Button,
  Modal,
  TextInput,
  Select,
  Stack,
  LoadingOverlay,
  Center,
  SimpleGrid,
  ThemeIcon,
  CopyButton,
  Tooltip
} from '@mantine/core';
import { 
  IconEdit, 
  IconTrash, 
  IconPlus,
  IconMail,
  IconCopy,
  IconCheck,
  IconUsers,
  IconSend,
  IconClock,
  IconUserPlus
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';

interface Invitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES_PERSON' | 'CUSTOMER';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  token?: string;
}

export default function InvitePage() {
  const params = useParams<{ teamId: string }>();
  const { data: session } = useSession();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    role: 'SALES_PERSON' as 'ADMIN' | 'MANAGER' | 'SALES_PERSON' | 'CUSTOMER'
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      
      // Mock data for immediate display
      const mockInvitations: Invitation[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          role: 'SALES_PERSON',
          status: 'PENDING',
          invitedBy: session?.user?.name || 'You',
          invitedAt: '2024-01-15',
          expiresAt: '2024-01-22',
          token: 'abc123'
        },
        {
          id: '2',
          email: 'sarah.manager@example.com',
          role: 'MANAGER',
          status: 'ACCEPTED',
          invitedBy: session?.user?.name || 'You',
          invitedAt: '2024-01-12',
          expiresAt: '2024-01-19'
        },
        {
          id: '3',
          email: 'mike.sales@example.com',
          role: 'SALES_PERSON',
          status: 'EXPIRED',
          invitedBy: session?.user?.name || 'You',
          invitedAt: '2024-01-08',
          expiresAt: '2024-01-15'
        },
        {
          id: '4',
          email: 'customer@example.com',
          role: 'CUSTOMER',
          status: 'PENDING',
          invitedBy: session?.user?.name || 'You',
          invitedAt: '2024-01-14',
          expiresAt: '2024-01-21',
          token: 'def456'
        }
      ];
      
      setInvitations(mockInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (invitation: Invitation) => {
    setEditingInvitation(invitation);
    setFormData({
      email: invitation.email,
      role: invitation.role
    });
    open();
  };

  const handleAdd = () => {
    setEditingInvitation(null);
    setFormData({
      email: '',
      role: 'SALES_PERSON'
    });
    open();
  };

  const handleSubmit = async () => {
    // In real app, would make API call here
    const newInvitation: Invitation = {
      id: Date.now().toString(),
      email: formData.email,
      role: formData.role,
      status: 'PENDING',
      invitedBy: session?.user?.name || 'You',
      invitedAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      token: Math.random().toString(36).substr(2, 9)
    };
    
    setInvitations([newInvitation, ...invitations]);
    
    notifications.show({
      title: editingInvitation ? 'Invitation Updated' : 'Invitation Sent',
      message: `Invitation has been sent to ${formData.email}`,
      color: 'green',
    });
    close();
  };

  const handleDelete = (invitation: Invitation) => {
    notifications.show({
      title: 'Invitation Cancelled',
      message: `Invitation to ${invitation.email} has been cancelled.`,
      color: 'red',
    });
    setInvitations(invitations.filter(i => i.id !== invitation.id));
  };

  const handleResend = (invitation: Invitation) => {
    notifications.show({
      title: 'Invitation Resent',
      message: `Invitation has been resent to ${invitation.email}`,
      color: 'blue',
    });
  };

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/signup?token=${token}`;
  };

  const roleColors = {
    ADMIN: 'red',
    MANAGER: 'blue',
    SALES_PERSON: 'green',
    CUSTOMER: 'violet'
  };

  const statusColors = {
    PENDING: 'yellow',
    ACCEPTED: 'green',
    EXPIRED: 'red'
  };

  // Calculate statistics
  const pendingInvitations = invitations.filter(i => i.status === 'PENDING').length;
  const acceptedInvitations = invitations.filter(i => i.status === 'ACCEPTED').length;
  const expiredInvitations = invitations.filter(i => i.status === 'EXPIRED').length;

  const rows = invitations.map((invitation) => (
    <Table.Tr key={invitation.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar color="initials" name={invitation.email} />
          <div>
            <Text size="sm" fw={500}>
              {invitation.email}
            </Text>
            <Text size="xs" c="dimmed">
              Invited by {invitation.invitedBy}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge color={roleColors[invitation.role]}>
          {invitation.role.replace('_', ' ')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color={statusColors[invitation.status]}>
          {invitation.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(invitation.invitedAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c={new Date(invitation.expiresAt) < new Date() ? 'red' : 'dimmed'}>
          {new Date(invitation.expiresAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={5}>
          {invitation.status === 'PENDING' && invitation.token && (
            <CopyButton value={getInviteLink(invitation.token)}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy invite link'}>
                  <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          )}
          {invitation.status === 'PENDING' && (
            <ActionIcon variant="subtle" color="blue" onClick={() => handleResend(invitation)}>
              <IconSend size={16} />
            </ActionIcon>
          )}
          <ActionIcon variant="subtle" onClick={() => handleEdit(invitation)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(invitation)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <div className="p-6 space-y-6">
        <div>
          <Text size="xl" fw={700} mb="xs">Team Invitations</Text>
          <Text c="dimmed">
            Invite team members and manage access to your workspace
          </Text>
        </div>

        {/* Statistics Cards */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Pending Invitations
                </Text>
                <Text fw={700} size="xl">
                  {pendingInvitations}
                </Text>
              </div>
              <ThemeIcon color="yellow" variant="light" size={38} radius="md">
                <IconClock size={20} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Accepted Invitations
                </Text>
                <Text fw={700} size="xl">
                  {acceptedInvitations}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size={38} radius="md">
                <IconUserPlus size={20} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Expired Invitations
                </Text>
                <Text fw={700} size="xl">
                  {expiredInvitations}
                </Text>
              </div>
              <ThemeIcon color="red" variant="light" size={38} radius="md">
                <IconClock size={20} />
              </ThemeIcon>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Invitations Table */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>Invitation History</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
              Send Invitation
            </Button>
          </Group>
          
          <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} />
            
            {!loading && invitations.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="md">
                  <IconUsers size={48} color="gray" />
                  <Text c="dimmed">No invitations sent yet. Invite your first team member to get started.</Text>
                  <Button onClick={handleAdd}>Send Invitation</Button>
                </Stack>
              </Center>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Invited</Table.Th>
                    <Table.Th>Expires</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            )}
          </div>
        </Paper>
      </div>

      {/* Add/Edit Modal */}
      <Modal opened={opened} onClose={close} title={editingInvitation ? "Edit Invitation" : "Send Invitation"}>
        <Stack gap="md">
          <TextInput
            label="Email Address"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            leftSection={<IconMail size={16} />}
            disabled={!!editingInvitation} // Don't allow editing email for existing invitations
          />
          
          <Select
            label="Role"
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: (value as any) || 'SALES_PERSON' })}
            data={[
              { value: 'ADMIN', label: 'Admin - Full access' },
              { value: 'MANAGER', label: 'Manager - Team management' },
              { value: 'SALES_PERSON', label: 'Sales Person - Sales activities' },
              { value: 'CUSTOMER', label: 'Customer - Limited access' },
            ]}
            required
          />
          
          <Text size="sm" c="dimmed">
            The invitation will expire in 7 days. The invitee will receive an email with a signup link.
          </Text>
          
          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingInvitation ? 'Update Invitation' : 'Send Invitation'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
