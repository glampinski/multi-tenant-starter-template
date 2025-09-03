'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Shield, 
  Briefcase, 
  ShoppingCart,
  CheckSquare,
  Building
} from 'lucide-react';

// Import Mantine components
import { 
  Table, 
  ActionIcon,
  Badge, 
  Avatar,
  Group,
  Text,
  Button,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Progress,
  RingProgress,
  Center,
  Modal,
  TextInput,
  Select,
  Stack,
  Notification,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { 
  IconUsers, 
  IconTrendingUp, 
  IconCoin, 
  IconEdit, 
  IconTrash, 
  IconPlus,
  IconEye,
  IconNetwork,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';

// Mock data for immediate testing
const mockCustomers = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1-555-0123', status: 'ACTIVE', actualValue: 5420, referrals: 3 },
  { id: 2, firstName: 'Sarah', lastName: 'Wilson', email: 'sarah@example.com', phone: '+1-555-0124', status: 'ACTIVE', actualValue: 8930, referrals: 7 },
  { id: 3, firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com', phone: '+1-555-0125', status: 'INACTIVE', actualValue: 2100, referrals: 1 },
  { id: 4, firstName: 'Lisa', lastName: 'Brown', email: 'lisa@example.com', phone: '+1-555-0126', status: 'ACTIVE', actualValue: 12400, referrals: 12 },
];

const mockReferrals = [
  { id: 1, referrer: 'Sarah Wilson', referred: 'Mike Chen', commission: 250, tier: 1, date: '2024-01-15', status: 'PAID' },
  { id: 2, referrer: 'John Doe', referred: 'Anna Smith', commission: 180, tier: 2, date: '2024-01-14', status: 'PENDING' },
  { id: 3, referrer: 'Lisa Brown', referred: 'Tom Wilson', commission: 320, tier: 1, date: '2024-01-13', status: 'PAID' },
];

export function RoleBasedDashboard() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !teamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // For now, let's show a simple dashboard for all users
  const displayName = session.user.name || session.user.email || 'User';
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {displayName}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Team: {teamId}
          </p>
        </div>
        {/* Impersonation selector will be added later */}
      </div>
      
      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
      
      {/* Customer Management */}
      <CustomerManagement />
      
      {/* Referral Network */}
      <ReferralNetwork />
    </div>
  );
}

// Customer Management Component
function CustomerManagement() {
  const [opened, { open, close }] = useDisclosure(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'ACTIVE'
  });

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status
    });
    open();
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'ACTIVE'
    });
    open();
  };

  const handleSubmit = () => {
    notifications.show({
      title: editingCustomer ? 'Customer Updated' : 'Customer Added',
      message: `${formData.firstName} ${formData.lastName} has been ${editingCustomer ? 'updated' : 'added'} successfully.`,
      color: 'green',
      icon: <IconCheck size={16} />,
    });
    close();
  };

  const handleDelete = (customer: any) => {
    notifications.show({
      title: 'Customer Deleted',
      message: `${customer.firstName} ${customer.lastName} has been removed.`,
      color: 'red',
      icon: <IconTrash size={16} />,
    });
  };

  const rows = mockCustomers.map((customer) => (
    <Table.Tr key={customer.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar color="initials" name={`${customer.firstName} ${customer.lastName}`} />
          <div>
            <Text size="sm" fw={500}>
              {customer.firstName} {customer.lastName}
            </Text>
            <Text size="xs" c="dimmed">
              {customer.email}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>{customer.phone}</Table.Td>
      <Table.Td>
        <Badge color={customer.status === 'ACTIVE' ? 'green' : 'red'}>
          {customer.status}
        </Badge>
      </Table.Td>
      <Table.Td>${customer.actualValue.toLocaleString()}</Table.Td>
      <Table.Td>{customer.referrals}</Table.Td>
      <Table.Td>
        <Group gap={5}>
          <ActionIcon variant="subtle" onClick={() => handleEdit(customer)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(customer)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={500}>Customer Management</Text>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Add Customer
          </Button>
        </Group>
        
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Value</Table.Th>
              <Table.Th>Referrals</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editingCustomer ? "Edit Customer" : "Add Customer"}>
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </Group>
          <TextInput
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextInput
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
            data={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingCustomer ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

// Referral Network Component
function ReferralNetwork() {
  const rows = mockReferrals.map((referral) => (
    <Table.Tr key={referral.id}>
      <Table.Td>
        <Text size="sm" fw={500}>{referral.referrer}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{referral.referred}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color="blue">Tier {referral.tier}</Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>${referral.commission}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">{referral.date}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={referral.status === 'PAID' ? 'green' : 'yellow'}>
          {referral.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap={5}>
          <ActionIcon variant="subtle">
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle">
            <IconEdit size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={500}>Referral Network</Text>
        <Button leftSection={<IconNetwork size={16} />}>
          View Network Graph
        </Button>
      </Group>
      
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Referrer</Table.Th>
            <Table.Th>Referred Customer</Table.Th>
            <Table.Th>Tier</Table.Th>
            <Table.Th>Commission</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text c="dimmed" size="sm" fw={500} tt="uppercase">
              Total Customers
            </Text>
            <Text fw={700} size="xl">
              {mockCustomers.length}
            </Text>
          </div>
          <ThemeIcon color="blue" variant="light" size={38} radius="md">
            <IconUsers size={20} />
          </ThemeIcon>
        </Group>
        <Text c="dimmed" size="sm" mt="md">
          <Text component="span" c="green" fw={700}>
            +12%
          </Text>{' '}
          from last month
        </Text>
      </Paper>

      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text c="dimmed" size="sm" fw={500} tt="uppercase">
              Total Revenue
            </Text>
            <Text fw={700} size="xl">
              ${mockCustomers.reduce((sum, c) => sum + c.actualValue, 0).toLocaleString()}
            </Text>
          </div>
          <ThemeIcon color="green" variant="light" size={38} radius="md">
            <IconCoin size={20} />
          </ThemeIcon>
        </Group>
        <Text c="dimmed" size="sm" mt="md">
          <Text component="span" c="green" fw={700}>
            +18%
          </Text>{' '}
          from last month
        </Text>
      </Paper>

      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text c="dimmed" size="sm" fw={500} tt="uppercase">
              Active Referrals
            </Text>
            <Text fw={700} size="xl">
              {mockReferrals.length}
            </Text>
          </div>
          <ThemeIcon color="violet" variant="light" size={38} radius="md">
            <IconNetwork size={20} />
          </ThemeIcon>
        </Group>
        <Text c="dimmed" size="sm" mt="md">
          <Text component="span" c="green" fw={700}>
            +5%
          </Text>{' '}
          from last month
        </Text>
      </Paper>

      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text c="dimmed" size="sm" fw={500} tt="uppercase">
              Conversion Rate
            </Text>
            <Text fw={700} size="xl">
              78%
            </Text>
          </div>
          <RingProgress
            size={80}
            roundCaps
            thickness={8}
            sections={[{ value: 78, color: 'blue' }]}
            label={
              <Center>
                <IconTrendingUp size={18} />
              </Center>
            }
          />
        </Group>
      </Paper>
    </SimpleGrid>
  );
}

export default RoleBasedDashboard;
