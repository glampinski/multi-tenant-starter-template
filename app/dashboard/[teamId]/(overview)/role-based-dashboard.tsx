'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS, ROLES, getRoleDisplayName } from '@/lib/permissions';
import { useUser } from '@stackframe/stack';
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
  const user = useUser({ or: 'redirect' });
  const { getUserRole, hasPermission } = useRolePermissions();
  
  if (!teamId) return <div>Loading...</div>;
  
  const role = getUserRole(teamId);
  const team = user.useTeam(teamId);
  
  if (!team || !role) return <div>Team not found</div>;
  
  // Super Admin Dashboard
  if (hasPermission(teamId, PERMISSIONS.VIEW_ALL_DATA)) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete view of all platform activities as {getRoleDisplayName(role)}
          </p>
        </div>
        
        {/* Mantine Analytics Dashboard */}
        <AnalyticsDashboard />
        
        {/* Mantine Customer Management */}
        <CustomerManagement />
        
        {/* Mantine Referral Network */}
        <ReferralNetwork />
      </div>
    );
  }

  // Admin Dashboard - Company level access
  if (hasPermission(teamId, PERMISSIONS.MANAGE_COMPANY_USERS)) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage company operations and users as {getRoleDisplayName(role)}
          </p>
        </div>
        
        {/* Mantine Analytics Dashboard */}
        <AnalyticsDashboard />
        
        {/* Mantine Customer Management */}
        <CustomerManagement />
        
        {/* Mantine Referral Network */}
        <ReferralNetwork />
      </div>
    );
  }
  
  // Salesperson Dashboard
  if (hasPermission(teamId, PERMISSIONS.VIEW_OWN_CUSTOMERS)) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your personal sales performance as {getRoleDisplayName(role)}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">Customers you invited</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$18,450</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">Monthly target</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,300</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Employee Dashboard
  if (hasPermission(teamId, PERMISSIONS.VIEW_ASSIGNED_DATA)) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your assigned tasks and projects as {getRoleDisplayName(role)}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">3 due this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Projects assigned</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">Task completion rate</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Customer Dashboard (default)
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your personal dashboard as {getRoleDisplayName(role)}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">Member since Jan 2024</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invitations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Users you invited</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Actions this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24/7</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>
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
