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
import { ReceitaForm as ReceitaFormType } from '@/hooks/useReceitas';

interface ReceitaFormProps {
  isEditing: boolean;
  newReceita: ReceitaFormType;
  setNewReceita: React.Dispatch<React.SetStateAction<ReceitaFormType>>;
  handleSaveReceita: () => void;
  onCancel: () => void;
  categories: any[];
  contacts: any[];
  planos: any[];
}

const ReceitaForm: React.FC<ReceitaFormProps> = ({
  isEditing,
  newReceita,
  setNewReceita,
  handleSaveReceita,
  onCancel,
  categories,
  contacts,
  planos
}) => {
  return (
    <>
      <div className="grid gap-4 py-4">
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
                  {format(newReceita.data, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newReceita.data}
                  onSelect={(date) => date && setNewReceita({...newReceita, data: date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código do Cliente</Label>
            <Input
              id="codigo"
              placeholder="CL001"
              value={newReceita.codigo}
              onChange={(e) => setNewReceita({...newReceita, codigo: e.target.value})}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contato">Contato</Label>
          <Select
            value={newReceita.contato_id}
            onValueChange={(value) => setNewReceita({...newReceita, contato_id: value})}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="servico">Serviço</Label>
            <Input
              id="servico"
              placeholder="Nome do serviço"
              value={newReceita.servico}
              onChange={(e) => setNewReceita({...newReceita, servico: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plano">Plano</Label>
            <Select
              value={newReceita.plano_id || ''}
              onValueChange={(value) => {
                const planoSelecionado = planos.find(p => p.id === value);
                setNewReceita({
                  ...newReceita, 
                  plano_id: value,
                  plano: planoSelecionado ? planoSelecionado.nome : ''
                });
              }}
            >
              <SelectTrigger id="plano">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {planos.map(plano => (
                  <SelectItem key={plano.id} value={plano.id}>
                    {plano.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria de Serviço</Label>
          <Select
            value={newReceita.categoria_id}
            onValueChange={(value) => setNewReceita({...newReceita, categoria_id: value})}
          >
            <SelectTrigger id="categoria">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              placeholder="0,00"
              value={newReceita.valor}
              onChange={(e) => setNewReceita({...newReceita, valor: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={newReceita.tipo}
              onValueChange={(value) => setNewReceita({...newReceita, tipo: value})}
            >
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Serviço">Serviço</SelectItem>
                <SelectItem value="Produto">Produto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo de Cobrança</Label>
            <Select
              value={newReceita.modeloCobranca}
              onValueChange={(value) => setNewReceita({...newReceita, modeloCobranca: value})}
            >
              <SelectTrigger id="modelo">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Assinatura">Assinatura</SelectItem>
                <SelectItem value="Fee Mensal">Fee Mensal</SelectItem>
                <SelectItem value="Único">Único</SelectItem>
                <SelectItem value="Por Projeto">Por Projeto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={newReceita.status}
              onValueChange={(value) => setNewReceita({...newReceita, status: value})}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A receber">A receber</SelectItem>
                <SelectItem value="Recebido">Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entregas">Entregas Principais</Label>
          <Input
            id="entregas"
            placeholder="Descrição das entregas principais"
            value={newReceita.entregasPrincipais}
            onChange={(e) => setNewReceita({...newReceita, entregasPrincipais: e.target.value})}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSaveReceita}>Salvar</Button>
      </DialogFooter>
    </>
  );
};

export default ReceitaForm;
