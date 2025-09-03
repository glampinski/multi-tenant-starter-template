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
  Center
} from '@mantine/core';
import { 
  IconEdit, 
  IconTrash, 
  IconPlus,
  IconEye,
  IconPhone,
  IconMail,
  IconUsers
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  actualValue: number;
  referrals: number;
  createdAt: string;
}

export default function MyCustomersPage() {
  const params = useParams<{ teamId: string }>();
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      // Mock data for immediate display
      const mockCustomers: Customer[] = [
        {
          id: '1',
          firstName: 'Emma',
          lastName: 'Thompson',
          email: 'emma@example.com',
          phone: '+1-555-0123',
          status: 'ACTIVE',
          actualValue: 5420,
          referrals: 3,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          firstName: 'James',
          lastName: 'Rodriguez',
          email: 'james@example.com',
          phone: '+1-555-0124',
          status: 'ACTIVE',
          actualValue: 8930,
          referrals: 7,
          createdAt: '2024-01-12'
        },
        {
          id: '3',
          firstName: 'Sophia',
          lastName: 'Chen',
          email: 'sophia@example.com',
          phone: '+1-555-0125',
          status: 'INACTIVE',
          actualValue: 2100,
          referrals: 1,
          createdAt: '2024-01-10'
        },
        {
          id: '4',
          firstName: 'Michael',
          lastName: 'Johnson',
          email: 'michael@example.com',
          phone: '+1-555-0126',
          status: 'ACTIVE',
          actualValue: 12400,
          referrals: 12,
          createdAt: '2024-01-08'
        }
      ];
      
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
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
    });
    close();
    // In real app, would make API call here
    loadCustomers();
  };

  const handleDelete = (customer: Customer) => {
    notifications.show({
      title: 'Customer Deleted',
      message: `${customer.firstName} ${customer.lastName} has been removed.`,
      color: 'red',
    });
    // In real app, would make API call here
    setCustomers(customers.filter(c => c.id !== customer.id));
  };

  const totalValue = customers.reduce((sum, customer) => sum + customer.actualValue, 0);
  const totalReferrals = customers.reduce((sum, customer) => sum + customer.referrals, 0);
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;

  const rows = customers.map((customer) => (
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
      <Table.Td>
        <Group gap="xs">
          <IconPhone size={14} />
          <Text size="sm">{customer.phone}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge color={customer.status === 'ACTIVE' ? 'green' : 'red'}>
          {customer.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>${customer.actualValue.toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{customer.referrals}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(customer.createdAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={5}>
          <ActionIcon variant="subtle" onClick={() => handleEdit(customer)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(customer)}>
            <IconTrash size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="blue">
            <IconEye size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <div className="p-6 space-y-6">
        <div>
          <Text size="xl" fw={700} mb="xs">My Customers</Text>
          <Text c="dimmed">
            Manage your personal customer portfolio and track their value
          </Text>
        </div>

        {/* Statistics Cards */}
        <Group grow>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Total Customers
                </Text>
                <Text fw={700} size="xl">
                  {customers.length}
                </Text>
              </div>
              <Badge color="blue" size="lg">
                {activeCustomers} Active
              </Badge>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Total Value
                </Text>
                <Text fw={700} size="xl">
                  ${totalValue.toLocaleString()}
                </Text>
              </div>
              <Text size="sm" c="green">+18% this month</Text>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Total Referrals
                </Text>
                <Text fw={700} size="xl">
                  {totalReferrals}
                </Text>
              </div>
              <Text size="sm" c="blue">Generated by customers</Text>
            </Group>
          </Paper>
        </Group>

        {/* Customer Table */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>Customer List</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
              Add Customer
            </Button>
          </Group>
          
          <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} />
            
            {!loading && customers.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="md">
                  <IconUsers size={48} color="gray" />
                  <Text c="dimmed">No customers found. Add your first customer to get started.</Text>
                  <Button onClick={handleAdd}>Add Customer</Button>
                </Stack>
              </Center>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Customer</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Value</Table.Th>
                    <Table.Th>Referrals</Table.Th>
                    <Table.Th>Added</Table.Th>
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
      <Modal opened={opened} onClose={close} title={editingCustomer ? "Edit Customer" : "Add Customer"}>
        <Stack gap="md">
          <Group grow>
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
          </Group>
          
          <TextInput
            label="Email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            leftSection={<IconMail size={16} />}
          />
          
          <TextInput
            label="Phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            leftSection={<IconPhone size={16} />}
          />
          
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: (value as 'ACTIVE' | 'INACTIVE') || 'ACTIVE' })}
            data={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            required
          />
          
          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
