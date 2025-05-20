
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
  X,
  Download,
  Upload
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
import { transactionsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import FileImport from '@/components/FileImport';
import { exportToExcel } from '@/utils/fileUtils';

// Define transaction type
interface Transaction {
  id: string;
  date: string;
  description: string;
  paymentTo: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  paid: boolean;
  recurrence: 'none' | 'monthly' | 'yearly';
}

// Define new transaction form
interface TransactionForm {
  description: string;
  amount: string;
  date: Date;
  type: 'expense' | 'income';
  category: string;
  paymentTo: string;
  paid: boolean;
  recurrence: 'none' | 'monthly' | 'yearly';
}

const Transacoes = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    paid: 'all',
    category: 'all',
    contact: 'all',
  });
  
  const [newTransaction, setNewTransaction] = useState<TransactionForm>({
    description: '',
    amount: '',
    date: new Date(),
    type: 'expense',
    category: '',
    paymentTo: '',
    paid: false,
    recurrence: 'none'
  });
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactionsData, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      try {
        console.log('Fetching transactions...');
        const response = await transactionsAPI.list();
        console.log('Response:', response);
        return response.success ? response.transactions : [];
      } catch (err) {
        console.error('Error fetching transactions:', err);
        throw err;
      }
    }
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (transaction: any) => transactionsAPI.save(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Transação criada com sucesso",
      });
      setDialogOpen(false);
      resetTransactionForm();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Bulk import transactions mutation
  const bulkImportMutation = useMutation({
    mutationFn: (transactions: any[]) => {
      // Create a promise for each transaction
      const promises = transactions.map(transaction => transactionsAPI.save(transaction));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setImportDialogOpen(false);
      toast({
        title: "Transações importadas com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao importar transações",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/listar-categorias.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          credentials: 'include'
        });
        const data = await response.json();
        return data.success ? data.categories : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    initialData: []
  });

  // Fetch contacts for dropdown
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/listar-contatos.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          credentials: 'include'
        });
        const data = await response.json();
        return data.success ? data.contacts : [];
      } catch (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
    },
    initialData: []
  });

  const API_BASE_URL = 'https://vksistemas.com.br/api';
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
      type: 'all',
      paid: 'all',
      category: 'all',
      contact: 'all',
    });
  };

  const resetTransactionForm = () => {
    setNewTransaction({
      description: '',
      amount: '',
      date: new Date(),
      type: 'expense',
      category: '',
      paymentTo: '',
      paid: false,
      recurrence: 'none'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Filter by month/year
    const transactionDate = new Date(transaction.date);
    if (
      transactionDate.getMonth() !== currentMonth.getMonth() ||
      transactionDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      return false;
    }
    
    // Apply other filters
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.paid !== 'all') {
      if (filters.paid === 'paid' && !transaction.paid) return false;
      if (filters.paid === 'pending' && transaction.paid) return false;
    }
    if (filters.category !== 'all' && transaction.category !== filters.category) return false;
    if (filters.contact !== 'all' && transaction.paymentTo !== filters.contact) return false;
    
    return true;
  });
  
  const handleCreateTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category || !newTransaction.paymentTo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(newTransaction.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido.",
        variant: "destructive",
      });
      return;
    }
    
    const dateString = format(newTransaction.date, 'yyyy-MM-dd');
    
    const createdTransaction = {
      date: dateString,
      description: newTransaction.description,
      paymentTo: newTransaction.paymentTo,
      category: newTransaction.category,
      amount: amount,
      type: newTransaction.type,
      paid: newTransaction.paid,
      recurrence: newTransaction.recurrence
    };
    
    createTransactionMutation.mutate(createdTransaction);
  };
  
  const toggleTransactionPaid = (transaction: Transaction) => {
    togglePaidStatusMutation.mutate(transaction);
  };

  const handleImportTransactions = (data: any[]) => {
    // Map imported data to transaction format
    const transactions = data.map(item => {
      // Handle different column naming conventions
      const description = item.descricao || item.description || '';
      const paymentTo = item.contato || item.pagamento || item.paymentTo || item.contact || '';
      const category = item.categoria || item.category || '';
      const type = getTransactionTypeFromString(item.tipo || item.type || 'expense');
      
      // Handle amount format (both comma and dot decimal separators)
      let amount = 0;
      if (typeof item.valor === 'string') {
        amount = parseFloat(item.valor.replace(',', '.'));
      } else if (typeof item.amount === 'string') {
        amount = parseFloat(item.amount.replace(',', '.'));
      } else if (typeof item.valor === 'number') {
        amount = item.valor;
      } else if (typeof item.amount === 'number') {
        amount = item.amount;
      }
      
      // Handle date in multiple formats
      let date = new Date();
      try {
        if (item.data) {
          // Try to parse date in different formats
          if (typeof item.data === 'string') {
            // Try DD/MM/YYYY format
            if (item.data.includes('/')) {
              date = parse(item.data, 'dd/MM/yyyy', new Date());
            } else {
              // Try YYYY-MM-DD format
              date = new Date(item.data);
            }
          } else if (item.data instanceof Date) {
            date = item.data;
          }
        } else if (item.date) {
          // Similar logic for 'date' field
          if (typeof item.date === 'string') {
            if (item.date.includes('/')) {
              date = parse(item.date, 'dd/MM/yyyy', new Date());
            } else {
              date = new Date(item.date);
            }
          } else if (item.date instanceof Date) {
            date = item.date;
          }
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        date = new Date();
      }
      
      // Get paid status
      const paid = item.pago === true || 
                  item.pago === 'true' || 
                  item.pago === 'sim' || 
                  item.paid === true || 
                  item.paid === 'true' || 
                  item.paid === 'yes';
      
      return {
        description,
        paymentTo,
        category,
        type,
        amount: isNaN(amount) ? 0 : amount,
        date: format(date, 'yyyy-MM-dd'),
        paid,
        recurrence: 'none'
      };
    });

    // Validate transactions
    const validTransactions = transactions.filter(transaction => {
      return (
        transaction.description.trim() !== '' &&
        transaction.amount > 0
      );
    });
    
    if (validTransactions.length === 0) {
      toast({
        title: "Erro na importação",
        description: "Nenhuma transação válida encontrada no arquivo.",
        variant: "destructive",
      });
      return;
    }

    // Import transactions
    bulkImportMutation.mutate(validTransactions);
  };

  const getTransactionTypeFromString = (typeString: string): 'expense' | 'income' => {
    const typeStringLower = typeString.toLowerCase();
    
    if (
      typeStringLower.includes('receita') || 
      typeStringLower.includes('entrada') ||
      typeStringLower.includes('income') || 
      typeStringLower.includes('revenue')
    ) {
      return 'income';
    }
    
    return 'expense';
  };

  const handleExportTransactions = () => {
    // Transform transactions for export
    const dataToExport = filteredTransactions.map(transaction => ({
      Data: format(new Date(transaction.date), 'dd/MM/yyyy'),
      Descrição: transaction.description,
      Contato: transaction.paymentTo,
      Categoria: transaction.category,
      Valor: transaction.amount,
      Tipo: transaction.type === 'income' ? 'Receita' : 'Despesa',
      Status: transaction.paid ? 'Pago/Recebido' : 'Pendente'
    }));
    
    exportToExcel(dataToExport, 'transacoes');
    
    toast({
      title: "Exportação concluída",
      description: "As transações foram exportadas com sucesso.",
    });
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-1">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="p-8 text-center">
      <X className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar transações</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível carregar a lista de transações. Tente novamente mais tarde.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
          className="bg-purple hover:bg-purple/90"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Transações</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar/Exportar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar planilha
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={handleExportTransactions}
                  disabled={filteredTransactions.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar transações
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
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
                      value={newTransaction.type}
                      onValueChange={(value: 'expense' | 'income') => setNewTransaction({...newTransaction, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="income">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor</Label>
                    <Input 
                      id="amount" 
                      placeholder="0,00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    id="description" 
                    placeholder="Descrição da transação"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={newTransaction.category}
                      onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-to">Contato</Label>
                    <Select 
                      value={newTransaction.paymentTo}
                      onValueChange={(value) => setNewTransaction({...newTransaction, paymentTo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact: any) => (
                          <SelectItem key={contact.id} value={contact.name}>{contact.name}</SelectItem>
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
                          <div>{format(newTransaction.date, 'dd/MM/yyyy')}</div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newTransaction.date}
                          onSelect={(date) => date && setNewTransaction({...newTransaction, date})}
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
                      onValueChange={(value: 'none' | 'monthly' | 'yearly') => setNewTransaction({...newTransaction, recurrence: value})}
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
                      setNewTransaction({...newTransaction, paid: checked === true})
                    }
                  />
                  <Label htmlFor="paid">
                    {newTransaction.type === 'expense' ? 'Pago' : 'Recebido'}
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button 
                  className="bg-purple hover:bg-purple/90" 
                  onClick={handleCreateTransaction}
                  disabled={createTransactionMutation.isPending}
                >
                  {createTransactionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : 'Criar Transação'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
        
        {filters.type !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.type === 'income' ? 'Receitas' : 'Despesas'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('type', 'all')} />
          </div>
        )}
        
        {filters.paid !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.paid === 'paid' ? 'Pagas' : 'Pendentes'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('paid', 'all')} />
          </div>
        )}
        
        {filters.category !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.category}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('category', 'all')} />
          </div>
        )}
        
        {filters.contact !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.contact}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('contact', 'all')} />
          </div>
        )}
        
        {(filters.type !== 'all' || filters.paid !== 'all' || filters.category !== 'all' || filters.contact !== 'all') && (
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
                <Label htmlFor="filter-type">Tipo</Label>
                <Select 
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
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
                <Label htmlFor="filter-category">Categoria</Label>
                <Select 
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
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
                    {contacts.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.name}>{contact.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-purple-dark">Importar Transações</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FileImport 
              onImportSuccess={handleImportTransactions}
              isLoading={bulkImportMutation.isPending}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
              <p className="font-medium mb-1">Formato esperado:</p>
              <p>A planilha deve conter colunas com os seguintes cabeçalhos:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                <li>descricao ou description (obrigatório)</li>
                <li>valor ou amount (obrigatório)</li>
                <li>data ou date (formato DD/MM/AAAA ou AAAA-MM-DD)</li>
                <li>categoria ou category</li>
                <li>contato ou pagamento ou paymentTo</li>
                <li>tipo ou type (receita/despesa)</li>
                <li>pago ou paid (sim/não)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions table */}
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
          renderLoadingSkeleton()
        ) : isError ? (
          renderErrorState()
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
                {format(new Date(transaction.date), 'dd/MM/yyyy')}
              </div>
              <div className="col-span-3 font-medium">
                {transaction.description}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {transaction.paymentTo}
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                  {transaction.category}
                </span>
              </div>
              <div 
                className={`col-span-2 font-medium text-right ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.amount)}
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
