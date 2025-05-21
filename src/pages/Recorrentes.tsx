
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  ChevronDown,
  MoreVertical,
  Loader,
  Calendar 
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
import { format, addMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { recurrencesAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

// Define types
interface Recurrence {
  id: string;
  descricao: string;
  contato_id: string;
  contato_nome: string;
  categoria_id: string;
  categoria_nome: string;
  tipo: 'Despesa' | 'Receita';
  valor: number;
  frequencia: 'monthly' | 'yearly' | 'weekly';
  dia: number;
  proxima_data: string;
  ativo: boolean;
}

interface RecurrenceForm {
  id?: string;
  descricao: string;
  contato_id: string;
  categoria_id: string;
  tipo: 'Despesa' | 'Receita';
  valor: string;
  frequencia: 'monthly' | 'yearly' | 'weekly';
  dia: string;
  proxima_data: Date;
  ativo: boolean;
}

const Recorrentes = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    tipo: 'all',
    ativo: 'all',
    categoria: 'all',
    frequencia: 'all',
  });

  const [newRecurrence, setNewRecurrence] = useState<RecurrenceForm>({
    descricao: '',
    contato_id: '',
    categoria_id: '',
    tipo: 'Despesa',
    valor: '',
    frequencia: 'monthly',
    dia: '',
    proxima_data: new Date(),
    ativo: true,
  });

  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNextDateDialogOpen, setEditNextDateDialogOpen] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence | null>(null);
  const [nextDate, setNextDate] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch recurrences
  const { data: recurrencesData = [], isLoading } = useQuery({
    queryKey: ['recurrences'],
    queryFn: async () => {
      const response = await recurrencesAPI.list();
      return response.status === 'success' ? response.recorrencias : [];
    }
  });

  // Fetch categories for dropdown
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.list();
      return response.status === 'success' ? response.categorias : [];
    }
  });

  // Fetch contacts for dropdown
  const { data: contactsData = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await contactsAPI.list();
      return response.status === 'success' ? response.contatos : [];
    }
  });

  const recurrences = recurrencesData || [];
  const categories = categoriesData || [];
  const contacts = contactsData || [];

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
      tipo: 'all',
      ativo: 'all',
      categoria: 'all',
      frequencia: 'all',
    });
  };

  const resetRecurrenceForm = () => {
    setNewRecurrence({
      descricao: '',
      contato_id: '',
      categoria_id: '',
      tipo: 'Despesa',
      valor: '',
      frequencia: 'monthly',
      dia: '',
      proxima_data: new Date(),
      ativo: true,
    });
    setIsEditing(false);
  };

  const filteredRecurrences = recurrences.filter(recurrence => {
    // Apply filters
    if (filters.tipo !== 'all' && recurrence.tipo !== filters.tipo) return false;
    if (filters.ativo !== 'all') {
      if (filters.ativo === 'active' && !recurrence.ativo) return false;
      if (filters.ativo === 'inactive' && recurrence.ativo) return false;
    }
    if (filters.categoria !== 'all' && recurrence.categoria_nome !== filters.categoria) return false;
    if (filters.frequencia !== 'all' && recurrence.frequencia !== filters.frequencia) return false;
    
    return true;
  });

  // Save recurrence mutation
  const saveRecurrenceMutation = useMutation({
    mutationFn: (recurrence: any) => recurrencesAPI.save(recurrence),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        toast({
          title: isEditing ? "Recorrência atualizada com sucesso" : "Recorrência criada com sucesso",
        });
        setDialogOpen(false);
        resetRecurrenceForm();
      } else {
        toast({
          title: "Erro ao salvar recorrência",
          description: data.message || "Ocorreu um erro ao salvar a recorrência",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar recorrência",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Update next date mutation
  const updateNextDateMutation = useMutation({
    mutationFn: (data: {id: string, proxima_data: string}) => {
      return recurrencesAPI.save({
        id: data.id,
        proxima_data: data.proxima_data
      });
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        toast({
          title: "Data atualizada com sucesso",
        });
        setEditNextDateDialogOpen(false);
      } else {
        toast({
          title: "Erro ao atualizar data",
          description: data.message || "Ocorreu um erro ao atualizar a data",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar data",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (recurrence: Recurrence) => {
      return recurrencesAPI.save({
        id: recurrence.id,
        ativo: !recurrence.ativo
      });
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        toast({
          title: "Status atualizado com sucesso",
        });
      } else {
        toast({
          title: "Erro ao atualizar status",
          description: data.message || "Ocorreu um erro ao atualizar o status",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete recurrence mutation
  const deleteRecurrenceMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder - actual implementation would call the delete API
      // return await recurrencesAPI.delete(id);
      // For now we'll simulate a successful delete
      return { status: 'success' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrences'] });
      toast({
        title: "Recorrência excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir recorrência",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const handleSaveRecurrence = () => {
    if (!newRecurrence.descricao || !newRecurrence.valor || !newRecurrence.categoria_id || !newRecurrence.contato_id || !newRecurrence.dia) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(newRecurrence.valor.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido.",
        variant: "destructive",
      });
      return;
    }

    const nextDateString = format(newRecurrence.proxima_data, 'yyyy-MM-dd');

    const recurrenceToSave = {
      ...(isEditing && newRecurrence.id ? { id: newRecurrence.id } : {}),
      descricao: newRecurrence.descricao,
      contato_id: newRecurrence.contato_id,
      categoria_id: newRecurrence.categoria_id,
      tipo: newRecurrence.tipo,
      valor: amount,
      frequencia: newRecurrence.frequencia,
      dia: parseInt(newRecurrence.dia, 10),
      proxima_data: nextDateString,
      ativo: newRecurrence.ativo,
    };

    saveRecurrenceMutation.mutate(recurrenceToSave);
  };

  const handleToggleActive = (recurrence: Recurrence) => {
    toggleActiveMutation.mutate(recurrence);
  };

  const handleDeleteRecurrence = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta recorrência?')) {
      deleteRecurrenceMutation.mutate(id);
    }
  };

  const handleEditRecurrence = (recurrence: Recurrence) => {
    setIsEditing(true);
    
    let nextDate;
    try {
      nextDate = new Date(recurrence.proxima_data);
    } catch (e) {
      nextDate = new Date();
    }
    
    setNewRecurrence({
      id: recurrence.id,
      descricao: recurrence.descricao,
      contato_id: recurrence.contato_id,
      categoria_id: recurrence.categoria_id,
      tipo: recurrence.tipo,
      valor: recurrence.valor.toString(),
      frequencia: recurrence.frequencia,
      dia: recurrence.dia.toString(),
      proxima_data: nextDate,
      ativo: recurrence.ativo,
    });
    
    setDialogOpen(true);
  };

  const openEditNextDateDialog = (recurrence: Recurrence) => {
    setSelectedRecurrence(recurrence);
    try {
      setNextDate(new Date(recurrence.proxima_data));
    } catch (e) {
      setNextDate(new Date());
    }
    setEditNextDateDialogOpen(true);
  };

  const handleUpdateNextDate = () => {
    if (!selectedRecurrence) return;
    
    const nextDateString = format(nextDate, 'yyyy-MM-dd');
    
    updateNextDateMutation.mutate({
      id: selectedRecurrence.id,
      proxima_data: nextDateString
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      case 'weekly': return 'Semanal';
      default: return frequency;
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="grid grid-cols-10 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-3">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-1">
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
              <DialogTitle className="text-purple-dark">
                {isEditing ? 'Editar Lançamento Recorrente' : 'Novo Lançamento Recorrente'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrence-type">Tipo</Label>
                  <Select
                    value={newRecurrence.tipo}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, tipo: value as 'Despesa' | 'Receita' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                      <SelectItem value="Receita">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    placeholder="0,00"
                    value={newRecurrence.valor}
                    onChange={(e) => setNewRecurrence({ ...newRecurrence, valor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição do lançamento recorrente"
                  value={newRecurrence.descricao}
                  onChange={(e) => setNewRecurrence({ ...newRecurrence, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newRecurrence.categoria_id}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, categoria_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Select
                    value={newRecurrence.contato_id}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, contato_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>{contact.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select
                    value={newRecurrence.frequencia}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, frequencia: value as 'monthly' | 'yearly' | 'weekly' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day">Dia</Label>
                  <Input
                    id="day"
                    placeholder={newRecurrence.frequencia === 'weekly' ? '1-7' : '1-31'}
                    value={newRecurrence.dia}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) { // Only allow numbers
                        setNewRecurrence({ ...newRecurrence, dia: value });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Próxima Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <div>{format(newRecurrence.proxima_data, 'dd/MM/yyyy')}</div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newRecurrence.proxima_data}
                      onSelect={(date) => date && setNewRecurrence({ ...newRecurrence, proxima_data: date })}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newRecurrence.ativo}
                  onCheckedChange={(checked) =>
                    setNewRecurrence({ ...newRecurrence, ativo: checked })
                  }
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                resetRecurrenceForm();
              }}>Cancelar</Button>
              <Button className="bg-purple hover:bg-purple/90" onClick={handleSaveRecurrence}>
                {saveRecurrenceMutation.isPending ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processando
                  </>
                ) : isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editNextDateDialogOpen} onOpenChange={setEditNextDateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-purple-dark">Editar Próxima Data</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Selecione a Nova Data</Label>
              <div className="border rounded-md p-4">
                <Calendar
                  mode="single"
                  selected={nextDate}
                  onSelect={(date) => date && setNextDate(date)}
                  className="mx-auto"
                  locale={ptBR}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNextDateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-purple hover:bg-purple/90" onClick={handleUpdateNextDate}>
              {updateNextDateMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processando
                </>
              ) : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        {(filters.tipo !== 'all' || filters.ativo !== 'all' || filters.categoria !== 'all' || filters.frequencia !== 'all') && (
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
                <Label htmlFor="filter-tipo">Tipo</Label>
                <Select
                  value={filters.tipo}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Receita">Receitas</SelectItem>
                    <SelectItem value="Despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-ativo">Status</Label>
                <Select
                  value={filters.ativo}
                  onValueChange={(value) => handleFilterChange('ativo', value)}
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
                <Label htmlFor="filter-categoria">Categoria</Label>
                <Select
                  value={filters.categoria}
                  onValueChange={(value) => handleFilterChange('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.nome}>{category.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-frequencia">Frequência</Label>
                <Select
                  value={filters.frequencia}
                  onValueChange={(value) => handleFilterChange('frequencia', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-10 gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
              <div className="col-span-2">Descrição</div>
              <div className="col-span-1">Contato</div>
              <div className="col-span-1">Categoria</div>
              <div className="col-span-1">Dia</div>
              <div className="col-span-1">Frequência</div>
              <div className="col-span-1">Valor</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Próxima Data</div>
              <div className="col-span-1"></div>
            </div>
            
            {isLoading ? (
              renderLoadingSkeleton()
            ) : filteredRecurrences.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Nenhum lançamento recorrente encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Crie um novo lançamento recorrente para começar.
                </p>
              </div>
            ) : (
              filteredRecurrences.map((recurrence) => (
                <div 
                  key={recurrence.id} 
                  className="grid grid-cols-10 gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center text-sm"
                >
                  <div className="col-span-2 font-medium">
                    {recurrence.descricao}
                  </div>
                  <div className="col-span-1">
                    {recurrence.contato_nome}
                  </div>
                  <div className="col-span-1">
                    <Badge 
                      variant="outline" 
                      className={`px-2 py-1 text-xs border-1 ${
                        recurrence.tipo === 'Receita' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
                      }`}
                    >
                      {recurrence.categoria_nome}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    {recurrence.dia}
                  </div>
                  <div className="col-span-1">
                    <Badge className="bg-blue-500">
                      {getFrequencyLabel(recurrence.frequencia)}
                    </Badge>
                  </div>
                  <div className="col-span-1 font-medium">
                    {formatCurrency(recurrence.valor)}
                  </div>
                  <div className="col-span-1">
                    <Switch 
                      checked={recurrence.ativo}
                      onCheckedChange={() => handleToggleActive(recurrence)}
                    />
                  </div>
                  <div className="col-span-1">
                    {recurrence.proxima_data ? format(new Date(recurrence.proxima_data), 'dd/MM/yyyy') : '-'}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRecurrence(recurrence)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditNextDateDialog(recurrence)}>
                          Editar próxima data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(recurrence)}>
                          {recurrence.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRecurrence(recurrence.id)}
                          className="text-red-600"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Recorrentes;
