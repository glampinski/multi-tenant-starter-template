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
  NumberInput,
  Select,
  Stack,
  LoadingOverlay,
  Center,
  SimpleGrid,
  ThemeIcon,
  RingProgress
} from '@mantine/core';
import { 
  IconEdit, 
  IconTrash, 
  IconPlus,
  IconEye,
  IconCoin,
  IconTrendingUp,
  IconCalendar,
  IconShoppingCart,
  IconTarget
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';

interface Sale {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  commission: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  saleDate: string;
  product: string;
  notes?: string;
}

export default function MySalesPage() {
  const params = useParams<{ teamId: string }>();
  const { data: session } = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    amount: 0,
    product: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'CANCELLED',
    notes: ''
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      
      // Mock data for immediate display
      const mockSales: Sale[] = [
        {
          id: '1',
          customerName: 'Emma Thompson',
          customerEmail: 'emma@example.com',
          amount: 2500,
          commission: 375,
          status: 'COMPLETED',
          saleDate: '2024-01-15',
          product: 'Premium Package',
          notes: 'Upgrade from basic plan'
        },
        {
          id: '2',
          customerName: 'James Rodriguez',
          customerEmail: 'james@example.com',
          amount: 1800,
          commission: 270,
          status: 'COMPLETED',
          saleDate: '2024-01-12',
          product: 'Standard Package',
          notes: 'New customer referral'
        },
        {
          id: '3',
          customerName: 'Sophia Chen',
          customerEmail: 'sophia@example.com',
          amount: 3200,
          commission: 480,
          status: 'PENDING',
          saleDate: '2024-01-10',
          product: 'Enterprise Package',
          notes: 'Waiting for approval'
        },
        {
          id: '4',
          customerName: 'Michael Johnson',
          customerEmail: 'michael@example.com',
          amount: 1200,
          commission: 180,
          status: 'COMPLETED',
          saleDate: '2024-01-08',
          product: 'Basic Package'
        }
      ];
      
      setSales(mockSales);
    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      amount: sale.amount,
      product: sale.product,
      status: sale.status,
      notes: sale.notes || ''
    });
    open();
  };

  const handleAdd = () => {
    setEditingSale(null);
    setFormData({
      customerName: '',
      customerEmail: '',
      amount: 0,
      product: '',
      status: 'PENDING',
      notes: ''
    });
    open();
  };

  const handleSubmit = () => {
    const commission = formData.amount * 0.15; // 15% commission
    
    notifications.show({
      title: editingSale ? 'Sale Updated' : 'Sale Added',
      message: `Sale for ${formData.customerName} has been ${editingSale ? 'updated' : 'recorded'} successfully.`,
      color: 'green',
    });
    close();
    // In real app, would make API call here
    loadSales();
  };

  const handleDelete = (sale: Sale) => {
    notifications.show({
      title: 'Sale Deleted',
      message: `Sale for ${sale.customerName} has been removed.`,
      color: 'red',
    });
    // In real app, would make API call here
    setSales(sales.filter(s => s.id !== sale.id));
  };

  // Calculate statistics
  const totalSales = sales.reduce((sum, sale) => sum + (sale.status === 'COMPLETED' ? sale.amount : 0), 0);
  const totalCommission = sales.reduce((sum, sale) => sum + (sale.status === 'COMPLETED' ? sale.commission : 0), 0);
  const completedSales = sales.filter(s => s.status === 'COMPLETED').length;
  const pendingSales = sales.filter(s => s.status === 'PENDING').length;
  const monthlyTarget = 50000;
  const targetProgress = Math.round((totalSales / monthlyTarget) * 100);

  const rows = sales.map((sale) => (
    <Table.Tr key={sale.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar color="initials" name={sale.customerName} />
          <div>
            <Text size="sm" fw={500}>
              {sale.customerName}
            </Text>
            <Text size="xs" c="dimmed">
              {sale.customerEmail}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{sale.product}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>${sale.amount.toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="green">${sale.commission.toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Badge 
          color={
            sale.status === 'COMPLETED' ? 'green' : 
            sale.status === 'PENDING' ? 'yellow' : 'red'
          }
        >
          {sale.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(sale.saleDate).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={5}>
          <ActionIcon variant="subtle" onClick={() => handleEdit(sale)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(sale)}>
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
          <Text size="xl" fw={700} mb="xs">My Sales</Text>
          <Text c="dimmed">
            Track your sales performance and commission earnings
          </Text>
        </div>

        {/* Statistics Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Total Sales
                </Text>
                <Text fw={700} size="xl">
                  ${totalSales.toLocaleString()}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size={38} radius="md">
                <IconCoin size={20} />
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
                  Commission Earned
                </Text>
                <Text fw={700} size="xl">
                  ${totalCommission.toLocaleString()}
                </Text>
              </div>
              <ThemeIcon color="blue" variant="light" size={38} radius="md">
                <IconTrendingUp size={20} />
              </ThemeIcon>
            </Group>
            <Text c="dimmed" size="sm" mt="md">
              15% commission rate
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Completed Sales
                </Text>
                <Text fw={700} size="xl">
                  {completedSales}
                </Text>
              </div>
              <Badge color="green" size="lg">
                {pendingSales} Pending
              </Badge>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" fw={500} tt="uppercase">
                  Target Progress
                </Text>
                <Text fw={700} size="xl">
                  {targetProgress}%
                </Text>
              </div>
              <RingProgress
                size={60}
                roundCaps
                thickness={8}
                sections={[{ value: targetProgress, color: targetProgress >= 75 ? 'green' : targetProgress >= 50 ? 'yellow' : 'red' }]}
                label={
                  <Center>
                    <IconTarget size={16} />
                  </Center>
                }
              />
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Sales Table */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>Sales History</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
              Record Sale
            </Button>
          </Group>
          
          <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} />
            
            {!loading && sales.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="md">
                  <IconShoppingCart size={48} color="gray" />
                  <Text c="dimmed">No sales recorded yet. Record your first sale to get started.</Text>
                  <Button onClick={handleAdd}>Record Sale</Button>
                </Stack>
              </Center>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Customer</Table.Th>
                    <Table.Th>Product</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Commission</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date</Table.Th>
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
      <Modal opened={opened} onClose={close} title={editingSale ? "Edit Sale" : "Record Sale"} size="md">
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Customer Name"
              placeholder="Enter customer name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
            />
            <TextInput
              label="Customer Email"
              placeholder="Enter email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              required
            />
          </Group>
          
          <Group grow>
            <TextInput
              label="Product/Service"
              placeholder="Enter product name"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              required
            />
            <NumberInput
              label="Sale Amount"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: typeof value === 'number' ? value : 0 })}
              min={0}
              prefix="$"
              thousandSeparator=","
              required
            />
          </Group>
          
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: (value as any) || 'PENDING' })}
            data={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            required
          />
          
          <TextInput
            label="Notes (Optional)"
            placeholder="Additional notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          
          {formData.amount > 0 && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" c="dimmed">
                Estimated Commission (15%): <Text component="span" fw={500} c="green">${(formData.amount * 0.15).toLocaleString()}</Text>
              </Text>
            </Paper>
          )}
          
          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingSale ? 'Update Sale' : 'Record Sale'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
