import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions } from '@/hooks/useTransactions';
import { exportToExcel, formatCurrency } from '@/utils/fileUtils';
import { Transaction } from '@/components/transactions/TransactionList';

// Import refactored components
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionFilters, { FilterButton } from '@/components/transactions/TransactionFilters';
import FinancialSummary from '@/components/transactions/FinancialSummary';
import TransactionList from '@/components/transactions/TransactionList';
import MonthSelector from '@/components/transactions/MonthSelector';
import ImportExportButtons from '@/components/transactions/ImportExportButtons';

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
  const {
    currentMonth,
    filterOpen,
    setFilterOpen,
    filters,
    expandedTransaction,
    activeFilter,
    importDialogOpen,
    setImportDialogOpen,
    financialSummary,
    isLoading,
    filteredTransactions,
    categories,
    contacts,
    nextMonth,
    prevMonth,
    handleFilterChange,
    resetFilters,
    applyQuickFilter,
    toggleTransactionPaid,
    handleDeleteTransaction,
    toggleExpandTransaction,
    refetch
  } = useTransactions();

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
      contato_id: newTransaction.paymentTo, 
      valor: amount,
      tipo: newTransaction.tipo,
      paid: newTransaction.paid,
      recurrence: newTransaction.recurrence,
      detalhes: newTransaction.detalhes || ""
    };

    // Use the saveTransactionMutation from useTransactions
    // This is a placeholder for the actual mutation call
    fetch('/api/save-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionToSave)
    }).then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          toast({ title: "Transação salva com sucesso" });
          setDialogOpen(false);
          resetTransactionForm();
          refetch();
        } else {
          toast({ 
            title: "Erro ao salvar transação",
            description: data.message || "Ocorreu um erro ao salvar a transação",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        toast({
          title: "Erro ao salvar transação",
          description: error.message,
          variant: "destructive",
        });
      });
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
    const dataToExport = filteredTransactions.map(t => ({
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
    
    toast({
      title: "Importação concluída",
      description: `${data.length} transações importadas com sucesso.`,
    });
    
    // Refresh transactions list
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Transações</h1>
        <div className="flex space-x-2">
          <ImportExportButtons
            onExport={handleExportTransactions}
            onImportSuccess={handleImportSuccess}
            importDialogOpen={importDialogOpen}
            setImportDialogOpen={setImportDialogOpen}
          />
          
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
              <TransactionForm
                isEditing={isEditing}
                newTransaction={newTransaction}
                setNewTransaction={setNewTransaction}
                handleSaveTransaction={handleSaveTransaction}
                onCancel={() => setDialogOpen(false)}
                categories={categories}
                contacts={contacts}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <FinancialSummary financialSummary={financialSummary} />
      
      <div className="flex items-center justify-between">
        <MonthSelector
          currentMonth={currentMonth}
          nextMonth={nextMonth}
          prevMonth={prevMonth}
        />
        
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
              <FilterButton onClick={() => setFilterOpen(!filterOpen)} />
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <TransactionFilters
                filters={filters}
                handleFilterChange={handleFilterChange}
                resetFilters={resetFilters}
                onClosePopover={() => setFilterOpen(false)}
                categories={categories}
                contacts={contacts}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <TransactionList
        transactions={filteredTransactions}
        expandedTransaction={expandedTransaction}
        toggleExpandTransaction={toggleExpandTransaction}
        toggleTransactionPaid={toggleTransactionPaid}
        handleEditTransaction={handleEditTransaction}
        handleDuplicateTransaction={handleDuplicateTransaction}
        handleAttachFile={handleAttachFile}
        handleDeleteTransaction={handleDeleteTransaction}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Transacoes;
