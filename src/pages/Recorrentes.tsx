
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Filter,
  ChevronDown,
  Calendar as CalendarIcon,
  Check,
  X,
  MoreHorizontal,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for recurring transactions
const INITIAL_RECURRING_TRANSACTIONS = [
  {
    id: '1',
    description: 'Aluguel Escritório',
    paymentTo: 'Imobiliária Prime',
    category: 'Aluguel',
    amount: 3500.00,
    type: 'expense',
    dayOfMonth: 10,
    frequency: 'monthly',
    active: true,
  },
  {
    id: '2',
    description: 'Assinatura Software',
    paymentTo: 'Adobe',
    category: 'Software',
    amount: 89.90,
    type: 'expense',
    dayOfMonth: 15,
    frequency: 'monthly',
    active: true,
  },
  {
    id: '3',
    description: 'Salário Funcionários',
    paymentTo: 'Equipe',
    category: 'Salários',
    amount: 12000.00,
    type: 'expense',
    dayOfMonth: 5,
    frequency: 'monthly',
    active: true,
  },
  {
    id: '4',
    description: 'Contrato Mensal Cliente X',
    paymentTo: 'Cliente X Ltda',
    category: 'Vendas',
    amount: 5000.00,
    type: 'income',
    dayOfMonth: 20,
    frequency: 'monthly',
    active: true,
  },
  {
    id: '5',
    description: 'Contrato Anual Cliente Y',
    paymentTo: 'Cliente Y Ltda',
    category: 'Vendas',
    amount: 24000.00,
    type: 'income',
    dayOfMonth: 15,
    frequency: 'yearly',
    active: true,
  }
];

// Mock data for categories
const CATEGORIES = [
  'Aluguel',
  'Software',
  'Salários',
  'Vendas',
  'Marketing',
  'Serviços',
  'Equipamentos',
  'Impostos',
  'Vale Refeição',
  'Consultoria'
];

// Mock data for contacts
const CONTACTS = [
  'Imobiliária Prime',
  'Adobe',
  'Equipe',
  'Cliente X Ltda',
  'Cliente Y Ltda',
  'Fornecedor Z',
  'Greatpages'
];

const Recorrentes = () => {
  const [recurringTransactions, setRecurringTransactions] = useState(INITIAL_RECURRING_TRANSACTIONS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    active: 'all',
    frequency: 'all',
    category: 'all',
  });
  
  const [newRecurring, setNewRecurring] = useState({
    description: '',
    amount: '',
    dayOfMonth: '1',
    type: 'expense',
    category: '',
    paymentTo: '',
    frequency: 'monthly',
    active: true
  });
  
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  
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
      type: 'all',
      active: 'all',
      frequency: 'all',
      category: 'all',
    });
  };

  const filteredTransactions = recurringTransactions.filter(transaction => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.active !== 'all') {
      if (filters.active === 'active' && !transaction.active) return false;
      if (filters.active === 'inactive' && transaction.active) return false;
    }
    if (filters.frequency !== 'all' && transaction.frequency !== filters.frequency) return false;
    if (filters.category !== 'all' && transaction.category !== filters.category) return false;
    
    return true;
  });
  
  const handleCreateRecurring = () => {
    if (!newRecurring.description || !newRecurring.amount || !newRecurring.category || !newRecurring.paymentTo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    const newId = (Math.max(...recurringTransactions.map(t => Number(t.id))) + 1).toString();
    
    const createdTransaction = {
      id: newId,
      description: newRecurring.description,
      paymentTo: newRecurring.paymentTo,
      category: newRecurring.category,
      amount: parseFloat(newRecurring.amount),
      type: newRecurring.type,
      dayOfMonth: parseInt(newRecurring.dayOfMonth),
      frequency: newRecurring.frequency,
      active: newRecurring.active
    };
    
    setRecurringTransactions(prev => [createdTransaction, ...prev]);
    
    toast({
      title: "Lançamento recorrente criado",
      description: "O lançamento recorrente foi criado com sucesso.",
    });
    
    setNewRecurring({
      description: '',
      amount: '',
      dayOfMonth: '1',
      type: 'expense',
      category: '',
      paymentTo: '',
      frequency: 'monthly',
      active: true
    });
    
    setDialogOpen(false);
  };
  
  const toggleTransactionActive = (id: string) => {
    setRecurringTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id 
          ? { ...transaction, active: !transaction.active } 
          : transaction
      )
    );
  };
  
  const deleteTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.filter(transaction => transaction.id !== id));
    toast({
      title: "Lançamento excluído",
      description: "O lançamento recorrente foi excluído com sucesso.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus size={18} className="mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">Novo Lançamento Recorrente</DialogTitle>
              <DialogDescription>
                Configure um lançamento automático mensal ou anual.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Tipo</Label>
                  <Select 
                    value={newRecurring.type}
                    onValueChange={(value) => setNewRecurring({...newRecurring, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input 
                    id="amount" 
                    placeholder="0,00"
                    value={newRecurring.amount}
                    onChange={(e) => setNewRecurring({...newRecurring, amount: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input 
                  id="description" 
                  placeholder="Descrição do lançamento"
                  value={newRecurring.description}
                  onChange={(e) => setNewRecurring({...newRecurring, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={newRecurring.category}
                    onValueChange={(value) => setNewRecurring({...newRecurring, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-to">Contato</Label>
                  <Select 
                    value={newRecurring.paymentTo}
                    onValueChange={(value) => setNewRecurring({...newRecurring, paymentTo: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACTS.map((contact) => (
                        <SelectItem key={contact} value={contact}>{contact}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="day-of-month">Dia do mês</Label>
                  <Select 
                    value={newRecurring.dayOfMonth}
                    onValueChange={(value) => setNewRecurring({...newRecurring, dayOfMonth: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select 
                    value={newRecurring.frequency}
                    onValueChange={(value) => setNewRecurring({...newRecurring, frequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="active" 
                  checked={newRecurring.active}
                  onCheckedChange={(checked) => 
                    setNewRecurring({...newRecurring, active: checked as boolean})
                  }
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-purple hover:bg-purple/90" onClick={handleCreateRecurring}>
                Criar Lançamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Filter size={16} />
          Filtrar
          <ChevronDown size={16} className={filterOpen ? "rotate-180 transform" : ""} />
        </Button>
        
        {filters.type !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.type === 'income' ? 'Receitas' : 'Despesas'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('type', 'all')} />
          </div>
        )}
        
        {filters.active !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.active === 'active' ? 'Ativos' : 'Inativos'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('active', 'all')} />
          </div>
        )}
        
        {filters.frequency !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.frequency === 'monthly' ? 'Mensal' : 'Anual'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('frequency', 'all')} />
          </div>
        )}
        
        {filters.category !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.category}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('category', 'all')} />
          </div>
        )}
        
        {(filters.type !== 'all' || filters.active !== 'all' || filters.frequency !== 'all' || filters.category !== 'all') && (
          <Button 
            variant="ghost" 
            className="text-sm text-muted-foreground"
            onClick={resetFilters}
          >
            Limpar filtros
          </Button>
        )}
      </div>
      
      {filterOpen && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-type">Tipo</Label>
                <Select 
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-active">Status</Label>
                <Select 
                  value={filters.active}
                  onValueChange={(value) => handleFilterChange('active', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-frequency">Frequência</Label>
                <Select 
                  value={filters.frequency}
                  onValueChange={(value) => handleFilterChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-category">Categoria</Label>
                <Select 
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring transactions table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-gray-50 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">Contato</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-1 text-center">Dia</div>
          <div className="col-span-1">Frequência</div>
          <div className="col-span-1 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum lançamento recorrente encontrado.
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-gray-50 transition-colors items-center text-sm"
            >
              <div className="col-span-3 font-medium">
                {transaction.description}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {transaction.paymentTo}
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                  {transaction.category}
                </span>
              </div>
              <div className="col-span-1 text-center flex items-center justify-center">
                <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  {transaction.dayOfMonth}
                </div>
              </div>
              <div className="col-span-1">
                {transaction.frequency === 'monthly' ? 'Mensal' : 'Anual'}
              </div>
              <div 
                className={`col-span-1 font-medium text-right ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.amount)}
              </div>
              <div className="col-span-1 flex justify-center">
                <button 
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    transaction.active 
                      ? 'bg-purple border-purple text-white' 
                      : 'border-gray-300'
                  }`}
                  onClick={() => toggleTransactionActive(transaction.id)}
                >
                  {transaction.active && <Check size={12} />}
                </button>
              </div>
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => toggleTransactionActive(transaction.id)}
                      className="cursor-pointer"
                    >
                      {transaction.active ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteTransaction(transaction.id)}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Recorrentes;
