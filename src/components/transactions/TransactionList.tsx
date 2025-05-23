
import React from 'react';
import { format } from 'date-fns';
import { ChevronDown, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/utils/fileUtils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface Transaction {
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

interface TransactionListProps {
  transactions: Transaction[];
  expandedTransaction: string | null;
  toggleExpandTransaction: (id: string) => void;
  toggleTransactionPaid: (transaction: Transaction) => void;
  handleEditTransaction: (transaction: Transaction) => void;
  handleDuplicateTransaction: (transaction: Transaction) => void;
  handleAttachFile: (id: string) => void;
  handleDeleteTransaction: (id: string) => void;
  isLoading: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  expandedTransaction,
  toggleExpandTransaction,
  toggleTransactionPaid,
  handleEditTransaction,
  handleDuplicateTransaction,
  handleAttachFile,
  handleDeleteTransaction,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin mr-2">⟳</div>
        <span>Carregando transações...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-gray-50">
        <p className="text-gray-500">Nenhuma transação encontrada para este período.</p>
        <p className="text-gray-400 text-sm mt-1">Clique em "Nova Transação" para começar.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map(transaction => (
          <TableRow key={transaction.id}>
            <TableCell>{format(new Date(transaction.data), 'dd/MM/yyyy')}</TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell>{transaction.contato_nome || '-'}</TableCell>
            <TableCell className="text-right">
              <span className={transaction.tipo === 'Despesa' ? 'text-red-500' : 'text-green-500'}>
                {formatCurrency(transaction.valor)}
              </span>
            </TableCell>
            <TableCell className="text-center">
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
            </TableCell>
            <TableCell className="flex justify-end space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicateTransaction(transaction)}>
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAttachFile(transaction.id)}>
                    Anexar
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TransactionList;
