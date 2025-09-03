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
  Menu,
  Progress
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
  IconUser,
  IconEye,
  IconBuilding,
  IconChartBar
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES_PERSON' | 'CUSTOMER';
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinedAt: string;
  lastActive: string;
  customerCount: number;
  salesVolume: number;
  targetAchievement: number;
  permissions: string[];
}

export default function CompanyUsersPage() {
  const params = useParams<{ teamId: string }>();
  const { data: session } = useSession();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SALES_PERSON' as 'ADMIN' | 'MANAGER' | 'SALES_PERSON' | 'CUSTOMER',
    department: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Mock data for immediate display with company-wide perspective
      const mockUsers: CompanyUser[] = [
        {
          id: '1',
          name: 'Sarah Wilson',
          email: 'sarah@company.com',
          role: 'MANAGER',
          department: 'Sales Management',
          status: 'ACTIVE',
          joinedAt: '2024-01-01',
          lastActive: '2024-01-15',
          customerCount: 24,
          salesVolume: 45600,
          targetAchievement: 85,
          permissions: ['VIEW_ALL_SALES', 'MANAGE_TEAM', 'VIEW_REPORTS']
        },
        {
          id: '2',
          name: 'Mike Johnson',
          email: 'mike@company.com',
          role: 'SALES_PERSON',
          department: 'Enterprise Sales',
          status: 'ACTIVE',
          joinedAt: '2024-01-05',
          lastActive: '2024-01-14',
          customerCount: 18,
          salesVolume: 32400,
          targetAchievement: 62,
          permissions: ['MANAGE_CUSTOMERS', 'VIEW_OWN_SALES']
        },
        {
          id: '3',
          name: 'Jennifer Admin',
          email: 'admin@company.com',
          role: 'ADMIN',
          department: 'IT Administration',
          status: 'ACTIVE',
          joinedAt: '2023-12-15',
          lastActive: '2024-01-15',
          customerCount: 0,
          salesVolume: 0,
          targetAchievement: 100,
          permissions: ['ADMIN_ALL', 'SYSTEM_SETTINGS', 'USER_MANAGEMENT']
        },
        {
          id: '4',
          name: 'Lisa Brown',
          email: 'lisa@company.com',
          role: 'SALES_PERSON',
          department: 'SMB Sales',
          status: 'ACTIVE',
          joinedAt: '2024-01-08',
          lastActive: '2024-01-13',
          customerCount: 31,
          salesVolume: 58200,
          targetAchievement: 95,
          permissions: ['MANAGE_CUSTOMERS', 'VIEW_OWN_SALES', 'CREATE_REFERRALS']
        },
        {
          id: '5',
          name: 'John Davis',
          email: 'john@company.com',
          role: 'SALES_PERSON',
          department: 'Enterprise Sales',
          status: 'SUSPENDED',
          joinedAt: '2024-01-03',
          lastActive: '2024-01-10',
          customerCount: 8,
          salesVolume: 12800,
          targetAchievement: 25,
          permissions: ['MANAGE_CUSTOMERS']
        },
        {
          id: '6',
          name: 'Emma Customer',
          email: 'emma@customer.com',
          role: 'CUSTOMER',
          department: 'External',
          status: 'ACTIVE',
          joinedAt: '2024-01-12',
          lastActive: '2024-01-14',
          customerCount: 0,
          salesVolume: 0,
          targetAchievement: 0,
          permissions: ['VIEW_OWN_DATA']
        },
        {
          id: '7',
          name: 'Robert Manager',
          email: 'robert@company.com',
          role: 'MANAGER',
          department: 'Customer Success',
          status: 'ACTIVE',
          joinedAt: '2023-12-20',
          lastActive: '2024-01-15',
          customerCount: 45,
          salesVolume: 72300,
          targetAchievement: 88,
          permissions: ['VIEW_ALL_SALES', 'MANAGE_TEAM', 'CUSTOMER_SUPPORT']
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

  const handleEdit = (user: CompanyUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status
    });
    open();
  };

  const handleSubmit = () => {
    notifications.show({
      title: 'User Updated',
      message: `${formData.name} has been updated successfully.`,
      color: 'green',
    });
    close();
    loadUsers();
  };

  const handleSuspend = (user: CompanyUser) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    );
    setUsers(updatedUsers as CompanyUser[]);
    
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

  // Calculate company-wide statistics
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const totalSalesVolume = users.reduce((sum, u) => sum + u.salesVolume, 0);
  const avgTargetAchievement = Math.round(users.filter(u => u.role === 'SALES_PERSON').reduce((sum, u) => sum + u.targetAchievement, 0) / users.filter(u => u.role === 'SALES_PERSON').length) || 0;
  const totalCustomers = users.reduce((sum, u) => sum + u.customerCount, 0);

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
            <RoleIcon size={16} />
            <div>
              <Badge color={roleColors[user.role]} size="sm">
                {user.role.replace('_', ' ')}
              </Badge>
              <Text size="xs" c="dimmed" mt={2}>
                {user.department}
              </Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td>
          <Badge color={statusColors[user.status]}>
            {user.status}
          </Badge>
        </Table.Td>
        <Table.Td>
          {user.role === 'SALES_PERSON' || user.role === 'MANAGER' ? (
            <div>
              <Text size="sm">{user.customerCount}</Text>
              <Text size="xs" c="dimmed">customers</Text>
            </div>
          ) : (
            <Text size="sm" c="dimmed">-</Text>
          )}
        </Table.Td>
        <Table.Td>
          {user.salesVolume > 0 ? (
            <div>
              <Text size="sm" fw={500}>${user.salesVolume.toLocaleString()}</Text>
              <Text size="xs" c="dimmed">volume</Text>
            </div>
          ) : (
            <Text size="sm" c="dimmed">-</Text>
          )}
        </Table.Td>
        <Table.Td>
          {user.role === 'SALES_PERSON' || user.role === 'MANAGER' ? (
            <div>
              <Text size="sm">{user.targetAchievement}%</Text>
              <Progress 
                size="xs" 
                value={user.targetAchievement} 
                color={user.targetAchievement >= 75 ? 'green' : user.targetAchievement >= 50 ? 'yellow' : 'red'}
                mt={2}
              />
            </div>
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
              <Menu.Item leftSection={<IconEye size={14} />}>
                View Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(user)}>
                Edit User
              </Menu.Item>
              <Menu.Item leftSection={<IconChartBar size={14} />}>
                View Performance
              </Menu.Item>
              
              <Menu.Divider />
              
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
                Send Message
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
          <Text size="xl" fw={700} mb="xs">Company Users Overview</Text>
          <Text c="dimmed">
            Complete overview of all users across the organization with performance metrics
          </Text>
        </div>

        {/* Company Statistics */}
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
                <IconBuilding size={20} />
              </ThemeIcon>
            </Group>
            <Text c="dimmed" size="sm" mt="md">
              <Text component="span" c="green" fw={700}>
                {activeUsers}
              </Text>{' '}
              active users
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Total Customers
                </Text>
                <Text fw={700} size="xl">
                  {totalCustomers}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size={38} radius="md">
                <IconUsers size={20} />
              </ThemeIcon>
            </Group>
            <Text c="dimmed" size="sm" mt="md">
              Company-wide portfolio
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Total Sales Volume
                </Text>
                <Text fw={700} size="xl">
                  ${totalSalesVolume.toLocaleString()}
                </Text>
              </div>
              <ThemeIcon color="violet" variant="light" size={38} radius="md">
                <IconChartBar size={20} />
              </ThemeIcon>
            </Group>
            <Text c="dimmed" size="sm" mt="md">
              <Text component="span" c="green" fw={700}>
                +18%
              </Text>{' '}
              from last quarter
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Avg Target Achievement
                </Text>
                <Text fw={700} size="xl">
                  {avgTargetAchievement}%
                </Text>
              </div>
              <ThemeIcon color="orange" variant="light" size={38} radius="md">
                <IconShield size={20} />
              </ThemeIcon>
            </Group>
            <Text c="dimmed" size="sm" mt="md">
              Sales team performance
            </Text>
          </Paper>
        </SimpleGrid>

        {/* Users Table */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>All Company Users</Text>
            <Group gap="sm">
              <Select
                placeholder="Filter by role"
                size="sm"
                data={[
                  { value: 'ALL', label: 'All Roles' },
                  { value: 'ADMIN', label: 'Admins' },
                  { value: 'MANAGER', label: 'Managers' },
                  { value: 'SALES_PERSON', label: 'Sales People' },
                  { value: 'CUSTOMER', label: 'Customers' },
                ]}
              />
              <Select
                placeholder="Filter by status"
                size="sm"
                data={[
                  { value: 'ALL', label: 'All Status' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                ]}
              />
            </Group>
          </Group>
          
          <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} />
            
            {!loading && users.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="md">
                  <IconUsers size={48} color="gray" />
                  <Text c="dimmed">No users found in the company directory.</Text>
                </Stack>
              </Center>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Role & Department</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Customers</Table.Th>
                    <Table.Th>Sales Volume</Table.Th>
                    <Table.Th>Target Progress</Table.Th>
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

      {/* Edit Modal */}
      <Modal opened={opened} onClose={close} title="Edit User">
        <Stack gap="md">
          <TextInput
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <TextInput
            label="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled // Don't allow editing email for existing users
          />
          
          <TextInput
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            required
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
            <Button onClick={handleSubmit}>Update User</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
