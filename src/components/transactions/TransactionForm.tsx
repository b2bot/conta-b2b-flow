import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { DialogFooter } from "@/components/ui/dialog";

// Define new transaction form
export interface TransactionForm {
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

interface TransactionFormProps {
  isEditing: boolean;
  newTransaction: TransactionForm;
  setNewTransaction: React.Dispatch<React.SetStateAction<TransactionForm>>;
  handleSaveTransaction: () => void;
  onCancel: () => void;
  categories: any[];
  contacts: any[];
  costCenters: any[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isEditing,
  newTransaction,
  setNewTransaction,
  handleSaveTransaction,
  onCancel,
  categories,
  contacts,
  costCenters
}) => {
  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={newTransaction.tipo}
              onValueChange={(value) => setNewTransaction({...newTransaction, tipo: value as 'Despesa' | 'Receita'})}
            >
              <SelectTrigger id="tipo">
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
                  id="data"
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
              <SelectTrigger id="categoria">
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
            <SelectTrigger id="contato">
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
          <Label htmlFor="centro-custo">Centro de Custo</Label>
          <Select
            value={newTransaction.centro_custo_id || ''}
            onValueChange={(value) => setNewTransaction({...newTransaction, centro_custo_id: value})}
          >
            <SelectTrigger id="centro-custo">
              <SelectValue placeholder="Selecione o centro de custo" />
            </SelectTrigger>
            <SelectContent>
              {costCenters
                .filter(cc => cc.tipo === newTransaction.tipo || !cc.tipo)
                .map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.nome}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={newTransaction.paid ? "paid" : "pending"}
            onValueChange={(value) => setNewTransaction({...newTransaction, paid: value === "paid"})}
          >
            <SelectTrigger id="status">
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
            <SelectTrigger id="recurrence">
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
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSaveTransaction}>Salvar</Button>
      </DialogFooter>
    </>
  );
};

export default TransactionForm;
