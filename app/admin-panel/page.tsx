'use client';

import { 
  AppShell, 
  Burger,
  Group,
  Text, 
  Button, 
  Badge, 
  Table, 
  ActionIcon,
  Card,
  Title,
  Modal,
  TextInput,
  Select,
  Textarea,
  Stack,
  Avatar,
  Progress,
  SimpleGrid,
  RingProgress,
  Center,
  Paper,
  ThemeIcon,
  NavLink,
  Flex,
  Notification,
  Loader,
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
  IconSettings,
  IconDashboard,
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

export default function AdminPanel() {
  const [opened, { toggle }] = useDisclosure();
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState(mockCustomers);
  const [referrals, setReferrals] = useState(mockReferrals);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'LEAD'
  });

  // Statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.actualValue || 0), 0);
  const totalCommissions = referrals.reduce((sum, r) => sum + r.commission, 0);

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      company: customer.company || '',
      status: customer.status
    });
    openModal();
  };

  const handleDeleteCustomer = (id: number) => {
    setCustomers(customers.filter(c => c.id !== id));
    notifications.show({
      title: 'Customer Deleted',
      message: 'Customer has been removed from the system',
      color: 'red',
      icon: <IconCheck size="1rem" />,
    });
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: 'LEAD'
    });
    openModal();
  };

  const handleSaveCustomer = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingCustomer) {
        // Update existing customer
        setCustomers(customers.map(c => 
          c.id === editingCustomer.id 
            ? { ...c, ...formData }
            : c
        ));
        notifications.show({
          title: 'Customer Updated',
          message: 'Customer information has been updated successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
      } else {
        // Add new customer
        const newCustomer = {
          id: Math.max(...customers.map(c => c.id)) + 1,
          ...formData,
          actualValue: 0,
          referrals: 0
        };
        setCustomers([...customers, newCustomer]);
        notifications.show({
          title: 'Customer Added',
          message: 'New customer has been added successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
      }
      closeModal();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Something went wrong. Please try again.',
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    }
    setLoading(false);
  };

  const statsData = [
    { 
      title: 'Total Customers', 
      value: totalCustomers.toString(), 
      icon: IconUsers, 
      color: 'blue',
      description: `${activeCustomers} active`
    },
    { 
      title: 'Total Revenue', 
      value: `$${totalRevenue.toLocaleString()}`, 
      icon: IconTrendingUp, 
      color: 'green',
      description: 'This month'
    },
    { 
      title: 'Commissions Paid', 
      value: `$${totalCommissions.toLocaleString()}`, 
      icon: IconCoin, 
      color: 'orange',
      description: 'Total earned'
    },
    { 
      title: 'Referral Rate', 
      value: '68%', 
      icon: IconNetwork, 
      color: 'violet',
      description: 'Conversion rate'
    },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>🚀 Admin CRM Panel</Title>
          </Group>
          <Group>
            <Badge color="green" variant="light">Live Data</Badge>
            <Button leftSection={<IconPlus size={16} />} onClick={handleAddCustomer}>
              Add Customer
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Title order={4} mb="md">Navigation</Title>
          
          <NavLink
            href="#customers"
            label="Customer Management"
            leftSection={<IconUsers size="1rem" />}
            active={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
          />
          
          <NavLink
            href="#referrals"
            label="Referral Network"
            leftSection={<IconNetwork size="1rem" />}
            active={activeTab === 'referrals'}
            onClick={() => setActiveTab('referrals')}
          />
          
          <NavLink
            href="#analytics"
            label="Analytics Dashboard"
            leftSection={<IconDashboard size="1rem" />}
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          
          <NavLink
            href="#settings"
            label="Settings"
            leftSection={<IconSettings size="1rem" />}
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        {/* Statistics Cards */}
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} mb="xl">
          {statsData.map((stat) => (
            <Paper key={stat.title} p="md" radius="md" withBorder>
              <Group justify="apart">
                <div>
                  <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
                    {stat.title}
                  </Text>
                  <Text fw={700} fz="xl">
                    {stat.value}
                  </Text>
                  <Text c="dimmed" fz="sm">
                    {stat.description}
                  </Text>
                </div>
                <ThemeIcon color={stat.color} variant="light" size={38} radius="md">
                  <stat.icon size="1.8rem" stroke={1.5} />
                </ThemeIcon>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Customer Management Tab */}
        {activeTab === 'customers' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={2}>Customer Management</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={handleAddCustomer}>
                Add New Customer
              </Button>
            </Group>
            
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Contact</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Value</Table.Th>
                  <Table.Th>Referrals</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {customers.map((customer) => (
                  <Table.Tr key={customer.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size={40} radius={40} color="blue">
                          {customer.firstName[0]}{customer.lastName[0]}
                        </Avatar>
                        <div>
                          <Text fz="sm" fw={500}>
                            {customer.firstName} {customer.lastName}
                          </Text>
                          <Text fz="xs" c="dimmed">
                            ID: {customer.id}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm">{customer.email}</Text>
                      <Text fz="xs" c="dimmed">{customer.phone}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={customer.status === 'ACTIVE' ? 'green' : 'red'} 
                        variant="light"
                      >
                        {customer.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>${(customer.actualValue || 0).toLocaleString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="blue" variant="light">
                        {customer.referrals}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={0} justify="flex-end">
                        <ActionIcon variant="subtle" color="blue">
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon 
                          variant="subtle" 
                          color="gray"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon 
                          variant="subtle" 
                          color="red"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        {/* Referral Network Tab */}
        {activeTab === 'referrals' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={2} mb="md">Referral Network</Title>
            
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Referrer</Table.Th>
                  <Table.Th>Referred Customer</Table.Th>
                  <Table.Th>Commission</Table.Th>
                  <Table.Th>Tier Level</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {referrals.map((referral) => (
                  <Table.Tr key={referral.id}>
                    <Table.Td>
                      <Text fw={500}>{referral.referrer}</Text>
                    </Table.Td>
                    <Table.Td>{referral.referred}</Table.Td>
                    <Table.Td>
                      <Text fw={500} c="green">${referral.commission}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={referral.tier === 1 ? 'blue' : 'orange'}>
                        Tier {referral.tier}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={referral.status === 'PAID' ? 'green' : 'yellow'}>
                        {referral.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{referral.date}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Conversion Rate</Title>
              <Center>
                <RingProgress
                  size={200}
                  thickness={20}
                  sections={[{ value: 68, color: 'blue' }]}
                  label={
                    <Center>
                      <div>
                        <Text ta="center" fz="lg" fw={700}>
                          68%
                        </Text>
                        <Text ta="center" fz="sm" c="dimmed">
                          Referral Rate
                        </Text>
                      </div>
                    </Center>
                  }
                />
              </Center>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Growth Metrics</Title>
              <Stack>
                <div>
                  <Text size="sm">Customer Growth</Text>
                  <Progress value={75} color="green" />
                  <Text size="xs" c="dimmed">+23% this month</Text>
                </div>
                <div>
                  <Text size="sm">Revenue Growth</Text>
                  <Progress value={60} color="blue" />
                  <Text size="xs" c="dimmed">+18% this month</Text>
                </div>
                <div>
                  <Text size="sm">Referral Network</Text>
                  <Progress value={85} color="orange" />
                  <Text size="xs" c="dimmed">+31% this month</Text>
                </div>
              </Stack>
            </Card>
          </SimpleGrid>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={2} mb="md">System Settings</Title>
            <Text>Configuration options will be available here.</Text>
          </Card>
        )}

        {/* Customer Modal */}
        <Modal 
          opened={modalOpened} 
          onClose={closeModal} 
          title={editingCustomer ? "Edit Customer" : "Add New Customer"}
          size="md"
        >
          <Stack>
            <TextInput
              label="First Name"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            <TextInput
              label="Email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextInput
              label="Phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextInput
              label="Company"
              placeholder="Enter company name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <Select
              label="Status"
              placeholder="Select status"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'LEAD' })}
              data={[
                { value: 'LEAD', label: 'Lead' },
                { value: 'PROSPECT', label: 'Prospect' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeModal}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCustomer}
                loading={loading}
                leftSection={loading ? <Loader size="xs" /> : <IconCheck size={16} />}
              >
                {editingCustomer ? 'Update' : 'Create'} Customer
              </Button>
            </Group>
          </Stack>
        </Modal>
      </AppShell.Main>
    </AppShell>
  );
}
