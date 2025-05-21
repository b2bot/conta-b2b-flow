
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  ChevronDown,
  Check,
  X,
  Download,
  Upload,
  MoreVertical,
  Loader
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { transactionsAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/fileUtils';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Define transaction type
interface Transaction {
  id: string;
  data: string;
  descricao: string;
  paymentTo: string;
  categoria_nome: string;
  valor: number;
  tipo: 'Despesa' | 'Receita';
  paid: boolean;
  recurrence: 'none' | 'monthly' | 'yearly';
  detalhes?: string;
  status?: string;
  categoria_id: string;
}

// Define new transaction form
interface TransactionForm {
  id?: string;
  descricao: string;
  valor: string;
  data: Date;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  paymentTo: string;
  centro_custo_id?: string;
  paid: boolean;
  recurrence: 'none' | 'monthly' | 'yearly';
  detalhes?: string;
}

const Transacoes = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    tipo: 'all',
    paid: 'all',
    categoria: 'all',
    contact: 'all',
  });
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [newTransaction, setNewTransaction] = useState<TransactionForm>({
    descricao: '',
    valor: '',
    data: new Date(),
    tipo: 'Despesa',
    categoria_id: '',
    paymentTo: '',
    centro_custo_id: '',
    paid: false,
    recurrence: 'none',
    detalhes: ''
  });

  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactionsData = [], isLoading, refetch } = useQuery({
    queryKey: ['transactions', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const response = await transactionsAPI.list();
      return response.status === 'success' ? response.transacoes : [];
    }
  });

  // Fetch categories for dropdown
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.list();
      return response.status === 'success' ? response.categorias : [];
    }
  });

  // Fetch contacts for dropdown
  const { data: contactsData = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await contactsAPI.list();
      return response.status === 'success' ? response.contatos : [];
    }
  });

  const transactions = transactionsData || [];
  const categories = categoriesData || [];
  const contacts = contactsData || [];

  const nextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, -1));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      tipo: 'all',
      paid: 'all',
      categoria: 'all',
      contact: 'all',
    });
    setActiveFilter(null);
  };

  const applyQuickFilter = (filterType: string) => {
    if (activeFilter === filterType) {
      resetFilters();
    } else {
      switch (filterType) {
        case 'receitas':
          setFilters(prev => ({ ...prev, tipo: 'Receita' }));
          break;
        case 'despesas-fixas':
          setFilters(prev => ({ ...prev, tipo: 'Despesa', categoria: 'Fixa' }));
          break;
        case 'impostos':
          setFilters(prev => ({ ...prev, tipo: 'Despesa', categoria: 'Imposto' }));
          break;
        default:
          break;
      }
      setActiveFilter(filterType);
    }
  };

  const resetTransactionForm = () => {
    setNewTransaction({
      descricao: '',
      valor: '',
      data: new Date(),
      tipo: 'Despesa',
      categoria_id: '',
      paymentTo: '',
      centro_custo_id: '',
      paid: false,
      recurrence: 'none',
      detalhes: ''
    });
    setIsEditing(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Filter by month/year
    const transactionDate = new Date(transaction.data);
    if (
      transactionDate.getMonth() !== currentMonth.getMonth() ||
      transactionDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      return false;
    }

    // Apply other filters
    if (filters.tipo !== 'all' && transaction.tipo !== filters.tipo) return false;
    if (filters.paid !== 'all') {
      if (filters.paid === 'paid' && !transaction.paid) return false;
      if (filters.paid === 'pending' && transaction.paid) return false;
    }
    if (filters.categoria !== 'all' && transaction.categoria_nome !== filters.categoria) return false;
    if (filters.contact !== 'all' && transaction.paymentTo !== filters.contact) return false;

    return true;
  });

  // Create/update transaction mutation
  const saveTransactionMutation = useMutation({
    mutationFn: (transaction: any) => transactionsAPI.save(transaction),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        toast({
          title: isEditing ? "Transação atualizada com sucesso" : "Transação criada com sucesso",
        });
        setDialogOpen(false);
        resetTransactionForm();
      } else {
        toast({
          title: "Erro ao salvar transação",
          description: data.message || "Ocorreu um erro ao salvar a transação",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar transação",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Toggle transaction paid status mutation
  const togglePaidStatusMutation = useMutation({
    mutationFn: (transaction: Transaction) => {
      return transactionsAPI.save({
        ...transaction,
        paid: !transaction.paid
      });
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else {
        toast({
          title: "Erro ao atualizar status",
          description: data.message || "Ocorreu um erro ao atualizar o status",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder - actual implementation would call the delete API
      // return await transactionsAPI.delete(id);
      // For now we'll simulate a successful delete
      return { status: 'success' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Transação excluída com sucesso",
      });
      setTransactionToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir transação",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const handleSaveTransaction = () => {
    if (!newTransaction.descricao || !newTransaction.valor || !newTransaction.categoria_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(newTransaction.valor.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido.",
        variant: "destructive",
      });
      return;
    }

    const dateString = format(newTransaction.data, 'yyyy-MM-dd');

    const transactionToSave = {
      ...(isEditing && newTransaction.id ? { id: newTransaction.id } : {}),
      data: dateString,
      descricao: newTransaction.descricao,
      categoria_id: newTransaction.categoria_id,
      paymentTo: newTransaction.paymentTo,
      valor: amount,
      tipo: newTransaction.tipo,
      paid: newTransaction.paid,
      recurrence: newTransaction.recurrence,
      detalhes: newTransaction.detalhes
    };

    saveTransactionMutation.mutate(transactionToSave);
  };

  const toggleTransactionPaid = (transaction: Transaction) => {
    togglePaidStatusMutation.mutate(transaction);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    deleteTransactionMutation.mutate(id);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setIsEditing(true);
    
    // Parse the transaction date
    let transactionDate;
    try {
      transactionDate = new Date(transaction.data);
    } catch (e) {
      transactionDate = new Date();
    }
    
    setNewTransaction({
      id: transaction.id,
      descricao: transaction.descricao,
      valor: transaction.valor.toString(),
      data: transactionDate,
      tipo: transaction.tipo,
      categoria_id: transaction.categoria_id,
      paymentTo: transaction.paymentTo,
      paid: transaction.paid,
      recurrence: transaction.recurrence,
      detalhes: transaction.detalhes || ''
    });
    
    setDialogOpen(true);
  };

  const toggleExpandTransaction = (id: string) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  const getPaymentStatusTag = (transaction: Transaction) => {
    if (transaction.recurrence === 'monthly') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Mensal</Badge>;
    } else if (transaction.recurrence === 'yearly') {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Anual</Badge>;
    } else if (transaction.status) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">{transaction.status}</Badge>;
    }
    return null;
  };

  // Effect to handle filtering based on quick filters
  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  // Generates the table headers based on the transaction type filter
  const renderTableHeaders = () => {
    // Default headers for all transaction types
    if (filters.tipo === 'all') {
      return (
        <>
          <div className="col-span-1">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">{filters.tipo === 'Receita' ? 'Recebido de' : 'Pago a'}</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
        </>
      );
    }
    
    // Headers for Receita transactions
    if (filters.tipo === 'Receita') {
      return (
        <>
          <div className="col-span-1">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">Recebido de</div>
          <div className="col-span-2">Tipo pagamento</div>
          <div className="col-span-2 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
        </>
      );
    }
    
    // Headers for Despesa transactions
    return (
      <>
        <div className="col-span-1">Data</div>
        <div className="col-span-3">Descrição</div>
        <div className="col-span-2">Pago a</div>
        <div className="col-span-2">Categoria</div>
        <div className="col-span-2 text-right">Valor</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1"></div>
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Transações</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus size={18} className="mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">
                {isEditing ? 'Editar Transação' : 'Nova Transação'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Tipo</Label>
                  <Select
                    value={newTransaction.tipo}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, tipo: value as 'Despesa' | 'Receita' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                      <SelectItem value="Receita">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    placeholder="0,00"
                    value={newTransaction.valor}
                    onChange={(e) => setNewTransaction({ ...newTransaction, valor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição da transação"
                  value={newTransaction.descricao}
                  onChange={(e) => setNewTransaction({ ...newTransaction, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newTransaction.categoria_id}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, categoria_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-to">Contato</Label>
                  <Select
                    value={newTransaction.paymentTo}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, paymentTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>{contact.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <div>{format(newTransaction.data, 'dd/MM/yyyy')}</div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newTransaction.data}
                        onSelect={(date) => date && setNewTransaction({ ...newTransaction, data: date })}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrence">Recorrência</Label>
                  <Select
                    value={newTransaction.recurrence}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, recurrence: value as 'none' | 'monthly' | 'yearly' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não recorrente</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Detalhes adicionais</Label>
                <Input
                  id="details"
                  placeholder="Informações adicionais"
                  value={newTransaction.detalhes || ''}
                  onChange={(e) => setNewTransaction({ ...newTransaction, detalhes: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="paid"
                  checked={newTransaction.paid}
                  onCheckedChange={(checked) =>
                    setNewTransaction({ ...newTransaction, paid: checked })
                  }
                />
                <Label htmlFor="paid">
                  {newTransaction.tipo === 'Despesa' ? 'Pago' : 'Recebido'}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                resetTransactionForm();
              }}>Cancelar</Button>
              <Button className="bg-purple hover:bg-purple/90" onClick={handleSaveTransaction}>
                {saveTransactionMutation.isPending ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processando
                  </>
                ) : isEditing ? 'Atualizar Transação' : 'Criar Transação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-border">
        <Button variant="ghost" onClick={prevMonth} className="text-purple">
          <ChevronLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-purple-dark">
          {format(currentMonth, 'MMMM/yyyy', { locale: ptBR }).toUpperCase()}
        </h2>
        <Button variant="ghost" onClick={nextMonth} className="text-purple">
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Quick filter buttons */}
      <div className="flex flex-wrap gap-2">
        <ToggleGroup type="single" value={activeFilter || undefined}>
          <ToggleGroupItem 
            value="receitas" 
            className="rounded-full"
            onClick={() => applyQuickFilter('receitas')}
          >
            <Badge className={`${activeFilter === 'receitas' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'}`}>Recebimentos</Badge>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="despesas-fixas" 
            className="rounded-full"
            onClick={() => applyQuickFilter('despesas-fixas')}
          >
            <Badge className={`${activeFilter === 'despesas-fixas' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'}`}>Despesas Fixas</Badge>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="impostos" 
            className="rounded-full"
            onClick={() => applyQuickFilter('impostos')}
          >
            <Badge className={`${activeFilter === 'impostos' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'}`}>Impostos</Badge>
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Filter size={16} />
          Filtrar
          <ChevronDown size={16} className={filterOpen ? "rotate-180 transform" : ""} />
        </Button>
        {(filters.tipo !== 'all' || filters.paid !== 'all' || filters.categoria !== 'all' || filters.contact !== 'all') && !activeFilter && (
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground"
            onClick={resetFilters}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {filterOpen && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-tipo">Tipo</Label>
                <Select
                  value={filters.tipo}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Receita">Receitas</SelectItem>
                    <SelectItem value="Despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-paid">Status</Label>
                <Select
                  value={filters.paid}
                  onValueChange={(value) => handleFilterChange('paid', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos/Recebidos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-categoria">Categoria</Label>
                <Select
                  value={filters.categoria}
                  onValueChange={(value) => handleFilterChange('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.nome}>{category.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-contact">Contato</Label>
                <Select
                  value={filters.contact}
                  onValueChange={(value) => handleFilterChange('contact', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.nome}>{contact.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-gray-50 text-sm font-medium text-muted-foreground">
          {renderTableHeaders()}
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando transações...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma transação encontrada para este período.
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <div 
                className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-gray-50 transition-colors items-center text-sm"
              >
                <div className="col-span-1">
                  {format(new Date(transaction.data), 'dd/MM/yyyy')}
                </div>
                <div className="col-span-3 font-medium">
                  <div className="flex items-center gap-2">
                    {transaction.descricao}
                    {getPaymentStatusTag(transaction)}
                  </div>
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {transaction.paymentTo}
                </div>
                <div className="col-span-2">
                  <Badge 
                    variant="outline" 
                    className={`px-2 py-1 text-xs border-1 ${
                      transaction.tipo === 'Receita' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
                    }`}
                  >
                    {transaction.categoria_nome}
                  </Badge>
                </div>
                <div
                  className={`col-span-2 font-medium text-right ${
                    transaction.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(transaction.valor)}
                </div>
                <div className="col-span-1 flex justify-center">
                  <Switch 
                    checked={transaction.paid}
                    onCheckedChange={() => toggleTransactionPaid(transaction)}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleExpandTransaction(transaction.id)}>
                        {expandedTransaction === transaction.id ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Expanded transaction details */}
              {expandedTransaction === transaction.id && (
                <div className="border-b border-border bg-muted/20 px-4 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="mb-2">
                        <span className="font-medium">Descrição completa:</span> 
                        <p className="text-muted-foreground mt-1">{transaction.detalhes || 'Sem descrição adicional.'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Data de criação:</span> 
                        <p className="text-muted-foreground">{format(new Date(transaction.data), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <span className="font-medium">Contato:</span> 
                        <p className="text-muted-foreground">{transaction.paymentTo}</p>
                      </div>
                      <div>
                        <span className="font-medium">Tipo de recorrência:</span> 
                        <p className="text-muted-foreground">
                          {transaction.recurrence === 'monthly' ? 'Mensal' : 
                           transaction.recurrence === 'yearly' ? 'Anual' : 'Não recorrente'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default Transacoes;
