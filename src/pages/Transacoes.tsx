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
import { transactionsAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import FileImport from '@/components/FileImport';
import { exportToExcel } from '@/utils/fileUtils';

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
  centro_custo_id: string;
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
    centro_custo_id: '',
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
        return response.status === 'success' ? response.transacoes : [];
      } catch (err) {
        console.error('Error fetching transactions:', err);
        throw err;
      }
    }
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
        const response = await categoriesAPI.list();
        return response.status === 'success' ? response.categorias : [];
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
        const response = await contactsAPI.list();
        return response.status === 'success' ? response.contatos : [];
      } catch (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
    },
    initialData: []
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
      centro_custo_id: newTransaction.centro_custo_id,
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

  const handleImportTransactions = (data: any[]) => {
    // Map imported data to transaction format
    const transactions = data.map(item => {
      // Handle different column naming conventions
      const descricao = item.descricao || item.description || '';
      const categoria_id = item.categoria_id || item.category_id || '';
      const centro_custo_id = item.centro_custo_id || item.cost_center_id || '';
      const tipo = getTransactionTypeFromString(item.tipo || item.type || 'Despesa');
      
      // Handle amount format (both comma and dot decimal separators)
      let valor = 0;
      if (typeof item.valor === 'string') {
        valor = parseFloat(item.valor.replace(',', '.'));
      } else if (typeof item.amount === 'string') {
        valor = parseFloat(item.amount.replace(',', '.'));
      } else if (typeof item.valor === 'number') {
        valor = item.valor;
      } else if (typeof item.amount === 'number') {
        valor = item.amount;
      }
      
      // Handle date in multiple formats
      let data = new Date();
      try {
        if (item.data) {
          // Try to parse date in different formats
          if (typeof item.data === 'string') {
            // Try DD/MM/YYYY format
            if (item.data.includes('/')) {
              data = parse(item.data, 'dd/MM/yyyy', new Date());
            } else {
              // Try YYYY-MM-DD format
              data = new Date(item.data);
            }
          } else if (item.data instanceof Date) {
            data = item.data;
          }
        } else if (item.date) {
          // Similar logic for 'date' field
          if (typeof item.date === 'string') {
            if (item.date.includes('/')) {
              data = parse(item.date, 'dd/MM/yyyy', new Date());
            } else {
              data = new Date(item.date);
            }
          } else if (item.date instanceof Date) {
            data = item.date;
          }
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        data = new Date();
      }
      
      // Get paid status
      const paid = item.pago === true || 
                  item.pago === 'true' || 
                  item.pago === 'sim' || 
                  item.paid === true || 
                  item.paid === 'true' || 
                  item.paid === 'yes';
      
      return {
        descricao,
        categoria_id,
        centro_custo_id,
        tipo,
        valor: isNaN(valor) ? 0 : valor,
        data: format(data, 'yyyy-MM-dd'),
        paid,
        recurrence: 'none'
      };
    });

    // Validate transactions
    const validTransactions = transactions.filter(transaction => {
      return (
        transaction.descricao.trim() !== '' &&
        transaction.valor > 0
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

  const getTransactionTypeFromString = (typeString: string): 'Despesa' | 'Receita' => {
    const typeStringLower = typeString.toLowerCase();
    
    if (
      typeStringLower.includes('receita') || 
      typeStringLower.includes('entrada') ||
      typeStringLower.includes('income') || 
      typeStringLower.includes('revenue')
    ) {
      return 'Receita';
    }
    
    return 'Despesa';
  };

  const handleExportTransactions = () => {
    // Transform transactions for export
    const dataToExport = filteredTransactions.map(transaction => ({
      Data: format(new Date(transaction.data), 'dd/MM/yyyy'),
      Descrição: transaction.descricao,
      Categoria: transaction.categoria_nome,
      Valor: transaction.valor,
      Tipo: transaction.tipo,
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
     
(Content truncated due to size limit. Use line ranges to read in chunks)