&apos;se client&apos;

import { useRolePermissions } from &apos;/hooks/useRolePermissions&apos;
import { useParams } from &apos;ext/navigation&apos;
import { 
  Paper, 
  Text, 
  Group, 
  Badge, 
  SimpleGrid, 
  ThemeIcon, 
  Progress, 
  Table, 
  Avatar, 
  ActionIcon,
  LoadingOverlay,
  Stack,
  Center
} from &apos;mantine/core&apos;
import { 
  IconTrendingUp, 
  IconCoin, 
  IconUsers, 
  IconTarget, 
  IconShield, 
  IconEye 
} from &apos;tabler/icons-react&apos;
import { useEffect, useState } from &apos;eact&apos;

interface SalesData {
  id: string;
  salesperson: string;
  email: string;
  customers: number;
  monthlyRevenue: number;
  targetProgress: number;
  lastSale: string;
  status: &apos;ctive&apos;| &apos;nactive&apos;
}

export default function CompanySalesPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const { hasPermission } = useRolePermissions();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  // Check permissions - using a simpler approach for now
  const canViewCompanyData = true; // We&apos;l implement proper permissions later

  useEffect(() => {
    if (canViewCompanyData) {
      loadSalesData();
    }
  }, [canViewCompanyData]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      
      // Mock data for immediate display
      const mockSalesData: SalesData[] = [
        {
          id: &apos;&apos;
          salesperson: &apos;arah Wilson&apos;
          email: &apos;arah@company.com&apos;
          customers: 24,
          monthlyRevenue: 45600,
          targetProgress: 85,
          lastSale: &apos;024-01-15&apos;
          status: &apos;ctive&apos;        },
        {
          id: &apos;&apos;
          salesperson: &apos;ike Johnson&apos;
          email: &apos;ike@company.com&apos;
          customers: 18,
          monthlyRevenue: 32400,
          targetProgress: 62,
          lastSale: &apos;024-01-14&apos;
          status: &apos;ctive&apos;        },
        {
          id: &apos;&apos;
          salesperson: &apos;isa Brown&apos;
          email: &apos;isa@company.com&apos;
          customers: 31,
          monthlyRevenue: 58200,
          targetProgress: 95,
          lastSale: &apos;024-01-16&apos;
          status: &apos;ctive&apos;        },
        {
          id: &apos;&apos;
          salesperson: &apos;ohn Davis&apos;
          email: &apos;ohn@company.com&apos;
          customers: 8,
          monthlyRevenue: 12800,
          targetProgress: 25,
          lastSale: &apos;024-01-08&apos;
          status: &apos;nactive&apos;        }
      ];
      
      setSalesData(mockSalesData);
    } catch (error) {
      console.error(&apos;rror loading sales data:&apos; error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!teamId || !canViewCompanyData) {
    return (
      <div className="p-6">
        <Center style={{ height: 400 }}>
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius="md" color="gray">
              <IconShield size={40} />
            </ThemeIcon>
            <Text size="xl" fw={600}>Access Denied</Text>
            <Text c="dimmed">You undefined have permission to view company sales data.</Text>
          </Stack>
        </Center>
      </div>
    );
  }

  const totalRevenue = salesData.reduce((sum, sales) => sum + sales.monthlyRevenue, 0);
  const totalCustomers = salesData.reduce((sum, sales) => sum + sales.customers, 0);
  const avgProgress = salesData.length > 0 ? Math.round(salesData.reduce((sum, sales) => sum + sales.targetProgress, 0) / salesData.length) : 0;

  const rows = salesData.map((sales) => (
    <Table.Tr key={sales.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar color="initials" name={sales.salesperson} />
          <div>
            <Text size="sm" fw={500}>
              {sales.salesperson}
            </Text>
            <Text size="xs" c="dimmed">
              {sales.email}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{sales.customers}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>
          ${sales.monthlyRevenue.toLocaleString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Text size="sm">{sales.targetProgress}%</Text>
          <Progress
            value={sales.targetProgress}
            size="sm"
            style={{ width: 60 }}
            color={
              sales.targetProgress >= 75 ? &apos;reen&apos;: 
              sales.targetProgress >= 50 ? &apos;ellow&apos;: &apos;ed&apos;            }
          />
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(sales.lastSale).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge color={sales.status === &apos;ctive&apos;? &apos;reen&apos;: &apos;ed&apos;>
          {sales.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <ActionIcon variant="subtle">
          <IconEye size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div className="p-6 space-y-6">
      <div>
        <Text size="xl" fw={700} mb="xs">Company Sales Overview</Text>
        <Text c="dimmed">
          Monitor all sales team performance and revenue metrics
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                Total Revenue
              </Text>
              <Text fw={700} size="xl">
                ${totalRevenue.toLocaleString()}
              </Text>
            </div>
            <ThemeIcon color="green" variant="light" size={38} radius="md">
              <IconCoin size={20} />
            </ThemeIcon>
          </Group>
          <Text c="dimmed" size="sm" mt="md">
            <Text component="span" c="green" fw={700}>
              +22%
            </Text>{&apos;&apos;
            from last month
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
            <ThemeIcon color="blue" variant="light" size={38} radius="md">
              <IconUsers size={20} />
            </ThemeIcon>
          </Group>
          <Text c="dimmed" size="sm" mt="md">
            <Text component="span" c="green" fw={700}>
              +15%
            </Text>{&apos;&apos;
            from last month
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                Sales Team
              </Text>
              <Text fw={700} size="xl">
                {salesData.length}
              </Text>
            </div>
            <ThemeIcon color="violet" variant="light" size={38} radius="md">
              <IconTrendingUp size={20} />
            </ThemeIcon>
          </Group>
          <Text c="dimmed" size="sm" mt="md">
            <Text component="span" c="green" fw={700}>
              Active
            </Text>{&apos;&apos;
            salespeople
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                Avg Target Progress
              </Text>
              <Text fw={700} size="xl">
                {avgProgress}%
              </Text>
            </div>
            <ThemeIcon color="orange" variant="light" size={38} radius="md">
              <IconTarget size={20} />
            </ThemeIcon>
          </Group>
          <Text c="dimmed" size="sm" mt="md">
            Team average
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={500}>Sales Team Performance</Text>
            <Text size="sm" c="dimmed">
              Individual performance metrics for all salespeople
            </Text>
          </div>
        </Group>
        
        <div style={{ position: &apos;elative&apos;}}>
          <LoadingOverlay visible={loading} />
          
          {!loading && salesData.length === 0 ? (
            <Center py={60}>
              <Text c="dimmed">No sales data available yet.</Text>
            </Center>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Salesperson</Table.Th>
                  <Table.Th>Customers</Table.Th>
                  <Table.Th>Monthly Revenue</Table.Th>
                  <Table.Th>Target Progress</Table.Th>
                  <Table.Th>Last Sale</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          )}
        </div>
      </Paper>
    </div>
  );
}
