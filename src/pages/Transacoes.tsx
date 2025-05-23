import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  ChevronDown,
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
  // Estado local para armazenar os totais calculados
  const [financialSummary, setFinancialSummary] = useState({
    received: 0,
    expected: 0,
    paid: 0,
    profit: 0
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

  // Atualiza os totais sempre que as transações mudarem
  useEffect(() => {
    const summary = calculateTransactionSummary(transactions);
    setFinancialSummary(summary);
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
        // Força a atualização dos dados
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        // Busca as transações atualizadas imediatamente
        refetch().then(result => {
          if (result.data) {
            // Recalcula os totais com os dados atualizados
            const updatedSummary = calculateTransactionSummary(result.data);
            setFinancialSummary(updatedSummary);
          }
        });
        
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
        
        // Recalcula os totais após a exclusão
        const updatedSummary = calculateTransactionSummary(updatedData);
        setFinancialSummary(updatedSummary);
        
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

  const handleDuplicateTransaction = (transaction: Transaction) => {
    // Create a new transaction based on the selected one, but without ID
    const duplicatedTransaction = {
      ...transaction,
      id: undefined, // Remove ID to create a new transaction
      data: format(new Date(), 'yyyy-MM-dd'), // Set date to today
      paid: false // Reset paid status
    };
    
    // Convert to form model for editing
    setNewTransaction({
      descricao: duplicatedTransaction.descricao,
      valor: duplicatedTransaction.valor.toString(),
      data: new Date(),
      tipo: duplicatedTransaction.tipo,
      categoria_id: duplicatedTransaction.categoria_id,
      paymentTo: duplicatedTransaction.contato_id || '',
      paid: false,
      recurrence: duplicatedTransaction.recurrence || 'none',
      detalhes: duplicatedTransaction.detalhes || ''
    });
    
    setIsEditing(false); // It's a new transaction, not an edit
    setDialogOpen(true);
    
    toast({
      title: "Transação duplicada",
      description: "Edite os detalhes conforme necessário e salve.",
    });
  };

  const handleAttachFile = (transactionId: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A funcionalidade para anexar arquivos estará disponível em breve.",
    });
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
                  Importe transações a partir de um arquivo Excel ou CSV.
                </DialogDescription>
              </DialogHeader>
              <FileImport onImportSuccess={handleImportSuccess} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={18} className="mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Edite os detalhes da transação abaixo.' : 'Preencha os detalhes da nova transação abaixo.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={newTransaction.tipo}
                      onValueChange={(value) => setNewTransaction({...newTransaction, tipo: value as 'Despesa' | 'Receita'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Despesa">Despesa</SelectItem>
                        <SelectItem value="Receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      placeholder="0,00"
                      value={newTransaction.valor}
                      onChange={(e) => setNewTransaction({...newTransaction, valor: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    placeholder="Descrição da transação"
                    value={newTransaction.descricao}
                    onChange={(e) => setNewTransaction({...newTransaction, descricao: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {format(newTransaction.data, 'dd/MM/yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newTransaction.data}
                          onSelect={(date) => date && setNewTransaction({...newTransaction, data: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={newTransaction.categoria_id}
                      onValueChange={(value) => setNewTransaction({...newTransaction, categoria_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(cat => cat.tipo === newTransaction.tipo)
                          .map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.nome}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Select
                    value={newTransaction.paymentTo}
                    onValueChange={(value) => setNewTransaction({...newTransaction, paymentTo: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o contato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTransaction.paid ? "paid" : "pending"}
                    onValueChange={(value) => setNewTransaction({...newTransaction, paid: value === "paid"})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        {newTransaction.tipo === 'Despesa' ? 'A pagar' : 'A receber'}
                      </SelectItem>
                      <SelectItem value="paid">
                        {newTransaction.tipo === 'Despesa' ? 'Pago' : 'Recebido'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrence">Recorrência</Label>
                  <Select
                    value={newTransaction.recurrence}
                    onValueChange={(value) => setNewTransaction({...newTransaction, recurrence: value as 'none' | 'monthly' | 'yearly'})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a recorrência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem recorrência</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detalhes">Detalhes (opcional)</Label>
                  <Input
                    id="detalhes"
                    placeholder="Detalhes adicionais"
                    value={newTransaction.detalhes || ''}
                    onChange={(e) => setNewTransaction({...newTransaction, detalhes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveTransaction}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Recebido</div>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(financialSummary.received)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Previsto</div>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(financialSummary.expected)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Pago</div>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(financialSummary.paid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Lucro</div>
            <div className={`text-2xl font-bold ${financialSummary.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(financialSummary.profit)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </Button>
          <div className="text-lg font-medium">
            {format(currentMonth, 'MMMM/yyyy', { locale: ptBR }).toUpperCase()}
          </div>
          <Button variant="outline" onClick={nextMonth}>
            <ChevronRight size={18} />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <ToggleGroup type="single" value={activeFilter || ''}>
            <ToggleGroupItem 
              value="receitas" 
              onClick={() => applyQuickFilter('receitas')}
              className={activeFilter === 'receitas' ? 'bg-green-100' : ''}
            >
              Recebimentos
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="despesas" 
              onClick={() => applyQuickFilter('despesas')}
              className={activeFilter === 'despesas' ? 'bg-red-100' : ''}
            >
              Despesas
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter size={18} className="mr-2" />
                Filtrar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filtros</h4>
                <div className="space-y-2">
                  <Label htmlFor="filter-tipo">Tipo</Label>
                  <Select
                    value={filters.tipo}
                    onValueChange={(value) => handleFilterChange('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Receita">Receitas</SelectItem>
                      <SelectItem value="Despesa">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Status</Label>
                  <Select
                    value={filters.paid}
                    onValueChange={(value) => handleFilterChange('paid', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="paid">Pagos/Recebidos</SelectItem>
                      <SelectItem value="pending">A pagar/A receber</SelectItem>
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
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.nome}>
                          {category.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-contato">Contato</Label>
                  <Select
                    value={filters.contact}
                    onValueChange={(value) => handleFilterChange('contact', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os contatos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os contatos</SelectItem>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.nome}>
                          {contact.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetFilters}>Limpar</Button>
                  <Button onClick={() => setFilterOpen(false)}>Aplicar</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader className="animate-spin mr-2" />
          <span>Carregando transações...</span>
        </div>
      ) : filteredTransactionsNoDuplicates.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-gray-500">Nenhuma transação encontrada para este período.</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Nova Transação" para começar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Data</th>
                <th className="text-left py-2">Descrição</th>
                <th className="text-left py-2">Contato</th>
                <th className="text-right py-2">Valor</th>
                <th className="text-center py-2">Status</th>
                <th className="text-right py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactionsNoDuplicates.map(transaction => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{format(new Date(transaction.data), 'dd/MM/yyyy')}</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <button 
                        onClick={() => toggleExpandTransaction(transaction.id)}
                        className="mr-2 focus:outline-none"
                      >
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform ${expandedTransaction === transaction.id ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      <span>{transaction.descricao}</span>
                    </div>
                    {expandedTransaction === transaction.id && (
                      <div className="mt-2 ml-6 text-sm text-gray-500">
                        <p><strong>Categoria:</strong> {transaction.categoria_nome}</p>
                        {transaction.detalhes && <p><strong>Detalhes:</strong> {transaction.detalhes}</p>}
                      </div>
                    )}
                  </td>
                  <td className="py-3">{transaction.contato_nome || '-'}</td>
                  <td className="py-3 text-right">
                    <span className={transaction.tipo === 'Despesa' ? 'text-red-500' : 'text-green-500'}>
                      {formatCurrency(transaction.valor)}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {transaction.paid ? (
                      <Badge variant="outline" className={transaction.tipo === 'Despesa' ? 'bg-red-100' : 'bg-green-100'}>
                        {transaction.tipo === 'Despesa' ? 'Pago' : 'Recebido'}
                      </Badge>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={transaction.tipo === 'Despesa' ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}
                        onClick={() => toggleTransactionPaid(transaction)}
                      >
                        {transaction.tipo === 'Despesa' ? 'Pagar' : 'Receber'}
                      </Button>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDuplicateTransaction(transaction)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          <line x1="10" x2="10" y1="11" y2="17"/>
                          <line x1="14" x2="14" y1="11" y2="17"/>
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Transacoes;
