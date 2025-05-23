
import React from 'react';
import { Button } from '@/components/ui/button';
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
import { Filter } from 'lucide-react';

interface TransactionFiltersProps {
  filters: {
    tipo: string;
    paid: string;
    categoria: string;
    contact: string;
  };
  handleFilterChange: (key: string, value: string) => void;
  resetFilters: () => void;
  onClosePopover: () => void;
  categories: any[];
  contacts: any[];
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  handleFilterChange,
  resetFilters,
  onClosePopover,
  categories,
  contacts
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Filtros</h4>
      <div className="space-y-2">
        <Label htmlFor="filter-tipo">Tipo</Label>
        <Select
          value={filters.tipo}
          onValueChange={(value) => handleFilterChange('tipo', value)}
        >
          <SelectTrigger id="filter-tipo">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Receita">Receitas</SelectItem>
            <SelectItem value="Despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-status">Status</Label>
        <Select
          value={filters.paid}
          onValueChange={(value) => handleFilterChange('paid', value)}
        >
          <SelectTrigger id="filter-status">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="paid">Pagos/Recebidos</SelectItem>
            <SelectItem value="pending">A pagar/A receber</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-categoria">Categoria</Label>
        <Select
          value={filters.categoria}
          onValueChange={(value) => handleFilterChange('categoria', value)}
        >
          <SelectTrigger id="filter-categoria">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-contato">Contato</Label>
        <Select
          value={filters.contact}
          onValueChange={(value) => handleFilterChange('contact', value)}
        >
          <SelectTrigger id="filter-contato">
            <SelectValue placeholder="Todos os contatos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os contatos</SelectItem>
            {contacts.map(contact => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={resetFilters}>Limpar</Button>
        <Button onClick={onClosePopover}>Aplicar</Button>
      </div>
    </div>
  );
};

export const FilterButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Button variant="outline" onClick={onClick}>
      <Filter size={18} className="mr-2" />
      Filtrar
    </Button>
  );
};

export default TransactionFilters;
