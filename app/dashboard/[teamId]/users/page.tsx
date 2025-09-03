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
  Menu
} from '@mantine/core';
import { 
  IconEdit, 
  IconTrash, 
  IconPlus,
  IconUsers,
  IconShield,
  IconUserCheck,
  IconUserX,
  IconDots,
  IconBan,
  IconKey,
  IconMail,
  IconCrown,
  IconBriefcase,
  IconUser
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES_PERSON' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinedAt: string;
  lastActive: string;
  customerCount?: number;
  salesVolume?: number;
}

export default function UsersPage() {
  const params = useParams<{ teamId: string }>();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SALES_PERSON' as 'ADMIN' | 'MANAGER' | 'SALES_PERSON' | 'CUSTOMER',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Mock data for immediate display
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Sarah Wilson',
          email: 'sarah@company.com',
          role: 'MANAGER',
          status: 'ACTIVE',
          joinedAt: '2024-01-01',
          lastActive: '2024-01-15',
          customerCount: 24,
          salesVolume: 45600
        },
        {
          id: '2',
          name: 'Mike Johnson',
          email: 'mike@company.com',
          role: 'SALES_PERSON',
          status: 'ACTIVE',
          joinedAt: '2024-01-05',
          lastActive: '2024-01-14',
          customerCount: 18,
          salesVolume: 32400
        },
        {
          id: '3',
          name: 'Admin User',
          email: 'admin@company.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: '2023-12-15',
          lastActive: '2024-01-15'
        },
        {
          id: '4',
          name: 'Lisa Brown',
          email: 'lisa@company.com',
          role: 'SALES_PERSON',
          status: 'ACTIVE',
          joinedAt: '2024-01-08',
          lastActive: '2024-01-13',
          customerCount: 31,
          salesVolume: 58200
        },
        {
          id: '5',
          name: 'John Davis',
          email: 'john@company.com',
          role: 'SALES_PERSON',
          status: 'SUSPENDED',
          joinedAt: '2024-01-03',
          lastActive: '2024-01-10',
          customerCount: 8,
          salesVolume: 12800
        },
        {
          id: '6',
          name: 'Customer One',
          email: 'customer1@example.com',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          joinedAt: '2024-01-12',
          lastActive: '2024-01-14'
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    open();
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'SALES_PERSON',
      status: 'ACTIVE'
    });
    open();
  };

  const handleSubmit = () => {
    notifications.show({
      title: editingUser ? 'User Updated' : 'User Added',
      message: `${formData.name} has been ${editingUser ? 'updated' : 'added'} successfully.`,
      color: 'green',
    });
    close();
    // In real app, would make API call here
    loadUsers();
  };

  const handleDelete = (user: User) => {
    notifications.show({
      title: 'User Removed',
      message: `${user.name} has been removed from the team.`,
      color: 'red',
    });
    setUsers(users.filter(u => u.id !== user.id));
  };

  const handleSuspend = (user: User) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    );
    setUsers(updatedUsers as User[]);
    
    notifications.show({
      title: newStatus === 'SUSPENDED' ? 'User Suspended' : 'User Reactivated',
      message: `${user.name} has been ${newStatus === 'SUSPENDED' ? 'suspended' : 'reactivated'}.`,
      color: newStatus === 'SUSPENDED' ? 'orange' : 'green',
    });
  };

  const roleIcons = {
    ADMIN: IconCrown,
    MANAGER: IconBriefcase,
    SALES_PERSON: IconUser,
    CUSTOMER: IconUsers
  };

  const roleColors = {
    ADMIN: 'red',
    MANAGER: 'blue',
    SALES_PERSON: 'green',
    CUSTOMER: 'violet'
  };

  const statusColors = {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    SUSPENDED: 'red'
  };

  // Calculate statistics
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const suspendedUsers = users.filter(u => u.status === 'SUSPENDED').length;
  const adminUsers = users.filter(u => u.role === 'ADMIN').length;
  const salesPeople = users.filter(u => u.role === 'SALES_PERSON').length;

  const rows = users.map((user) => {
    const RoleIcon = roleIcons[user.role];
    
    return (
      <Table.Tr key={user.id}>
        <Table.Td>
          <Group gap="sm">
            <Avatar color="initials" name={user.name} />
            <div>
              <Text size="sm" fw={500}>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed">
                {user.email}
              </Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <RoleIcon size={16} color={roleColors[user.role]} />
            <Badge color={roleColors[user.role]}>
              {user.role.replace('_', ' ')}
            </Badge>
          </Group>
        </Table.Td>
        <Table.Td>
          <Badge color={statusColors[user.status]}>
            {user.status}
          </Badge>
        </Table.Td>
        <Table.Td>
          {user.customerCount !== undefined ? (
            <Text size="sm">{user.customerCount}</Text>
          ) : (
            <Text size="sm" c="dimmed">-</Text>
          )}
        </Table.Td>
        <Table.Td>
          {user.salesVolume !== undefined ? (
            <Text size="sm" fw={500}>${user.salesVolume.toLocaleString()}</Text>
          ) : (
            <Text size="sm" c="dimmed">-</Text>
          )}
        </Table.Td>
        <Table.Td>
          <Text size="xs" c="dimmed">
            {new Date(user.lastActive).toLocaleDateString()}
          </Text>
        </Table.Td>
        <Table.Td>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>User Actions</Menu.Label>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(user)}>
                Edit User
              </Menu.Item>
              <Menu.Item 
                leftSection={<IconBan size={14} />} 
                onClick={() => handleSuspend(user)}
                color={user.status === 'SUSPENDED' ? 'green' : 'orange'}
              >
                {user.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'} User
              </Menu.Item>
              <Menu.Item leftSection={<IconKey size={14} />}>
                Reset Password
              </Menu.Item>
              <Menu.Item leftSection={<IconMail size={14} />}>
                Send Email
              </Menu.Item>
              
              <Menu.Divider />
              
              <Menu.Item 
                leftSection={<IconTrash size={14} />} 
                color="red"
                onClick={() => handleDelete(user)}
              >
                Remove User
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <div className="p-6 space-y-6">
        <div>
          <Text size="xl" fw={700} mb="xs">Team Members</Text>
          <Text c="dimmed">
            Manage team members, roles, and access permissions
          </Text>
        </div>

        {/* Statistics Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Total Users
                </Text>
                <Text fw={700} size="xl">
                  {users.length}
                </Text>
              </div>
              <ThemeIcon color="blue" variant="light" size={38} radius="md">
                <IconUsers size={20} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Active Users
                </Text>
                <Text fw={700} size="xl">
                  {activeUsers}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size={38} radius="md">
                <IconUserCheck size={20} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Sales People
                </Text>
                <Text fw={700} size="xl">
                  {salesPeople}
                </Text>
              </div>
              <ThemeIcon color="violet" variant="light" size={38} radius="md">
                <IconUser size={20} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Admins
                </Text>
                <Text fw={700} size="xl">
                  {adminUsers}
                </Text>
              </div>
              <ThemeIcon color="red" variant="light" size={38} radius="md">
                <IconShield size={20} />
              </ThemeIcon>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Users Table */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>Team Directory</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
              Add User
            </Button>
          </Group>
          
          <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} />
            
            {!loading && users.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="md">
                  <IconUsers size={48} color="gray" />
                  <Text c="dimmed">No team members found. Add your first team member to get started.</Text>
                  <Button onClick={handleAdd}>Add User</Button>
                </Stack>
              </Center>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Customers</Table.Th>
                    <Table.Th>Sales Volume</Table.Th>
                    <Table.Th>Last Active</Table.Th>
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
      <Modal opened={opened} onClose={close} title={editingUser ? "Edit User" : "Add User"}>
        <Stack gap="md">
          <TextInput
            label="Full Name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <TextInput
            label="Email Address"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingUser} // Don't allow editing email for existing users
          />
          
          <Select
            label="Role"
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: (value as any) || 'SALES_PERSON' })}
            data={[
              { value: 'ADMIN', label: 'Admin - Full system access' },
              { value: 'MANAGER', label: 'Manager - Team management' },
              { value: 'SALES_PERSON', label: 'Sales Person - Sales activities' },
              { value: 'CUSTOMER', label: 'Customer - Limited access' },
            ]}
            required
          />
          
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: (value as any) || 'ACTIVE' })}
            data={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ]}
            required
          />
          
          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
