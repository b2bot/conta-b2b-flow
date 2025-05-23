
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { transactionsAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { calculateTransactionSummary } from '@/utils/fileUtils';
import { Transaction } from '@/components/transactions/TransactionList';

export const useTransactions = () => {
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
  
  const [financialSummary, setFinancialSummary] = useState({
    received: 0,
    expected: 0,
    paid: 0,
    profit: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactionsData = [], isLoading, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionsAPI.list();
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
      return await transactionsAPI.save(transaction);
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        toast({
          title: "Transação salva com sucesso",
        });
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

  // Toggle paid status mutation
  const togglePaidStatusMutation = useMutation({
    mutationFn: (transaction: Transaction) => {
      // Create a new object with the updated paid status
      const updatedTransaction = {
        ...transaction,
        paid: !transaction.paid,
        status: !transaction.paid ? 
          (transaction.tipo === 'Despesa' ? 'Pago' : 'Recebido') : 
          (transaction.tipo === 'Despesa' ? 'A pagar' : 'A receber')
      };
      
      return transactionsAPI.save(updatedTransaction);
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        // Force data refetch to get updated transaction list
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        // Show success toast
        toast({
          title: "Status atualizado com sucesso",
        });
        
        // Force refetch of transactions to ensure we have the latest data
        refetch();
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

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulate delete API call until it's implemented
      return { status: 'success', id };
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        // Remove deleted transaction from cache
        queryClient.setQueryData<Transaction[]>(
          ['transactions'], 
          (oldData: Transaction[] | undefined) => 
            oldData ? oldData.filter(item => item.id !== data.id) : []
        );
        
        toast({
          title: "Transação excluída com sucesso",
        });
        
        refetch();
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

  // Normalize transactions to ensure consistent data structure
  const transactions = useMemo(() => {
    return (transactionsData || []).map(transaction => {
      return {
        ...transaction,
        paid: transaction.paid === true || transaction.status === 'Pago' || transaction.status === 'Recebido',
      };
    });
  }, [transactionsData]);

  // Filter transactions by month and other filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
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
      if (filters.categoria !== 'all' && transaction.categoria_id !== filters.categoria) return false;
      if (filters.contact !== 'all' && transaction.contato_id !== filters.contact) return false;

      return true;
    });
  }, [transactions, currentMonth, filters]);

  // Calculate financial summary based on filtered transactions
  useEffect(() => {
    const summary = calculateTransactionSummary(filteredTransactions);
    setFinancialSummary(summary);
  }, [filteredTransactions]);

  const nextMonth = () => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1));
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

  const toggleTransactionPaid = (transaction: Transaction) => {
    togglePaidStatusMutation.mutate(transaction);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const toggleExpandTransaction = (id: string) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  return {
    currentMonth,
    setCurrentMonth,
    filterOpen,
    setFilterOpen,
    filters,
    expandedTransaction,
    activeFilter,
    importDialogOpen,
    setImportDialogOpen,
    financialSummary,
    isLoading,
    transactions,
    filteredTransactions,
    categories,
    contacts,
    saveTransactionMutation,
    togglePaidStatusMutation,
    deleteTransactionMutation,
    nextMonth,
    prevMonth,
    handleFilterChange,
    resetFilters,
    applyQuickFilter,
    toggleTransactionPaid,
    handleDeleteTransaction,
    toggleExpandTransaction,
    refetch
  };
};
