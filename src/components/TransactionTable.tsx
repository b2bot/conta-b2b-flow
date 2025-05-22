import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  payment_type?: string;
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
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  isLoading,
  filteredTransactions,
  filters,
  expandedTransaction,
  toggleExpandTransaction,
  toggleTransactionPaid,
  handleEditTransaction,
  handleDeleteTransaction
}) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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

  // Generates the table headers based on the transaction type filter
  const renderTableHeaders = () => {
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
    if (filters.tipo === 'Despesa') {
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
    }
    
    // Default headers for all transaction types
    return (
      <>
        <div className="col-span-1">Data</div>
        <div className="col-span-3">Descrição</div>
        <div className="col-span-2">Contato</div>
        <div className="col-span-2">Categoria</div>
        <div className="col-span-2 text-right">Valor</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1"></div>
      </>
    );
  };

  // Renders the row data based on transaction type
  const renderTransactionRowData = (transaction: Transaction) => {
    // Row for Receita transactions
    if (filters.tipo === 'Receita') {
      return (
        <>
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
              className="border-green-500 text-green-700 px-2 py-1 text-xs border-1"
            >
              {transaction.payment_type || "Depósito"}
            </Badge>
          </div>
          <div
            className="col-span-2 font-medium text-right text-green-600"
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
        </>
      );
    }
    
    // Row for Despesa transactions
    if (filters.tipo === 'Despesa') {
      return (
        <>
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
              className="border-red-500 text-red-700 px-2 py-1 text-xs border-1"
            >
              {transaction.categoria_nome}
            </Badge>
          </div>
          <div
            className="col-span-2 font-medium text-right text-red-600"
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
        </>
      );
    }
    
    // Default row for all transaction types
    return (
      <>
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
      </>
    );
  };

  return (
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
              {renderTransactionRowData(transaction)}
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
  );
};

export default TransactionTable;
