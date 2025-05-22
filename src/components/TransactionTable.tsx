
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';

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

// Define props for the component
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
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  isLoading,
  filteredTransactions,
  filters,
  expandedTransaction,
  toggleExpandTransaction,
  toggleTransactionPaid,
  handleEditTransaction,
  handleDeleteTransaction,
}) => {
  // Format currency value
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Render table header based on transaction type
  const renderTableHeader = () => {
    // If we're filtering for Receipts specifically
    if (filters.tipo === 'Receita') {
      return (
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
          <div className="col-span-1">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">Recebido de</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
        </div>
      );
    }
    
    // If we're filtering for Expenses specifically
    else if (filters.tipo === 'Despesa') {
      return (
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
          <div className="col-span-1">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">Pago a</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
        </div>
      );
    }
    
    // Default for mixed view
    else {
      return (
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
          <div className="col-span-1">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">Contato</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
        </div>
      );
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-1">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );

  // Get badge color based on transaction type
  const getTransactionBadge = (transaction: Transaction) => {
    if (transaction.tipo === 'Receita') {
      return transaction.paid ? (
        <Badge className="bg-green-500">Recebido</Badge>
      ) : (
        <Badge variant="outline" className="text-green-600 border-green-600">
          A receber
        </Badge>
      );
    } else {
      return transaction.paid ? (
        <Badge className="bg-red-500">Pago</Badge>
      ) : (
        <Badge variant="outline" className="text-red-600 border-red-600">
          A pagar
        </Badge>
      );
    }
  };

  // Get action text based on transaction type
  const getActionText = (transaction: Transaction) => {
    return transaction.tipo === 'Receita'
      ? transaction.paid
        ? 'Marcar como não recebido'
        : 'Marcar como recebido'
      : transaction.paid
        ? 'Marcar como não pago'
        : 'Marcar como pago';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="border rounded-md">
          {renderTableHeader()}

          {isLoading ? (
            renderLoadingSkeleton()
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhuma transação encontrada para este período.
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <div
                  className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-1 text-sm">
                    {formatDate(transaction.data)}
                  </div>
                  <div className="col-span-3 font-medium">
                    {transaction.descricao}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {transaction.paymentTo}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {transaction.categoria_nome}
                  </div>
                  <div
                    className={`col-span-2 font-medium text-right ${
                      transaction.tipo === 'Receita'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(transaction.valor)}
                  </div>
                  <div className="col-span-1 text-center">
                    <div className="flex justify-center">
                      {getTransactionBadge(transaction)}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleExpandTransaction(transaction.id)}
                    >
                      {expandedTransaction === transaction.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="sr-only">Expandir detalhes</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleTransactionPaid(transaction)}
                        >
                          {getActionText(transaction)}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteTransaction(transaction.id)
                          }
                          className="text-red-600"
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {expandedTransaction === transaction.id && (
                  <div className="p-4 bg-muted/30 border-b border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Detalhes:
                      </p>
                      <p>{transaction.detalhes || 'Sem detalhes adicionais'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Recorrência:
                      </p>
                      <p>
                        {transaction.recurrence === 'monthly'
                          ? 'Mensal'
                          : transaction.recurrence === 'yearly'
                            ? 'Anual'
                            : 'Não recorrente'}
                      </p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionTable;
