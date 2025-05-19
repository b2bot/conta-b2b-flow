
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

// Mock data for transactions
const INITIAL_TRANSACTIONS = [
  {
    id: '1',
    date: '2023-05-31',
    description: 'VR-Eduarda',
    paymentTo: 'Eduarda Oliveira-Funcionaria',
    category: 'Vale Refeição',
    amount: 398.40,
    type: 'expense',
    paid: true,
    recurrence: 'monthly'
  },
  {
    id: '2',
    date: '2023-05-29',
    description: 'Procfy - Sistema de Gestão Financeira',
    paymentTo: 'Procfy',
    category: 'Software',
    amount: 39.90,
    type: 'expense',
    paid: false,
    recurrence: 'monthly'
  },
  {
    id: '3',
    date: '2023-05-28',
    description: 'Advogado -Dr.Danilo',
    paymentTo: 'Martins & Alves Advocacia',
    category: 'Advogado',
    amount: 1000.00,
    type: 'expense',
    paid: true,
    recurrence: 'monthly'
  },
  {
    id: '4',
    date: '2023-05-28',
    description: 'Ferramenta Greatpages',
    paymentTo: 'Greatpages',
    category: 'Software',
    amount: 139.90,
    type: 'expense',
    paid: true,
    recurrence: 'monthly'
  },
  {
    id: '5',
    date: '2023-05-10',
    description: 'Pagamento Cliente ABC',
    paymentTo: 'Cliente ABC Ltda',
    category: 'Vendas',
    amount: 2500.00,
    type: 'income',
    paid: true,
    recurrence: 'none'
  },
  {
    id: '6',
    date: '2023-05-15',
    description: 'Consultoria XYZ',
    paymentTo: 'Empresa XYZ',
    category: 'Consultoria',
    amount: 3500.00,
    type: 'income',
    paid: false,
    recurrence: 'none'
  }
];

// Mock data for categories
const CATEGORIES = [
  'Vale Refeição',
  'Software',
  'Advogado',
  'Vendas',
  'Consultoria',
  'Marketing',
  'Aluguel',
  'Serviços',
  'Equipamentos',
  'Impostos'
];

// Mock data for contacts
const CONTACTS = [
  'Eduarda Oliveira-Funcionaria',
  'Procfy',
  'Martins & Alves Advocacia',
  'Greatpages',
  'Cliente ABC Ltda',
  'Empresa XYZ'
];

const Transacoes = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    paid: 'all',
    category: 'all',
    contact: 'all',
  });
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: new Date(),
    type: 'expense',
    category: '',
    paymentTo: '',
    paid: false,
    recurrence: 'none'
  });
  
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const nextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, -1));
  };
  
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
      paid: 'all',
      category: 'all',
      contact: 'all',
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Filter by month/year
    const transactionDate = new Date(transaction.date);
    if (
      transactionDate.getMonth() !== currentMonth.getMonth() ||
      transactionDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      return false;
    }
    
    // Apply other filters
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.paid !== 'all') {
      if (filters.paid === 'paid' && !transaction.paid) return false;
      if (filters.paid === 'pending' && transaction.paid) return false;
    }
    if (filters.category !== 'all' && transaction.category !== filters.category) return false;
    if (filters.contact !== 'all' && transaction.paymentTo !== filters.contact) return false;
    
    return true;
  });
  
  const handleCreateTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category || !newTransaction.paymentTo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    const newId = (Math.max(...transactions.map(t => Number(t.id))) + 1).toString();
    const dateString = format(newTransaction.date, 'yyyy-MM-dd');
    
    const createdTransaction = {
      id: newId,
      date: dateString,
      description: newTransaction.description,
      paymentTo: newTransaction.paymentTo,
      category: newTransaction.category,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      paid: newTransaction.paid,
      recurrence: newTransaction.recurrence
    };
    
    setTransactions(prev => [createdTransaction, ...prev]);
    
    toast({
      title: "Transação criada",
      description: "A transação foi criada com sucesso.",
    });
    
    setNewTransaction({
      description: '',
      amount: '',
      date: new Date(),
      type: 'expense',
      category: '',
      paymentTo: '',
      paid: false,
      recurrence: 'none'
    });
    
    setDialogOpen(false);
  };
  
  const toggleTransactionPaid = (id: string) => {
    setTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id 
          ? { ...transaction, paid: !transaction.paid } 
          : transaction
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Transações</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus size={18} className="mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">Nova Transação</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Tipo</Label>
                  <Select 
                    value={newTransaction.type}
                    onValueChange={(value) => setNewTransaction({...newTransaction, type: value})}
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
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input 
                  id="description" 
                  placeholder="Descrição da transação"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={newTransaction.category}
                    onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}
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
                    value={newTransaction.paymentTo}
                    onValueChange={(value) => setNewTransaction({...newTransaction, paymentTo: value})}
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
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <div>{format(newTransaction.date, 'dd/MM/yyyy')}</div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newTransaction.date}
                        onSelect={(date) => date && setNewTransaction({...newTransaction, date})}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recurrence">Recorrência</Label>
                  <Select 
                    value={newTransaction.recurrence}
                    onValueChange={(value) => setNewTransaction({...newTransaction, recurrence: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não recorrente</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="paid" 
                  checked={newTransaction.paid}
                  onCheckedChange={(checked) => 
                    setNewTransaction({...newTransaction, paid: checked as boolean})
                  }
                />
                <Label htmlFor="paid">
                  {newTransaction.type === 'expense' ? 'Pago' : 'Recebido'}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-purple hover:bg-purple/90" onClick={handleCreateTransaction}>
                Criar Transação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-border">
        <Button variant="ghost" onClick={prevMonth} className="text-purple">
          <ChevronLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-purple-dark">
          {format(currentMonth, 'MMMM/yyyy', { locale: ptBR }).toUpperCase()}
        </h2>
        <Button variant="ghost" onClick={nextMonth} className="text-purple">
          <ChevronRight size={20} />
        </Button>
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
        
        {filters.paid !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.paid === 'paid' ? 'Pagas' : 'Pendentes'}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('paid', 'all')} />
          </div>
        )}
        
        {filters.category !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.category}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('category', 'all')} />
          </div>
        )}
        
        {filters.contact !== 'all' && (
          <div className="filter-chip filter-chip-active flex items-center gap-1">
            <span>{filters.contact}</span>
            <X size={14} className="cursor-pointer" onClick={() => handleFilterChange('contact', 'all')} />
          </div>
        )}
        
        {(filters.type !== 'all' || filters.paid !== 'all' || filters.category !== 'all' || filters.contact !== 'all') && (
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
                <Label htmlFor="filter-paid">Status</Label>
                <Select 
                  value={filters.paid}
                  onValueChange={(value) => handleFilterChange('paid', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos/Recebidos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
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
              
              <div className="space-y-2">
                <Label htmlFor="filter-contact">Contato</Label>
                <Select 
                  value={filters.contact}
                  onValueChange={(value) => handleFilterChange('contact', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {CONTACTS.map((contact) => (
                      <SelectItem key={contact} value={contact}>{contact}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-gray-50 text-sm font-medium text-muted-foreground">
          <div className="col-span-1">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2">Pago a</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-right">Valor</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1"></div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma transação encontrada para este período.
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-gray-50 transition-colors items-center text-sm"
            >
              <div className="col-span-1">
                {format(new Date(transaction.date), 'dd/MM/yyyy')}
              </div>
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
              <div 
                className={`col-span-2 font-medium text-right ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.amount)}
              </div>
              <div className="col-span-1 flex justify-center">
                <button 
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    transaction.paid 
                      ? 'bg-purple border-purple text-white' 
                      : 'border-gray-300'
                  }`}
                  onClick={() => toggleTransactionPaid(transaction.id)}
                >
                  {transaction.paid && <Check size={12} />}
                </button>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transacoes;
