
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
  ArrowUpCircle,
  ArrowDownCircle,
  MoreVertical,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { recurrenciesAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, generateInputId } from '@/utils/formUtils';

// Define recurrence type
interface RecurrentTransaction {
  id: string;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria_id: string;
  categoria_nome: string;
  descricao: string;
  tipo: 'Despesa' | 'Receita';
  frequencia: 'mensal' | 'quinzenal' | 'semanal' | 'anual';
  contato_id?: string;
  contato_nome?: string;
  proxima_data?: string;
  ultima_data?: string;
  ativa: boolean;
}

// Define new recurrence form
interface RecurrenceForm {
  id?: string;
  nome: string;
  valor: string;
  dia_vencimento: string;
  categoria_id: string;
  contato_id: string;
  descricao: string;
  tipo: 'Despesa' | 'Receita';
  frequencia: 'mensal' | 'quinzenal' | 'semanal' | 'anual';
  ativa: boolean;
}

const Recorrentes = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    tipo: 'all',
    status: 'all',
    categoria: 'all',
    contact: 'all',
  });

  const [newRecurrence, setNewRecurrence] = useState<RecurrenceForm>({
    nome: '',
    valor: '',
    dia_vencimento: '',
    categoria_id: '',
    contato_id: '',
    descricao: '',
    tipo: 'Despesa',
    frequencia: 'mensal',
    ativa: true
  });
  
  const [editingRecurrence, setEditingRecurrence] = useState<RecurrentTransaction | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Generate unique IDs for form accessibility
  const nameId = generateInputId("recurrence-name");
  const valueId = generateInputId("recurrence-value");
  const dueDayId = generateInputId("recurrence-due-day");
  const typeId = generateInputId("recurrence-type");
  const categoryId = generateInputId("recurrence-category");
  const contactId = generateInputId("recurrence-contact");
  const frequencyId = generateInputId("recurrence-frequency");
  const descriptionId = generateInputId("recurrence-description");

  // Fetch recurrences
  const { data: recurrencesData, isLoading, isError } = useQuery({
    queryKey: ['recurrences'],
    queryFn: async () => {
      try {
        console.log('Fetching recurrences...');
        const response = await recurrenciesAPI.list();
        console.log('Recurrences response:', response);
        if (response.status === 'success' && Array.isArray(response.recorrencias)) {
          return response.recorrencias;
        } else {
          console.error('Invalid recurrences data format:', response);
          return [];
        }
      } catch (err) {
        console.error('Error fetching recurrences:', err);
        throw err;
      }
    }
  });

  // Fetch categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoriesAPI.list();
        return response.status === 'success' ? response.categorias : [];
      } catch (err) {
        console.error('Error fetching categories:', err);
        return [];
      }
    }
  });

  // Fetch contacts
  const { data: contactsData = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        const response = await contactsAPI.list();
        return response.status === 'success' ? response.contatos : [];
      } catch (err) {
        console.error('Error fetching contacts:', err);
        return [];
      }
    }
  });

  // Create/update recurrence mutation
  const saveRecurrenceMutation = useMutation({
    mutationFn: async (recurrence: any) => {
      console.log('Saving recurrence:', recurrence);
      return await recurrenciesAPI.save(recurrence);
    },
    onSuccess: (data) => {
      console.log('Save recurrence response:', data);
      if (data.status === 'success') {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        
        toast({
          title: editingRecurrence ? "Recorrência atualizada com sucesso" : "Recorrência criada com sucesso",
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
    onError: (error: Error) => {
      console.error('Error saving recurrence:', error);
      toast({
        title: "Erro ao salvar recorrência",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete recurrence mutation
  const deleteRecurrenceMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulate deletion since there's no actual delete endpoint
      console.log('Deleting recurrence with ID:', id);
      return { status: 'success', id };
    },
    onSuccess: (data) => {
      // Update the local state to remove the deleted item
      const currentData = queryClient.getQueryData<RecurrentTransaction[]>(['recurrences']) || [];
      const updatedData = currentData.filter(item => item.id !== data.id);
      queryClient.setQueryData(['recurrences'], updatedData);
      
      toast({
        title: "Recorrência excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir recorrência",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (recurrence: RecurrentTransaction) => {
      const updatedRecurrence = {
        ...recurrence,
        ativa: !recurrence.ativa
      };
      console.log('Toggling active status:', updatedRecurrence);
      return recurrenciesAPI.save(updatedRecurrence);
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
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const recurrences = recurrencesData || [];
  const categories = categoriesData || [];
  const contacts = contactsData || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      tipo: 'all',
      status: 'all',
      categoria: 'all',
      contact: 'all',
    });
  };

  const resetRecurrenceForm = () => {
    setNewRecurrence({
      nome: '',
      valor: '',
      dia_vencimento: '',
      categoria_id: '',
      contato_id: '',
      descricao: '',
      tipo: 'Despesa',
      frequencia: 'mensal',
      ativa: true
    });
    setEditingRecurrence(null);
  };
  
  const filteredRecurrences = recurrences.filter(recurrence => {
    // Apply filters
    if (filters.tipo !== 'all' && recurrence.tipo !== filters.tipo) return false;
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !recurrence.ativa) return false;
      if (filters.status === 'inactive' && recurrence.ativa) return false;
    }
    if (filters.categoria !== 'all' && recurrence.categoria_nome !== filters.categoria) return false;
    if (filters.contact !== 'all' && recurrence.contato_nome !== filters.contact) return false;
    return true;
  });

  const handleSaveRecurrence = () => {
    // Validate form
    if (!newRecurrence.nome || !newRecurrence.valor || !newRecurrence.dia_vencimento || !newRecurrence.categoria_id) {
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

    // Validate due day
    const dueDay = parseInt(newRecurrence.dia_vencimento);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      toast({
        title: "Dia de vencimento inválido",
        description: "Por favor, informe um dia válido (1-31).",
        variant: "destructive",
      });
      return;
    }

    const recurrenceToSave = {
      ...(editingRecurrence ? { id: editingRecurrence.id } : {}),
      nome: newRecurrence.nome,
      valor: amount,
      dia_vencimento: dueDay,
      categoria_id: newRecurrence.categoria_id,
      contato_id: newRecurrence.contato_id,
      descricao: newRecurrence.descricao,
      tipo: newRecurrence.tipo,
      frequencia: newRecurrence.frequencia,
      ativa: newRecurrence.ativa
    };
    
    saveRecurrenceMutation.mutate(recurrenceToSave);
  };
  
  const handleEditRecurrence = (recurrence: RecurrentTransaction) => {
    setEditingRecurrence(recurrence);
    setNewRecurrence({
      nome: recurrence.nome,
      valor: recurrence.valor.toString(),
      dia_vencimento: recurrence.dia_vencimento.toString(),
      categoria_id: recurrence.categoria_id,
      contato_id: recurrence.contato_id || '',
      descricao: recurrence.descricao,
      tipo: recurrence.tipo,
      frequencia: recurrence.frequencia,
      ativa: recurrence.ativa
    });
    setDialogOpen(true);
  };

  const handleDeleteRecurrence = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta recorrência?')) {
      deleteRecurrenceMutation.mutate(id);
    }
  };

  const toggleRecurrenceActive = (recurrence: RecurrentTransaction) => {
    toggleActiveMutation.mutate(recurrence);
  };

  // Get badge for transaction type
  const getTypeBadge = (tipo: string) => {
    if (tipo === 'Receita') {
      return <Badge className="bg-green-500 hover:bg-green-600">{tipo}</Badge>;
    } else {
      return <Badge className="bg-blue-500 hover:bg-blue-600">{tipo}</Badge>;
    }
  };

  // Get badge for status
  const getStatusBadge = (ativa: boolean) => {
    if (ativa) {
      return <Badge className="bg-purple hover:bg-purple/90">Ativa</Badge>;
    } else {
      return <Badge variant="outline" className="text-gray-500">Inativa</Badge>;
    }
  };

  // Get formatted frequency
  const getFrequency = (freq: string) => {
    switch (freq) {
      case 'mensal': return 'Mensal';
      case 'quinzenal': return 'Quinzenal';
      case 'semanal': return 'Semanal';
      case 'anual': return 'Anual';
      default: return freq;
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4].map((item) => (
        <TableRow key={item}>
          <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-8 rounded-full" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  // Render error state
  const renderErrorState = () => (
    <TableRow>
      <TableCell colSpan={8} className="text-center py-10">
        <div className="flex flex-col items-center justify-center gap-2">
          <X className="h-10 w-10 text-red-500" />
          <h3 className="font-medium text-lg">Erro ao carregar recorrências</h3>
          <p className="text-muted-foreground">
            Não foi possível carregar a lista de recorrências. Tente novamente mais tarde.
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['recurrences'] })}
            className="mt-2 bg-purple hover:bg-purple/90"
          >
            Tentar novamente
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  console.log('Filtered recurrences: ', filteredRecurrences);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Recorrência
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">
                {editingRecurrence ? 'Editar Recorrência' : 'Nova Recorrência'}
              </DialogTitle>
              <DialogDescription>
                {editingRecurrence ? 'Edite as informações da recorrência.' : 'Preencha as informações para criar uma nova recorrência.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={nameId}>Nome*</Label>
                <Input
                  id={nameId}
                  value={newRecurrence.nome}
                  onChange={(e) => setNewRecurrence({ ...newRecurrence, nome: e.target.value })}
                  placeholder="Ex: Aluguel / Mensalidade"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={typeId}>Tipo*</Label>
                  <Select
                    value={newRecurrence.tipo}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, tipo: value as 'Despesa' | 'Receita' })}
                  >
                    <SelectTrigger id={typeId}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                      <SelectItem value="Receita">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={valueId}>Valor*</Label>
                  <Input
                    id={valueId}
                    placeholder="0,00"
                    value={newRecurrence.valor}
                    onChange={(e) => setNewRecurrence({ ...newRecurrence, valor: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={dueDayId}>Dia de vencimento*</Label>
                  <Input
                    id={dueDayId}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="01-31"
                    value={newRecurrence.dia_vencimento}
                    onChange={(e) => setNewRecurrence({ ...newRecurrence, dia_vencimento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={frequencyId}>Frequência*</Label>
                  <Select
                    value={newRecurrence.frequencia}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, frequencia: value as any })}
                  >
                    <SelectTrigger id={frequencyId}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={categoryId}>Categoria*</Label>
                  <Select
                    value={newRecurrence.categoria_id}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, categoria_id: value })}
                  >
                    <SelectTrigger id={categoryId}>
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
                  <Label htmlFor={contactId}>Contato</Label>
                  <Select
                    value={newRecurrence.contato_id}
                    onValueChange={(value) => setNewRecurrence({ ...newRecurrence, contato_id: value })}
                  >
                    <SelectTrigger id={contactId}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>{contact.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={descriptionId}>Descrição</Label>
                <Input
                  id={descriptionId}
                  value={newRecurrence.descricao}
                  onChange={(e) => setNewRecurrence({ ...newRecurrence, descricao: e.target.value })}
                  placeholder="Descrição ou observações adicionais"
                />
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
                    <span className="mr-2">⟳</span>
                    Processando
                  </>
                ) : editingRecurrence ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Lista de Lançamentos Recorrentes
            </h2>
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className={`h-4 w-4 ${filterOpen ? "rotate-180 transform" : ""}`} />
            </Button>
          </div>
          
          {filterOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="filter-tipo">Tipo</Label>
                <Select
                  value={filters.tipo}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                >
                  <SelectTrigger id="filter-tipo">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Receita">Receitas</SelectItem>
                    <SelectItem value="Despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="Todos" />
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
                  <SelectTrigger id="filter-categoria">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.nome}>{category.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={resetFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Dia</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  renderLoadingSkeleton()
                ) : isError ? (
                  renderErrorState()
                ) : filteredRecurrences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <h3 className="font-medium">Nenhum lançamento recorrente encontrado</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Crie uma nova recorrência para começar.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecurrences.map((recurrence) => (
                    <TableRow key={recurrence.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        {recurrence.nome}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(recurrence.valor)}
                      </TableCell>
                      <TableCell>{recurrence.dia_vencimento}</TableCell>
                      <TableCell>{recurrence.categoria_nome || '-'}</TableCell>
                      <TableCell>{getTypeBadge(recurrence.tipo)}</TableCell>
                      <TableCell>{getFrequency(recurrence.frequencia)}</TableCell>
                      <TableCell>{getStatusBadge(recurrence.ativa)}</TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem 
                              onClick={() => toggleRecurrenceActive(recurrence)}
                            >
                              {recurrence.ativa ? 'Desativar' : 'Ativar'}
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recorrentes;
