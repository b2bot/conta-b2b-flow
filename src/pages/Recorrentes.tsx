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
  X,
  Download,
  Upload
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
import { format, addMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { recurringAPI, categoriesAPI, costCentersAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/fileUtils';

// Define recurring transaction type
interface RecurringTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  categoria_nome: string;
  centro_custo_id: string;
  centro_custo_nome: string;
  frequencia: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  dia_mes: number;
}

// Define new recurring transaction form
interface RecurringTransactionForm {
  descricao: string;
  valor: string;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  centro_custo_id: string;
  frequencia: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  dia_mes: number;
}

const LancamentosRecorrentes = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    tipo: 'all',
    categoria: 'all',
    frequencia: 'all',
  });
  
  const [newRecurring, setNewRecurring] = useState<RecurringTransactionForm>({
    descricao: '',
    valor: '',
    tipo: 'Despesa',
    categoria_id: '',
    centro_custo_id: '',
    frequencia: 'Mensal',
    dia_mes: 1,
  });
  
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch recurring transactions
  const { data: recurringData, isLoading, isError } = useQuery({
    queryKey: ['recurring'],
    queryFn: async () => {
      try {
        const response = await recurringAPI.list();
        return response.status === 'success' ? response.recorrentes : [];
      } catch (err) {
        console.error('Error fetching recurring transactions:', err);
        throw err;
      }
    }
  });

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoriesAPI.list();
        return response.status === 'success' ? response.categorias : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    initialData: []
  });

  // Fetch cost centers for dropdown
  const { data: costCentersData } = useQuery({
    queryKey: ['costCenters'],
    queryFn: async () => {
      try {
        const response = await costCentersAPI.list();
        return response.status === 'success' ? response.centros_custo : [];
      } catch (error) {
        console.error('Error fetching cost centers:', error);
        return [];
      }
    },
    initialData: []
  });

  // Create/update recurring transaction mutation
  const saveRecurringMutation = useMutation({
    mutationFn: (recurring: any) => recurringAPI.save(recurring),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurring'] });
        toast({
          title: editingRecurring ? "Lançamento recorrente atualizado com sucesso" : "Lançamento recorrente criado com sucesso",
        });
        setDialogOpen(false);
        resetRecurringForm();
      } else {
        toast({
          title: "Erro ao salvar lançamento recorrente",
          description: data.message || "Ocorreu um erro ao salvar o lançamento recorrente",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar lançamento recorrente",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const recurring = recurringData || [];
  const categories = categoriesData || [];
  const costCenters = costCentersData || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      tipo: 'all',
      categoria: 'all',
      frequencia: 'all',
    });
  };

  const resetRecurringForm = () => {
    setNewRecurring({
      descricao: '',
      valor: '',
      tipo: 'Despesa',
      categoria_id: '',
      centro_custo_id: '',
      frequencia: 'Mensal',
      dia_mes: 1,
    });
    setEditingRecurring(null);
  };

  const filteredRecurring = recurring.filter(item => {
    // Apply filters
    if (filters.tipo !== 'all' && item.tipo !== filters.tipo) return false;
    if (filters.categoria !== 'all' && item.categoria_id !== filters.categoria) return false;
    if (filters.frequencia !== 'all' && item.frequencia !== filters.frequencia) return false;
    return true;
  });
  
  const handleSaveRecurring = () => {
    if (!newRecurring.descricao || !newRecurring.valor || !newRecurring.categoria_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(newRecurring.valor.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate day of month
    if (newRecurring.dia_mes < 1 || newRecurring.dia_mes > 31) {
      toast({
        title: "Dia inválido",
        description: "O dia do mês deve estar entre 1 e 31.",
        variant: "destructive",
      });
      return;
    }
    
    const recurringToSave = {
      ...(editingRecurring ? { id: editingRecurring.id } : {}),
      descricao: newRecurring.descricao,
      valor: amount,
      tipo: newRecurring.tipo,
      categoria_id: newRecurring.categoria_id,
      centro_custo_id: newRecurring.centro_custo_id,
      frequencia: newRecurring.frequencia,
      dia_mes: newRecurring.dia_mes,
    };
    
    saveRecurringMutation.mutate(recurringToSave);
  };
  
  const handleEditRecurring = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setNewRecurring({
      descricao: recurring.descricao,
      valor: recurring.valor.toString(),
      tipo: recurring.tipo,
      categoria_id: recurring.categoria_id,
      centro_custo_id: recurring.centro_custo_id,
      frequencia: recurring.frequencia,
      dia_mes: recurring.dia_mes,
    });
    setDialogOpen(true);
  };

  const handleExportRecurring = () => {
    // Transform recurring transactions for export
    const dataToExport = filteredRecurring.map(item => ({
      Descrição: item.descricao,
      Valor: item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      Tipo: item.tipo,
      Categoria: item.categoria_nome,
      'Centro de Custo': item.centro_custo_nome,
      Frequência: item.frequencia,
      'Dia do Mês': item.dia_mes,
    }));
    
    exportToExcel(dataToExport, 'lancamentos_recorrentes');
    
    toast({
      title: "Exportação concluída",
      description: "Os lançamentos recorrentes foram exportados com sucesso.",
    });
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-3">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="p-8 text-center">
      <X className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar lançamentos recorrentes</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível carregar a lista de lançamentos recorrentes. Tente novamente mais tarde.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['recurring'] })}
          className="bg-purple hover:bg-purple/90"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportRecurring}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple hover:bg-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento Recorrente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingRecurring ? 'Editar Lançamento Recorrente' : 'Novo Lançamento Recorrente'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newRecurring.descricao}
                    onChange={(e) => setNewRecurring({ ...newRecurring, descricao: e.target.value })}
                    placeholder="Ex: Assinatura Serviço"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    value={newRecurring.valor}
                    onChange={(e) => setNewRecurring({ ...newRecurring, valor: e.target.value })}
                    placeholder="Ex: 1500,00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newRecurring.tipo}
                    onValueChange={(value) => setNewRecurring({ ...newRecurring, tipo: value as 'Despesa' | 'Receita' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                      <SelectItem value="Receita">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newRecurring.categoria_id}
                    onValueChange={(value) => setNewRecurring({ ...newRecurring, categoria_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="costCenter">Centro de Custo</Label>
                  <Select
                    value={newRecurring.centro_custo_id}
                    onValueChange={(value) => setNewRecurring({ ...newRecurring, centro_custo_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o centro de custo" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((costCenter) => (
                        <SelectItem key={costCenter.id} value={costCenter.id}>
                          {costCenter.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select
                    value={newRecurring.frequencia}
                    onValueChange={(value) => setNewRecurring({ ...newRecurring, frequencia: value as 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dayOfMonth">Dia do mês</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min={1}
                    max={31}
                    value={newRecurring.dia_mes}
                    onChange={(e) => setNewRecurring({ ...newRecurring, dia_mes: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetRecurringForm();
                }}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-purple hover:bg-purple/90" 
                  onClick={handleSaveRecurring}
                  disabled={saveRecurringMutation.isP
(Content truncated due to size limit. Use line ranges to read in chunks)