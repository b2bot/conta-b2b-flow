
import React from 'react';
import { 
  Check, 
  Loader, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical,
  FileUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { UseMutationResult } from '@tanstack/react-query';

interface Transaction {
  id: string;
  data: string;
  descricao: string;
  paymentTo?: string;  // Made optional to fix type error
  contato_nome?: string; // Added contato_nome field
  categoria_nome: string;
  valor: number;
  tipo: 'Despesa' | 'Receita';
  paid: boolean;
  recurrence: 'none' | 'monthly' | 'yearly';
  detalhes?: string;
  status?: string;
  categoria_id: string;
  contato_id?: string;
}

interface TransactionTableProps {
  isLoading: boolean;
  filteredTransactions: Transaction[];
  filters: {
    tipo: string;
    paid: string;
    categoria: string;
    contact: string;
  };
  expandedTransaction: string | null;
  toggleExpandTransaction: (id: string) => void;
  toggleTransactionPaid: (transaction: Transaction) => void;
  handleEditTransaction: (transaction: Transaction) => void;
  handleDeleteTransaction: (id: string) => void;
  saveTransactionMutation?: UseMutationResult<any, Error, any>;
  deleteTransactionMutation?: UseMutationResult<any, Error, any>;
  handleDuplicateTransaction?: (transaction: Transaction) => void;
  handleAttachFile?: (transactionId: string) => void;
}

const TransactionTable = ({
  isLoading,
  filteredTransactions,
  filters,
  expandedTransaction,
  toggleExpandTransaction,
  toggleTransactionPaid,
  handleEditTransaction,
  handleDeleteTransaction,
  saveTransactionMutation,
  deleteTransactionMutation,
  handleDuplicateTransaction,
  handleAttachFile,
}: TransactionTableProps) => {
  // Format currency for display
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Data inválida';
    }
  };
  
  // Get status badge based on transaction type and payment status
  const getStatusBadge = (transaction: Transaction) => {
    const { tipo, paid } = transaction;
    
    if (tipo === 'Receita') {
      return paid ? 
        <Badge className="bg-green-500">Recebido</Badge> :
        <Badge className="bg-amber-500">A receber</Badge>;
    } else {
      return paid ? 
        <Badge className="bg-blue-500">Pago</Badge> :
        <Badge className="bg-red-500">A pagar</Badge>;
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-7 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-1">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="col-span-1">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="border rounded-md bg-white">
      <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 font-medium">
        <div className="col-span-1">Data</div>
        <div className="col-span-1">Descrição</div>
        <div className="col-span-1">Contato</div>
        <div className="col-span-1">Valor</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1 text-right">Ações</div>
      </div>
      
      {isLoading ? (
        renderLoadingSkeleton()
      ) : filteredTransactions.length === 0 ? (
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">Nenhuma transação encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há transações com os filtros aplicados.
          </p>
        </div>
      ) : (
        filteredTransactions.map((transaction) => (
          <React.Fragment key={transaction.id}>
            <div 
              className="grid grid-cols-6 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
            >
              <div className="col-span-1 text-sm">
                {formatDate(transaction.data)}
              </div>
              <div className="col-span-1 font-medium">
                <button 
                  onClick={() => toggleExpandTransaction(transaction.id)}
                  className="flex items-center gap-1 hover:text-purple"
                >
                  {transaction.descricao}
                  {expandedTransaction === transaction.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="col-span-1 text-sm text-muted-foreground">
                {transaction.contato_nome || "-"}
              </div>
              <div className="col-span-1">
                <span className={transaction.tipo === 'Receita' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {formatCurrency(transaction.valor)}
                </span>
              </div>
              <div className="col-span-1">
                {transaction.paid ? (
                  getStatusBadge(transaction)
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
              </div>
              <div className="col-span-1 flex justify-end gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                      Editar
                    </DropdownMenuItem>
                    {handleDuplicateTransaction && (
                      <DropdownMenuItem onClick={() => handleDuplicateTransaction(transaction)}>
                        Duplicar
                      </DropdownMenuItem>
                    )}
                    {handleAttachFile && (
                      <DropdownMenuItem onClick={() => handleAttachFile(transaction.id)}>
                        Anexar
                      </DropdownMenuItem>
                    )}
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
            
            {expandedTransaction === transaction.id && (
              <div className="p-4 bg-muted/20 border-b border-border">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="mb-3">
                      <span className="text-sm font-medium">Categoria:</span>
                      <span className="ml-2 text-sm">{transaction.categoria_nome}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium">Contato:</span>
                      <span className="ml-2 text-sm">{transaction.contato_nome || "-"}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Recorrência:</span>
                      <span className="ml-2 text-sm">
                        {transaction.recurrence === 'none' ? 'Não recorrente' : 
                         transaction.recurrence === 'monthly' ? 'Mensal' : 'Anual'}
                      </span>
                    </div>
                  </div>
                  <div>
                    {transaction.detalhes && (
                      <div className="mb-3">
                        <span className="text-sm font-medium">Detalhes:</span>
                        <p className="mt-1 text-sm text-muted-foreground">{transaction.detalhes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))
      )}
    </div>
  );
};

export default TransactionTable;
