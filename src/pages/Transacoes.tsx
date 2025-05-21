import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  ChevronDown,
  Check,
  X
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
// import FileImport from '@/components/FileImport';
// import { exportToExcel } from '@/utils/fileUtils';

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
}

// Define new transaction form
interface TransactionForm {
  descricao: string;
  valor: string;
  data: Date;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  paymentTo: string;
  centro_custo_id?: string;
  paid: boolean;
  recurrence: 'none' | 'monthly' | 'yearly';
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

  const [newTransaction, setNewTransaction] = useState<TransactionForm>({
    descricao: '',
    valor: '',
    data: new Date(),
    tipo: 'Despesa',
    categoria_id: '',
    paymentTo: '',
    centro_custo_id: '',
    paid: false,
    recurrence: 'none'
  });

  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactionsData = [], isLoading } = useQuery({
    queryKey: ['transactions'],
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
      recurrence: 'none'
    });
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

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (transaction: any) => transactionsAPI.save(transaction),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        toast({
          title: "Transação criada com sucesso",
        });
        setDialogOpen(false);
        resetTransactionForm();
      } else {
        toast({
          title: "Erro ao criar transação",
          description: data.message || "Ocorreu um erro ao criar a transação",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar transação",
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

  const handleCreateTransaction = () => {
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

    const createdTransaction = {
      data: dateString,
      descricao: newTransaction.descricao,
      categoria_id: newTransaction.categoria_id,
      paymentTo: newTransaction.paymentTo,
      valor: amount,
      tipo: newTransaction.tipo,
      paid: newTransaction.paid,
      recurrence: newTransaction.recurrence
    };

    createTransactionMutation.mutate(createdTransaction);
  };

  const toggleTransactionPaid = (transaction: Transaction) => {
    togglePaidStatusMutation.mutate(transaction);
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
              <DialogTitle className="text-purple-dark">Nova Transação</DialogTitle>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="paid"
                  checked={newTransaction.paid}
                  onCheckedChange={(checked) =>
                    setNewTransaction({ ...newTransaction, paid: checked as boolean })
                  }
                />
                <Label htmlFor="paid">
                  {newTransaction.tipo === 'Despesa' ? 'Pago' : 'Recebido'}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-purple hover:bg-purple/90" onClick={handleCreateTransaction}>
                Criar Transação
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

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Filter size={16} />
          Filtrar
          <ChevronDown size={16} className={filterOpen ? "rotate-180 transform" : ""} />
        </Button>
        {filters.tipo !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.tipo === 'Receita' ? 'Receitas' : 'Despesas'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('tipo', 'all')} />
          </div>
        )}
        {filters.paid !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.paid === 'paid' ? 'Pagas' : 'Pendentes'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('paid', 'all')} />
          </div>
        )}
        {filters.categoria !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.categoria}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('categoria', 'all')} />
          </div>
        )}
        {filters.contact !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.contact}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('contact', 'all')} />
          </div>
        )}
        {(filters.tipo !== 'all' || filters.paid !== 'all' || filters.categoria !== 'all' || filters.contact !== 'all') && (
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
          <div className="col-span-1">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">Pago a</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
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
            <div
              key={transaction.id}
              className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-gray-50 transition-colors items-center text-sm"
            >
              <div className="col-span-1">
                {format(new Date(transaction.data), 'dd/MM/yyyy')}
              </div>
              <div className="col-span-3 font-medium">
                {transaction.descricao}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {transaction.paymentTo}
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                  {transaction.categoria_nome}
                </span>
              </div>
              <div
                className={`col-span-2 font-medium text-right ${
                  transaction.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.valor)}
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    transaction.paid
                      ? 'bg-purple border-purple text-white'
                      : 'border-gray-300'
                  }`}
                  onClick={() => toggleTransactionPaid(transaction)}
                >
                  {transaction.paid && <Check size={12} />}
                </button>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transacoes;
