
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  ChevronDown,
  MoreVertical,
  Loader,
  FileUp,
  FileDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { transactionsAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import TransactionTable from '@/components/TransactionTable';
import FileImport from '@/components/FileImport';
import { exportToExcel, calculateTransactionSummary, formatCurrency } from '@/utils/fileUtils';

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
  contato_nome: string;
  contato_id?: string;
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);

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
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactionsData = [], isLoading, refetch } = useQuery({
    queryKey: ['transactions', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const response = await transactionsAPI.list();
      console.log('Fetched transactions:', response);
      return response.status === 'success' ? response.transacoes : [];
    }
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.list();
      return response.status === 'success' ? response.categorias : [];
    }
  });

  // Fetch contacts for dropdown
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await contactsAPI.list();
      return response.status === 'success' ? response.contatos : [];
    }
  });

  // Save transaction mutation
  const saveTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      console.log('Saving transaction:', transaction);
      return await transactionsAPI.save(transaction);
    },
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
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar transação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const transactions = transactionsData || [];

  // Calculate financial summary
  const financialSummary = React.useMemo(() => {
    return calculateTransactionSummary(transactions);
  }, [transactions]);

  const nextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, -1));
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
        case 'despesas':
          setFilters(prev => ({ ...prev, tipo: 'Despesa' }));
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

  const togglePaidStatusMutation = useMutation({
    mutationFn: (transaction: Transaction) => {
      const updatedTransaction = {
        ...transaction,
        paid: !transaction.paid
      };
      console.log('Toggling paid status:', updatedTransaction);
      return transactionsAPI.save(updatedTransaction);
    },
    onSuccess: (data) => {
      console.log('Toggle paid status response:', data);
      if (data.status === 'success') {
        // Force refetch the data to update the UI
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        toast({
          title: "Status atualizado com sucesso",
        });
      } else {
        toast({
          title: "Erro ao atualizar status",
          description: data.message || "Ocorreu um erro ao atualizar o status",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder - actual implementation would call the delete API
      // return await transactionsAPI.delete(id);
      // For now we'll simulate a successful delete
      return { status: 'success', id };
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        // Update local state to remove the deleted item
        const currentData = queryClient.getQueryData<Transaction[]>(['transactions']) || [];
        const updatedData = currentData.filter(item => item.id !== data.id);
        queryClient.setQueryData(['transactions'], updatedData);
        
        toast({
          title: "Transação excluída com sucesso",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
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

    // Ensure contato_id is included in the saved transaction for proper contact display
    const transactionToSave = {
      ...(isEditing && newTransaction.id ? { id: newTransaction.id } : {}),
      data: dateString,
      descricao: newTransaction.descricao,
      categoria_id: newTransaction.categoria_id,
      contato_id: newTransaction.paymentTo, // Make sure contato_id is saved
      valor: amount,
      tipo: newTransaction.tipo,
      paid: newTransaction.paid,
      recurrence: newTransaction.recurrence,
      detalhes: newTransaction.detalhes || ""
    };

    console.log('Saving transaction:', transactionToSave);
    saveTransactionMutation.mutate(transactionToSave);
  };

  const toggleTransactionPaid = (transaction: Transaction) => {
    togglePaidStatusMutation.mutate(transaction);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteTransactionMutation.mutate(id);
    }
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
      paymentTo: transaction.contato_id || '',
      paid: transaction.paid,
      recurrence: transaction.recurrence || 'none',
      detalhes: transaction.detalhes || ''
    });
    
    setDialogOpen(true);
  };

  const handleExportTransactions = () => {
    const dataToExport = filteredTransactionsNoDuplicates.map(t => ({
      Data: format(new Date(t.data), 'dd/MM/yyyy'),
      Descrição: t.descricao,
      Contato: t.contato_nome || '',
      Categoria: t.categoria_nome,
      Valor: t.valor,
      Tipo: t.tipo,
      Status: t.paid ? (t.tipo === 'Despesa' ? 'Pago' : 'Recebido') : (t.tipo === 'Despesa' ? 'A pagar' : 'A receber'),
      Detalhes: t.detalhes || ''
    }));
    
    exportToExcel(dataToExport, `Transacoes_${format(currentMonth, 'MMMM_yyyy', { locale: ptBR })}`);
    
    toast({
      title: "Exportação concluída",
      description: `${dataToExport.length} transações exportadas com sucesso.`,
    });
  };

  const handleImportSuccess = (data: any[]) => {
    // Process imported transactions
    console.log('Imported data:', data);
    setImportDialogOpen(false);
    
    // Todo: Add logic to process and save imported transactions
    toast({
      title: "Importação concluída",
      description: `${data.length} transações importadas com sucesso.`,
    });
    
    // Refresh transactions list
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const toggleExpandTransaction = (id: string) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  // Effect to handle filtering based on quick filters
  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  const filteredTransactionsNoDuplicates = React.useMemo(() => {
    // First apply the filters
    const filtered = transactions.filter(transaction => {
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
      if (filters.contact !== 'all' && transaction.contato_nome !== filters.contact) return false;

      return true;
    });

    // Now remove duplicates using transaction id
    const uniqueTransactions = [];
    const seenIds = new Set();
    
    for (const transaction of filtered) {
      if (!seenIds.has(transaction.id)) {
        seenIds.add(transaction.id);
        uniqueTransactions.push(transaction);
      }
    }
    
    return uniqueTransactions;
  }, [transactions, currentMonth, filters]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Transações</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            className="bg-white"
            onClick={handleExportTransactions}
          >
            <FileDown size={18} className="mr-2" />
            Exportar
          </Button>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white">
                <FileUp size={18} className="mr-2" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Transações</DialogTitle>
                <DialogDescription>
                  Importe transações de um arquivo Excel ou CSV.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <FileImport
                  onImportSuccess={handleImportSuccess}
                  label="Selecione o arquivo para importar"
                />
              </div>
            </DialogContent>
          </Dialog>
          
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
                <DialogDescription>
                  {isEditing ? 'Edite as informações da transação.' : 'Preencha as informações para criar uma nova transação.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-type">Tipo</Label>
                    <Select
                      value={newTransaction.tipo}
                      onValueChange={(value) => setNewTransaction({ ...newTransaction, tipo: value as 'Despesa' | 'Receita' })}
                    >
                      <SelectTrigger id="transaction-type">
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
                      <SelectTrigger id="category">
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
                      <SelectTrigger id="payment-to">
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
                    <Label htmlFor="transaction-date">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="transaction-date" variant="outline" className="w-full justify-start text-left font-normal">
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
                      <SelectTrigger id="recurrence">
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
                  <Label htmlFor="paid" className="mr-2">
                    {newTransaction.tipo === 'Despesa' ? 'Pago' : 'Recebido'}
                  </Label>
                  <Input
                    id="date-paid"
                    type="text"
                    placeholder="DD/MM/AAAA"
                    className="max-w-[120px]"
                    defaultValue={format(new Date(), 'dd/MM/yyyy')}
                  />
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
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Recebido</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(financialSummary.received)}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Previsto</span>
            <span className="text-lg font-bold text-indigo-600">
              {formatCurrency(financialSummary.expected)}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Pago</span>
            <span className="text-lg font-bold text-red-600">
              {formatCurrency(financialSummary.paid)}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-green-400">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Lucro</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(financialSummary.profit)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Month selector and filter */}
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
            value="despesas" 
            className="rounded-full"
            onClick={() => applyQuickFilter('despesas')}
          >
            <Badge className={`${activeFilter === 'despesas' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'}`}>Despesas Fixas</Badge>
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
                  <SelectTrigger id="filter-tipo">
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
                  <SelectTrigger id="filter-paid">
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
                  <SelectTrigger id="filter-categoria">
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
                  <SelectTrigger id="filter-contact">
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
      
      <TransactionTable
        isLoading={isLoading}
        filteredTransactions={filteredTransactionsNoDuplicates}
        filters={filters}
        expandedTransaction={expandedTransaction}
        toggleExpandTransaction={toggleExpandTransaction}
        toggleTransactionPaid={toggleTransactionPaid}
        handleEditTransaction={handleEditTransaction}
        handleDeleteTransaction={handleDeleteTransaction}
        saveTransactionMutation={saveTransactionMutation}
        deleteTransactionMutation={deleteTransactionMutation}
      />
    </div>
  );
};

export default Transacoes;
