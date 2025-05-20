import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'https://sistema.vksistemas.com.br/api';

const recurringAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-recorrentes.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  },
  save: async (recorrente: any) => {
    const res = await fetch(`${API_BASE_URL}/salvar-recorrente.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recorrente),
    });
    return await res.json();
  }
  // Adicione métodos de delete/update se existirem em seu backend!
};
import { 
  Plus, 
  Loader2, 
  MoreHorizontal, 
  Calendar,
  Pencil,
  X,
  ArrowDown,
  ArrowUp,
  Check
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'weekly' | 'yearly';
  day?: number;
  dayOfWeek?: number;
  month?: number;
  nextDate?: string;
  category?: string;
}

const Recorrentes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [recurringToDelete, setRecurringToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<RecurringTransaction>>({
    description: '',
    amount: 0,
    type: 'expense',
    frequency: 'monthly',
    day: 1
  });

  // Fetch recurring transactions
  const { data: recurrings, isLoading, isError } = useQuery({
    queryKey: ['recurrings'],
    queryFn: async () => {
      try {
        const response = await recurringAPI.list();
        return response.success ? response.recurrings : [];
      } catch (error) {
        console.error('Error fetching recurring transactions:', error);
        toast({
          title: "Erro ao carregar lançamentos recorrentes",
          description: "Não foi possível carregar a lista de lançamentos recorrentes",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Create recurring transaction mutation
  const createRecurringMutation = useMutation({
    mutationFn: (recurring: Partial<RecurringTransaction>) => recurringAPI.save(recurring),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrings'] });
      toast({
        title: "Lançamento recorrente criado com sucesso",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar lançamento recorrente",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Update recurring transaction mutation
  const updateRecurringMutation = useMutation({
    mutationFn: (recurring: RecurringTransaction) => recurringAPI.save(recurring),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrings'] });
      toast({
        title: "Lançamento recorrente atualizado com sucesso",
      });
      setRecurringToEdit(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar lançamento recorrente",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete recurring transaction mutation
  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => recurringAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrings'] });
      toast({
        title: "Lançamento recorrente excluído com sucesso",
      });
      setIsAlertDialogOpen(false);
      setRecurringToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir lançamento recorrente",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      frequency: 'monthly',
      day: 1
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = () => {
    if (!formData.description) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, informe uma descrição",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor maior que zero",
        variant: "destructive",
      });
      return;
    }
    
    if (recurringToEdit) {
      updateRecurringMutation.mutate({
        ...recurringToEdit,
        ...formData
      } as RecurringTransaction);
    } else {
      createRecurringMutation.mutate(formData);
    }
  };
  
  const openEditDialog = (recurring: RecurringTransaction) => {
    setRecurringToEdit(recurring);
    setFormData({
      description: recurring.description,
      amount: recurring.amount,
      type: recurring.type,
      frequency: recurring.frequency,
      day: recurring.day,
      dayOfWeek: recurring.dayOfWeek,
      month: recurring.month,
      category: recurring.category
    });
    setIsDialogOpen(true);
  };
  
  const confirmDelete = (id: string) => {
    setRecurringToDelete(id);
    setIsAlertDialogOpen(true);
  };
  
  const deleteRecurring = () => {
    if (!recurringToDelete) return;
    deleteRecurringMutation.mutate(recurringToDelete);
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensal';
      case 'weekly': return 'Semanal';
      case 'yearly': return 'Anual';
      default: return frequency;
    }
  };

  const getNextDateText = (recurring: RecurringTransaction) => {
    if (recurring.nextDate) {
      const date = new Date(recurring.nextDate);
      return date.toLocaleDateString('pt-BR');
    }
    
    let text = '';
    
    switch (recurring.frequency) {
      case 'monthly':
        text = `Todo dia ${recurring.day} do mês`;
        break;
      case 'weekly':
        const daysOfWeek = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        text = `Toda ${daysOfWeek[recurring.dayOfWeek || 0]}`;
        break;
      case 'yearly':
        const months = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        text = `Todo dia ${recurring.day} de ${months[recurring.month || 0]}`;
        break;
      default:
        text = 'Data indefinida';
    }
    
    return text;
  };

  const filteredRecurrings = (recurrings || []).filter(recurring => {
    if (filter === 'all') return true;
    return recurring.type === filter;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
          <span className="ml-2">Carregando lançamentos recorrentes...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="text-center">Erro ao carregar lançamentos recorrentes. Por favor, tente novamente.</p>
          <div className="flex justify-center mt-4">
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['recurrings'] })}
              className="bg-purple hover:bg-purple/90"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setRecurringToEdit(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus size={18} className="mr-2" />
              Novo Lançamento Recorrente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">
                {recurringToEdit ? 'Editar' : 'Novo'} Lançamento Recorrente
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input 
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Aluguel, Internet, etc."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input 
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select 
                  value={formData.frequency}
                  onValueChange={(value) => handleSelectChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="day">Dia do mês</Label>
                  <Input 
                    id="day"
                    name="day"
                    type="number"
                    value={formData.day || ''}
                    onChange={handleInputChange}
                    min="1"
                    max="31"
                    placeholder="1"
                  />
                </div>
              )}
              
              {formData.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Dia da semana</Label>
                  <Select 
                    value={String(formData.dayOfWeek || 0)}
                    onValueChange={(value) => handleSelectChange('dayOfWeek', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Domingo</SelectItem>
                      <SelectItem value="1">Segunda-feira</SelectItem>
                      <SelectItem value="2">Terça-feira</SelectItem>
                      <SelectItem value="3">Quarta-feira</SelectItem>
                      <SelectItem value="4">Quinta-feira</SelectItem>
                      <SelectItem value="5">Sexta-feira</SelectItem>
                      <SelectItem value="6">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {formData.frequency === 'yearly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Dia</Label>
                    <Input 
                      id="day"
                      name="day"
                      type="number"
                      value={formData.day || ''}
                      onChange={handleInputChange}
                      min="1"
                      max="31"
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month">Mês</Label>
                    <Select 
                      value={String(formData.month || 0)}
                      onValueChange={(value) => handleSelectChange('month', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Janeiro</SelectItem>
                        <SelectItem value="1">Fevereiro</SelectItem>
                        <SelectItem value="2">Março</SelectItem>
                        <SelectItem value="3">Abril</SelectItem>
                        <SelectItem value="4">Maio</SelectItem>
                        <SelectItem value="5">Junho</SelectItem>
                        <SelectItem value="6">Julho</SelectItem>
                        <SelectItem value="7">Agosto</SelectItem>
                        <SelectItem value="8">Setembro</SelectItem>
                        <SelectItem value="9">Outubro</SelectItem>
                        <SelectItem value="10">Novembro</SelectItem>
                        <SelectItem value="11">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input 
                  id="category"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Moradia, Alimentação, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-purple hover:bg-purple/90" 
                onClick={handleSubmit}
                disabled={createRecurringMutation.isPending || updateRecurringMutation.isPending}
              >
                {createRecurringMutation.isPending || updateRecurringMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {recurringToEdit ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  recurringToEdit ? 'Salvar Alterações' : 'Criar Lançamento'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={filter === 'all' ? "default" : "outline"}
          className={filter === 'all' ? "bg-purple hover:bg-purple/90" : ""}
          onClick={() => setFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={filter === 'expense' ? "default" : "outline"}
          className={filter === 'expense' ? "bg-purple hover:bg-purple/90" : ""}
          onClick={() => setFilter('expense')}
        >
          Despesas
        </Button>
        <Button
          variant={filter === 'income' ? "default" : "outline"}
          className={filter === 'income' ? "bg-purple hover:bg-purple/90" : ""}
          onClick={() => setFilter('income')}
        >
          Receitas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRecurrings.map((recurring) => (
          <Card key={recurring.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {recurring.type === 'income' ? (
                    <ArrowUp className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <ArrowDown className="h-5 w-5 mr-2 text-red-500" />
                  )}
                  <CardTitle className="text-lg">{recurring.description}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => openEditDialog(recurring)}
                      className="cursor-pointer"
                    >
                      <Pencil size={14} className="mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => confirmDelete(recurring.id)}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <X size={14} className="mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                Categoria: {recurring.category || 'Não definida'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground text-sm">Valor</span>
                <span className={`font-medium ${recurring.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(recurring.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Frequência</span>
                <span className="text-sm font-medium">
                  {getFrequencyLabel(recurring.frequency)}
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar size={14} className="mr-2" />
                {getNextDateText(recurring)}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredRecurrings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum lançamento recorrente encontrado. Crie um novo lançamento para começar.
        </div>
      )}
      
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento recorrente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={deleteRecurring}
              disabled={deleteRecurringMutation.isPending}
            >
              {deleteRecurringMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recorrentes;
