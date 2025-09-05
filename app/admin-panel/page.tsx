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
  Tabs,
  Menu,
  Divider,
  ScrollArea,
  Container,
  Box,
  Grid,
  rem,
  Anchor,
  Alert,
  NumberInput,
} from '@mantine/core';
import { signOut, useSession } from 'next-auth/react';
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
  IconLogout,
  IconDatabase,
  IconShield,
  IconBell,
  IconMail,
  IconFileText,
  IconChartBar,
  IconWorld,
  IconKey,
  IconBuildingBank,
  IconUserCheck,
  IconSearch,
  IconDownload,
  IconUpload,
  IconFilter,
  IconCalendar,
  IconClock,
  IconTarget,
  IconTrophy,
  IconStar,
  IconActivity,
  IconCreditCard,
  IconReceipt,
  IconBusinessplan,
  IconMessages,
  IconNotification,
  IconLock,
  IconUserPlus,
  IconLink,
  IconCopy,
  IconSend,
  IconBriefcase,
  IconChevronRight,
  IconAlertCircle,
  IconBuildingStore,
  IconCash,
  IconPercentage,
  IconGift,
} from '@tabler/icons-react';
import React, { useState, useEffect, useCallback } from 'react';

// Real database-connected component
export default function SuperAdminPanel() {
  // All hooks at the top
  const [opened, { toggle }] = useDisclosure();
  const [activeTab, setActiveTab] = useState('overview');
  const [customers, setCustomers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [inviteModalOpened, { open: openInviteModal, close: closeInviteModal }] = useDisclosure(false);
  const [teamModalOpened, { open: openTeamModal, close: closeTeamModal }] = useDisclosure(false);
  const [linkModalOpened, { open: openLinkModal, close: closeLinkModal }] = useDisclosure(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [inviteLink, setInviteLink] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'LEAD',
    team: 'main_team',
    tier: 'BASIC'
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'SALES_REP',
    teamId: 'main_team'
  });

  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    type: 'SALES',
    commissionRate: 10
  });

  const { data: session, status } = useSession();

  // Authentication checks
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/auth/signin';
    }
  }, [status]);

  const loadDashboardData = useCallback(async () => {
    setDataLoading(true);
    try {
      let customersData: any[] = [];
      let usersData: any[] = [];
      let referralsData: any[] = [];
      let teamsData: any[] = [];

      // Load customers from API
      const customersResponse = await fetch('/api/customers?limit=1000'); // Get all customers for analytics
      if (customersResponse.ok) {
        const customersResult = await customersResponse.json();
        customersData = customersResult.customers || [];
        setCustomers(customersData);
      }

      // Load users for team management
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        usersData = usersResult.users || [];
        setUsers(usersData);
      }

      // Load referrals
      const referralsResponse = await fetch('/api/referrals/analytics/all');
      if (referralsResponse.ok) {
        const referralsResult = await referralsResponse.json();
        referralsData = referralsResult.referrals || [];
        setReferrals(referralsData);
      }

      // Load teams
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teamsResult = await teamsResponse.json();
        teamsData = teamsResult.teams || [];
        setTeams(teamsData);
      }

      // Calculate system statistics from real data
      const stats = calculateSystemStats(customersData, usersData, referralsData);
      setSystemStats(stats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load dashboard data',
        color: 'red',
      });
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Load real data from database
  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      loadDashboardData();
    }
  }, [session, loadDashboardData]);

  const calculateSystemStats = (customers: any[], users: any[], referrals: any[]) => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.actualValue || 0), 0);
    const totalCommissions = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;

    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      totalCommissions,
      totalUsers,
      activeUsers,
      systemUptime: '99.9%',
      conversionRate: totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(1) : '0'
    };
  };

  if (status === 'loading' || dataLoading) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>Loading Super Admin Dashboard...</Text>
        </Stack>
      </Center>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Check if user is actually a super admin
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <Center h="100vh">
        <Card shadow="md" padding="xl" radius="md" withBorder>
          <Stack align="center">
            <IconShield size={48} color="red" />
            <Title order={2}>Access Denied</Title>
            <Text c="dimmed" ta="center">
              You need Super Admin privileges to access this panel.
            </Text>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </Stack>
        </Card>
      </Center>
    );
  }

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    });
  };

  // Invite team member via email
  const handleInviteTeamMember = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Invitation Sent',
          message: `Invitation email sent to ${inviteData.email}`,
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        closeInviteModal();
        setInviteData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'SALES_REP',
          teamId: 'main_team'
        });
        loadDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send invitation. Please try again.',
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    }
    setLoading(false);
  };

  // Generate invite link (now uses simple username format)
  const handleGenerateInviteLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/invite-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: selectedTeam === 'all' ? 'main_team' : selectedTeam,
          role: 'SALES_REP'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setInviteLink(result.inviteLink);
        
        // Try to copy to clipboard with fallback
        try {
          await navigator.clipboard.writeText(result.inviteLink);
          notifications.show({
            title: 'Success',
            message: 'Invite link copied to clipboard',
            color: 'green',
          });
        } catch (clipboardError) {
          // Fallback: just show success without clipboard
          notifications.show({
            title: 'Success',
            message: 'Invite link generated successfully',
            color: 'green',
          });
        }
        
        openLinkModal();
      } else {
        throw new Error('Failed to generate invite link');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to generate invite link',
        color: 'red',
      });
    }
    setLoading(false);
  };

  // Copy invite link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      notifications.show({
        title: 'Copied!',
        message: 'Invite link copied to clipboard',
        color: 'green',
      });
    } catch (error) {
      // Fallback: select the text for manual copy
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        notifications.show({
          title: 'Copied!',
          message: 'Invite link copied to clipboard',
          color: 'green',
        });
      } catch (fallbackError) {
        notifications.show({
          title: 'Copy Failed',
          message: 'Please manually copy the link from the text field',
          color: 'orange',
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Create new team
  const handleCreateTeam = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Team Created',
          message: `Team "${teamData.name}" has been created successfully`,
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        closeTeamModal();
        setTeamData({
          name: '',
          description: '',
          type: 'SALES',
          commissionRate: 10
        });
        loadDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to create team');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create team. Please try again.',
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    }
    setLoading(false);
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== id));
        notifications.show({
          title: 'Customer Deleted',
          message: 'Customer has been removed from the system',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
      } else {
        throw new Error('Failed to delete customer');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete customer',
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: 'LEAD',
      team: 'main_team',
      tier: 'BASIC'
    });
    openModal();
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      status: customer.status || 'LEAD',
      team: customer.teamId || 'main_team',
      tier: customer.tier || 'BASIC'
    });
    openModal();
  };

  // Enhanced navigation structure
  const navigationSections = [
    {
      title: "Dashboard",
      items: [
        { key: 'overview', label: 'System Overview', icon: IconDashboard },
        { key: 'analytics', label: 'Advanced Analytics', icon: IconChartBar },
        { key: 'activity', label: 'System Activity', icon: IconActivity },
      ]
    },
    {
      title: "User Management",
      items: [
        { key: 'customers', label: 'Customer Management', icon: IconUsers },
        { key: 'users', label: 'User Management', icon: IconUserCheck },
        { key: 'teams', label: 'Team Management', icon: IconBuildingBank },
        { key: 'invitations', label: 'Member Invitations', icon: IconUserPlus },
      ]
    },
    {
      title: "Business Operations", 
      items: [
        { key: 'referrals', label: 'Referral Network', icon: IconNetwork },
        { key: 'commissions', label: 'Commission Management', icon: IconCoin },
        { key: 'payments', label: 'Payment Management', icon: IconCreditCard },
        { key: 'billing', label: 'Billing & Invoices', icon: IconReceipt },
      ]
    },
    {
      title: "System Administration",
      items: [
        { key: 'settings', label: 'System Settings', icon: IconSettings },
        { key: 'security', label: 'Security Center', icon: IconLock },
        { key: 'notifications', label: 'Notifications', icon: IconBell },
        { key: 'database', label: 'Database Management', icon: IconDatabase },
      ]
    },
  ];

  // Calculate stats from current data
  const currentStats = systemStats || {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((c: any) => c.status === 'ACTIVE').length,
    totalRevenue: customers.reduce((sum: number, c: any) => sum + (c.actualValue || 0), 0),
    totalCommissions: referrals.reduce((sum: number, r: any) => sum + (r.commission || 0), 0),
    totalUsers: users.length,
    activeUsers: users.filter((u: any) => u.status === 'ACTIVE').length,
    systemUptime: '99.9%',
    conversionRate: customers.length > 0 ? ((customers.filter((c: any) => c.status === 'ACTIVE').length / customers.length) * 100).toFixed(1) : '0'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Stack gap="xl">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Quick Actions</Title>
              <SimpleGrid cols={{ base: 2, md: 4 }}>
                <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => {
                  setEditingCustomer(null);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    company: '',
                    status: 'LEAD',
                    team: 'main_team',
                    tier: 'BASIC'
                  });
                  openModal();
                }}>
                  Add Customer
                </Button>
                <Button leftSection={<IconUserPlus size={16} />} variant="light" onClick={openInviteModal}>
                  Invite Member
                </Button>
                <Button leftSection={<IconLink size={16} />} variant="light" onClick={handleGenerateInviteLink}>
                  Generate Link
                </Button>
                <Button leftSection={<IconBuildingBank size={16} />} variant="light" onClick={openTeamModal}>
                  Create Team
                </Button>
              </SimpleGrid>
            </Card>
          </Stack>
        );
      case 'invitations':
        return (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={2}>Member Invitations</Title>
              <Group>
                <Button leftSection={<IconMail size={16} />} onClick={openInviteModal}>
                  Send Email Invite
                </Button>
                <Button leftSection={<IconLink size={16} />} onClick={handleGenerateInviteLink}>
                  Generate Invite Link
                </Button>
              </Group>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Email Invitations</Title>
                <Text c="dimmed" mb="lg">
                  Send personalized invitation emails to specific team members.
                </Text>
                <Button fullWidth leftSection={<IconMail size={16} />} onClick={openInviteModal}>
                  Send Email Invitation
                </Button>
              </Card>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Your Referral Link</Title>
                <Text c="dimmed" mb="lg">
                  Generate your simple, clean referral link to share with others.
                </Text>
                <Button fullWidth leftSection={<IconLink size={16} />} onClick={handleGenerateInviteLink}>
                  Get My Referral Link
                </Button>
              </Card>
            </SimpleGrid>
          </Stack>
        );
      case 'users':
        return (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={2}>User Management</Title>
              <Text size="sm" c="dimmed">
                Manage user roles and permissions across the platform
              </Text>
            </Group>
            
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Platform Users</Title>
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Current Role</Table.Th>
                      <Table.Th>Team</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar src={user.image} size="sm" radius="xl">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </Avatar>
                            <div>
                              <Text size="sm" fw={500}>
                                {user.firstName} {user.lastName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ID: {user.id.slice(0, 8)}...
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{user.email}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              user.role === 'SUPER_ADMIN' ? 'red' :
                              user.role === 'ADMIN' ? 'orange' :
                              user.role === 'MANAGER' ? 'blue' :
                              user.role === 'SALES_REP' ? 'green' : 'gray'
                            }
                            variant="light"
                          >
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {user.team?.name || 'No Team'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={user.status === 'ACTIVE' ? 'green' : 'gray'}
                            variant="light"
                          >
                            {user.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => window.open(`/admin-panel/users/${user.id}/edit-role`, '_blank')}
                              title="Edit User Role"
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="green"
                              size="sm"
                              onClick={() => window.open(`/dashboard?impersonate=${user.id}`, '_blank')}
                              title="Impersonate User"
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
              
              {users.length === 0 && (
                <Center py="xl">
                  <Stack align="center">
                    <IconUsers size={48} color="gray" />
                    <Text c="dimmed">No users found</Text>
                    <Text size="xs" c="dimmed">
                      Users will appear here once they register or are invited
                    </Text>
                  </Stack>
                </Center>
              )}
            </Card>
          </Stack>
        );
      default:
        return (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={2} mb="md">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</Title>
            <Text>This section is under development...</Text>
          </Card>
        );
    }
  };

  const handleSaveCustomer = async () => {
    setLoading(true);
    try {
      const method = editingCustomer ? 'PUT' : 'POST';
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        notifications.show({
          title: editingCustomer ? 'Customer Updated' : 'Customer Added',
          message: 'Customer has been saved successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        closeModal();
        loadDashboardData();
      } else {
        throw new Error('Failed to save customer');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save customer. Please try again.',
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    }
    setLoading(false);
  };

  const statsData = [
    { 
      title: 'Total Customers', 
      value: currentStats.totalCustomers.toString(), 
      icon: IconUsers, 
      color: 'blue',
      description: `${currentStats.activeCustomers} active`
    },
    { 
      title: 'Total Revenue', 
      value: `$${currentStats.totalRevenue.toLocaleString()}`, 
      icon: IconTrendingUp, 
      color: 'green',
      description: 'This month'
    },
    { 
      title: 'Total Users', 
      value: currentStats.totalUsers.toString(), 
      icon: IconUserCheck, 
      color: 'purple',
      description: `${currentStats.activeUsers} active`
    },
    { 
      title: 'System Uptime', 
      value: currentStats.systemUptime, 
      icon: IconActivity, 
      color: 'teal',
      description: 'All systems operational'
    },
  ];

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 320, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>🛡️ Super Admin Control Center</Title>
            <Badge color="purple" variant="filled" size="lg">SUPER ADMIN</Badge>
          </Group>
          <Group>
            <Badge color="green" variant="light">
              <IconActivity size={12} style={{ marginRight: 4 }} />
              System Operational
            </Badge>
            <Text size="sm" c="dimmed">
              {session?.user?.email}
            </Text>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg">
                  <IconBell size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Notifications</Menu.Label>
                <Menu.Item leftSection={<IconMail size={14} />}>
                  3 new messages
                </Menu.Item>
                <Menu.Item leftSection={<IconShield size={14} />}>
                  Security alert
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button 
              variant="light" 
              color="red" 
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea h="100%">
          <Stack gap="xs">
            <Title order={4} mb="md" c="dark">Navigation</Title>
            
            {navigationSections.map((section) => (
              <div key={section.title}>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
                  {section.title}
                </Text>
                {section.items.map((item) => (
                  <NavLink
                    key={item.key}
                    label={item.label}
                    leftSection={<item.icon size="1rem" />}
                    active={activeTab === item.key}
                    onClick={() => setActiveTab(item.key)}
                    style={{ borderRadius: 6 }}
                  />
                ))}
                <Divider my="sm" />
              </div>
            ))}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
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

          {/* Main Content */}
          {renderContent()}
        </Container>
      </AppShell.Main>

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
            label="Team"
            placeholder="Select team"
            value={formData.team}
            onChange={(value) => setFormData({ ...formData, team: value || 'main_team' })}
            data={teams.map(team => ({ value: team.id, label: team.name }))}
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
          <Select
            label="Tier"
            placeholder="Select tier"
            value={formData.tier}
            onChange={(value) => setFormData({ ...formData, tier: value || 'BASIC' })}
            data={[
              { value: 'BASIC', label: 'Basic' },
              { value: 'PREMIUM', label: 'Premium' },
              { value: 'ENTERPRISE', label: 'Enterprise' },
            ]}
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomer}
              loading={loading}
            >
              {editingCustomer ? 'Update' : 'Create'} Customer
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Invite Team Member Modal */}
      <Modal 
        opened={inviteModalOpened} 
        onClose={closeInviteModal} 
        title="Invite Team Member"
        size="md"
      >
        <Stack>
          <Alert icon={<IconMail size={16} />} title="Email Invitation" color="blue">
            Send a personalized invitation email to invite someone to join your team.
          </Alert>
          
          <TextInput
            label="Email Address"
            placeholder="Enter email address"
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            required
          />
          <TextInput
            label="First Name"
            placeholder="Enter first name"
            value={inviteData.firstName}
            onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
            required
          />
          <TextInput
            label="Last Name"
            placeholder="Enter last name"
            value={inviteData.lastName}
            onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
            required
          />
          <Select
            label="Role"
            placeholder="Select role"
            value={inviteData.role}
            onChange={(value) => setInviteData({ ...inviteData, role: value || 'SALES_REP' })}
            data={[
              { value: 'SALES_REP', label: 'Sales Representative' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
          <Select
            label="Team"
            placeholder="Select team"
            value={inviteData.teamId}
            onChange={(value) => setInviteData({ ...inviteData, teamId: value || 'main_team' })}
            data={teams.map(team => ({ value: team.id, label: team.name }))}
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeInviteModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteTeamMember}
              loading={loading}
              leftSection={<IconSend size={16} />}
            >
              Send Invitation
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Create Team Modal */}
      <Modal 
        opened={teamModalOpened} 
        onClose={closeTeamModal} 
        title="Create New Team"
        size="md"
      >
        <Stack>
          <TextInput
            label="Team Name"
            placeholder="Enter team name"
            value={teamData.name}
            onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter team description"
            value={teamData.description}
            onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
            rows={3}
          />
          <Select
            label="Team Type"
            placeholder="Select team type"
            value={teamData.type}
            onChange={(value) => setTeamData({ ...teamData, type: value || 'SALES' })}
            data={[
              { value: 'SALES', label: 'Sales Team' },
              { value: 'SUPPORT', label: 'Support Team' },
              { value: 'MARKETING', label: 'Marketing Team' },
              { value: 'DEVELOPMENT', label: 'Development Team' },
            ]}
          />
          <NumberInput
            label="Commission Rate (%)"
            placeholder="Enter commission rate"
            value={teamData.commissionRate}
            onChange={(value) => setTeamData({ ...teamData, commissionRate: Number(value) || 10 })}
            min={0}
            max={100}
            suffix="%"
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeTeamModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTeam}
              loading={loading}
              leftSection={<IconCheck size={16} />}
            >
              Create Team
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Invite Link Modal */}
      <Modal 
        opened={linkModalOpened} 
        onClose={closeLinkModal} 
        title="Invite Link Generated"
        size="md"
      >
        <Stack>
          <Alert icon={<IconLink size={16} />} title="Shareable Invite Link" color="green">
            Share this link with people you want to invite to your team. They can use it to register and join.
          </Alert>
          
          <TextInput
            label="Invite Link"
            value={inviteLink}
            readOnly
            rightSection={
              <ActionIcon onClick={handleCopyLink} variant="subtle" color="blue">
                <IconCopy size={16} />
              </ActionIcon>
            }
          />
          
          <Text size="sm" c="dimmed">
            This link will expire in 7 days. Anyone with this link can join your team as a Sales Representative.
          </Text>
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeLinkModal}>
              Close
            </Button>
            <Button 
              onClick={handleCopyLink}
              leftSection={<IconCopy size={16} />}
            >
              Copy Link
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}
