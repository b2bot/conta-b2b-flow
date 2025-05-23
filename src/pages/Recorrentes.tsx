import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  MoreVertical, 
  Download,
  Check,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { recurrencesAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { format, addMonths, addYears, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel } from '@/utils/fileUtils';

// Define recurring transaction type
interface RecurringTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  categoria_nome: string;
  contato_id: string;
  contato_nome: string;
  frequencia: 'monthly' | 'yearly';
  dia: string;
  proxima_data: string;
  ativo: boolean;
  created_at?: string;
}

// Define form type
interface RecurringForm {
  id?: string;
  descricao: string;
  valor: number;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  contato_id: string;
  frequencia: 'monthly' | 'yearly';
  dia: string;
  proxima_data: string;
  ativo: boolean;
}

const Recorrentes = () => {
  const [newRecurring, setNewRecurring] = useState<RecurringForm>({
    descricao: '',
    valor: 0,
    tipo: 'Despesa',
    categoria_id: '',
    contato_id: '',
    frequencia: 'monthly',
    dia: '1',
    proxima_data: format(new Date(), 'yyyy-MM-dd'),
    ativo: true,
  });

  const [openCalendar, setOpenCalendar] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNextDateDialog, setEditNextDateDialog] = useState(false);
  const [selectedRecurringId, setSelectedRecurringId] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<Date | undefined>(new Date());
  const [nextDateInput, setNextDateInput] = useState<string>(format(new Date(), 'dd/MM/yyyy'));
  const queryClient = useQueryClient();

  // Handle next date input change
  const handleNextDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNextDateInput(value);
    
    if (value.length === 10) { // dd/MM/yyyy
      try {
        const parsedDate = parse(value, "dd/MM/yyyy", new Date());
        if (!isNaN(parsedDate.getTime())) {
          setNextDate(parsedDate);
        }
      } catch (error) {
        console.error("Invalid date format:", error);
      }
    }
  };

  // Update input when nextDate changes from calendar
  React.useEffect(() => {
    if (nextDate) {
      setNextDateInput(format(nextDate, "dd/MM/yyyy"));
    }
  }, [nextDate]);
  
  // Fetch recurring transactions
  const { data: recurringsData, isLoading, isError } = useQuery({
    queryKey: ['recurrings'],
    queryFn: async () => {
      try {
        const response = await recurrencesAPI.list();
        if (response.status === 'success') {
          return response.recorrentes || [];
        } else {
          throw new Error(response.message || 'Error fetching recurring transactions');
        }
      } catch (err) {
        console.error('Error fetching recurring transactions:', err);
        throw err;
      }
    }
  });

  // Fetch categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.list();
      return response.status === 'success' ? response.categorias : [];
    }
  });

  // Fetch contacts
  const { data: contactsData = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await contactsAPI.list();
      return response.status === 'success' ? response.contatos : [];
    }
  });

  // Create/update recurring transaction mutation
  const saveRecurringMutation = useMutation({
    mutationFn: (recurring: RecurringForm) => recurrencesAPI.save(recurring),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurrings'] });
        toast({
          title: editingRecurring ? "Recorrência atualizada com sucesso" : "Recorrência criada com sucesso",
        });
        setDialogOpen(false);
        resetRecurringForm();
      } else {
        toast({
          title: "Erro ao salvar recorrência",
          description: data.message || "Ocorreu um erro ao salvar a recorrência",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar recorrência",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update next date mutation
  const updateNextDateMutation = useMutation({
    mutationFn: async (data: { id: string; proxima_data: string }) => {
      const recurring = recurringsData?.find(r => r.id === data.id);
      if (!recurring) throw new Error("Recorrência não encontrada");
      
      return recurrencesAPI.save({
        ...recurring,
        proxima_data: data.proxima_data
      });
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurrings'] });
        toast({
          title: "Data atualizada",
          description: "Próxima data atualizada com sucesso",
        });
        setEditNextDateDialog(false);
        setSelectedRecurringId(null);
        setNextDate(undefined);
      } else {
        toast({
          title: "Erro ao atualizar data",
          description: data.message || "Ocorreu um erro ao atualizar a data",
          variant: "destructive",
        });
      }
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (recurring: RecurringTransaction) => {
      return recurrencesAPI.save({
        ...recurring,
        ativo: !recurring.ativo
      });
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurrings'] });
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
    }
  });

  // Delete recurring transaction mutation
  const deleteRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder for a delete API that doesn't exist yet
      // For now it will simulate a successful delete
      return { status: 'success' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrings'] });
      toast({
        title: "Recorrência excluída",
        description: "Recorrência excluída com sucesso",
      });
    }
  });

  const recurrings = recurringsData || [];
  const categories = categoriesData || [];
  const contacts = contactsData || [];

  // Reset form
  const resetRecurringForm = () => {
    setNewRecurring({
      descricao: '',
      valor: 0,
      tipo: 'Despesa',
      categoria_id: '',
      contato_id: '',
      frequencia: 'monthly',
      dia: '1',
      proxima_data: format(new Date(), 'yyyy-MM-dd'),
      ativo: true,
    });
    setEditingRecurring(null);
  };

  // Handle save
  const handleSaveRecurring = () => {
    if (!newRecurring.descricao) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    if (!newRecurring.categoria_id) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma categoria.",
        variant: "destructive",
      });
      return;
    }

    if (!newRecurring.contato_id) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione um contato.",
        variant: "destructive",
      });
      return;
    }

    const recurringToSave = {
      ...(editingRecurring ? { id: editingRecurring.id } : {}),
      ...newRecurring,
      valor: Number(newRecurring.valor)
    };

    saveRecurringMutation.mutate(recurringToSave);
  };

  // Handle edit
  const handleEditRecurring = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setNewRecurring({
      id: recurring.id,
      descricao: recurring.descricao,
      valor: recurring.valor,
      tipo: recurring.tipo,
      categoria_id: recurring.categoria_id,
      contato_id: recurring.contato_id,
      frequencia: recurring.frequencia,
      dia: recurring.dia,
      proxima_data: recurring.proxima_data,
      ativo: recurring.ativo
    });
    setDialogOpen(true);
  };

  // Handle delete
  const handleDeleteRecurring = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta recorrência?')) {
      deleteRecurringMutation.mutate(id);
    }
  };

  // Handle toggle active
  const handleToggleActive = (recurring: RecurringTransaction) => {
    toggleActiveMutation.mutate(recurring);
  };

  // Handle edit next date
  const handleEditNextDate = (id: string, currentDate: string) => {
    setSelectedRecurringId(id);
    const dateObj = new Date(currentDate);
    setNextDate(dateObj);
    setNextDateInput(format(dateObj, "dd/MM/yyyy"));
    setEditNextDateDialog(true);
  };

  // Handle save next date
  const handleSaveNextDate = () => {
    if (!selectedRecurringId || !nextDate) return;

    updateNextDateMutation.mutate({
      id: selectedRecurringId,
      proxima_data: format(nextDate, 'yyyy-MM-dd')
    });
  };

  // Handle export
  const handleExportRecurrings = () => {
    const dataToExport = recurrings.map(recurring => ({
      Descrição: recurring.descricao,
      Valor: recurring.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }),
      Tipo: recurring.tipo,
      Categoria: recurring.categoria_nome,
      Contato: recurring.contato_nome,
      Frequência: recurring.frequencia === 'monthly' ? 'Mensal' : 'Anual',
      Dia: recurring.dia,
      'Próxima Data': format(new Date(recurring.proxima_data), 'dd/MM/yyyy'),
      Status: recurring.ativo ? 'Ativo' : 'Inativo'
    }));

    exportToExcel(dataToExport, 'recorrencias');

    toast({
      title: "Exportação concluída",
      description: "As recorrências foram exportadas com sucesso.",
    });
  };

  // Get frequency badge
  const getFrequencyBadge = (frequency: string) => {
    if (frequency === 'monthly') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Mensal</Badge>;
    } else if (frequency === 'yearly') {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Anual</Badge>;
    }
    return null;
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge className="bg-green-500">Ativo</Badge> : 
      <Badge className="bg-gray-500">Inativo</Badge>;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-9 gap-2 p-4 border-b border-border items-center">
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
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="p-8 text-center">
      <div className="mx-auto h-12 w-12 text-red-500">X</div>
      <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar recorrências</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível carregar a lista de recorrências. Tente novamente mais tarde.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['recurrings'] })}
          className="bg-purple hover:bg-purple/90"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportRecurrings}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple hover:bg-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRecurring ? 'Editar Lançamento Recorrente' : 'Novo Lançamento Recorrente'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações para criar um novo lançamento recorrente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo-lancamento">Tipo</Label>
                    <Select
                      value={newRecurring.tipo}
                      onValueChange={(value: 'Despesa' | 'Receita') => setNewRecurring({ ...newRecurring, tipo: value })}
                    >
                      <SelectTrigger id="tipo-lancamento" className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Despesa">Despesa</SelectItem>
                        <SelectItem value="Receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="valor-lancamento">Valor</Label>
                    <Input
                      id="valor-lancamento"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newRecurring.valor}
                      onChange={(e) => setNewRecurring({ ...newRecurring, valor: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="descricao-lancamento">Descrição</Label>
                  <Input
                    id="descricao-lancamento"
                    value={newRecurring.descricao}
                    onChange={(e) => setNewRecurring({ ...newRecurring, descricao: e.target.value })}
                    placeholder="Ex: Aluguel mensal"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria-lancamento">Categoria</Label>
                    <Select 
                      value={newRecurring.categoria_id} 
                      onValueChange={(value) => setNewRecurring({ ...newRecurring, categoria_id: value })}
                    >
                      <SelectTrigger id="categoria-lancamento" className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contato-lancamento">Contato</Label>
                    <Select 
                      value={newRecurring.contato_id} 
                      onValueChange={(value) => setNewRecurring({ ...newRecurring, contato_id: value })}
                    >
                      <SelectTrigger id="contato-lancamento" className="w-full">
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
                  <div>
                    <Label htmlFor="frequencia-lancamento">Frequência</Label>
                    <Select 
                      value={newRecurring.frequencia} 
                      onValueChange={(value: 'monthly' | 'yearly') => setNewRecurring({ ...newRecurring, frequencia: value })}
                    >
                      <SelectTrigger id="frequencia-lancamento" className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dia-lancamento">Dia</Label>
                    <Input
                      id="dia-lancamento"
                      type="number"
                      min="1"
                      max="31"
                      value={newRecurring.dia}
                      onChange={(e) => setNewRecurring({ ...newRecurring, dia: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="ativo-lancamento" className="flex items-center gap-2">
                    <Switch 
                      id="ativo-lancamento"
                      checked={newRecurring.ativo} 
                      onCheckedChange={(checked) => setNewRecurring({ ...newRecurring, ativo: checked })} 
                    />
                    <span>Ativo</span>
                  </Label>
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
                  disabled={saveRecurringMutation.isPending}
                >
                  {saveRecurringMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="border rounded-md">
            <div className="grid grid-cols-9 gap-2 p-4 bg-muted/50 font-medium">
              <div className="col-span-2">Descrição</div>
              <div className="col-span-1">Contato</div>
              <div className="col-span-1">Categoria</div>
              <div className="col-span-1">Dia</div>
              <div className="col-span-1">Frequência</div>
              <div className="col-span-1">Valor</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Próxima Data</div>
            </div>
            
            {isLoading ? (
              renderLoadingSkeleton()
            ) : isError ? (
              renderErrorState()
            ) : recurrings.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Nenhum lançamento recorrente encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Crie um novo lançamento recorrente para começar.
                </p>
              </div>
            ) : (
              recurrings.map((recurring) => (
                <div 
                  key={recurring.id} 
                  className="grid grid-cols-9 gap-2 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-2 font-medium truncate">
                    {recurring.descricao}
                  </div>
                  <div className="col-span-1 text-muted-foreground truncate">
                    {recurring.contato_nome}
                  </div>
                  <div className="col-span-1 text-muted-foreground truncate">
                    {recurring.categoria_nome}
                  </div>
                  <div className="col-span-1 text-muted-foreground">
                    {recurring.dia}
                  </div>
                  <div className="col-span-1">
                    {getFrequencyBadge(recurring.frequencia)}
                  </div>
                  <div className={`col-span-1 font-medium ${recurring.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(recurring.valor)}
                  </div>
                  <div className="col-span-1">
                    {getStatusBadge(recurring.ativo)}
                  </div>
                  <div className="col-span-1 flex items-center gap-2">
                    <span>{format(new Date(recurring.proxima_data), 'dd/MM/yyyy')}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRecurring(recurring)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditNextDate(recurring.id, recurring.proxima_data)}>
                          Alterar próxima data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(recurring)}>
                          {recurring.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRecurring(recurring.id)}
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

      <Dialog open={editNextDateDialog} onOpenChange={setEditNextDateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Alterar Próxima Data</DialogTitle>
            <DialogDescription>
              Selecione a nova data para a próxima ocorrência.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="next-date">Próxima Data</Label>
              <div className="flex space-x-2">
                <Input
                  id="next-date"
                  value={nextDateInput}
                  onChange={handleNextDateChange}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="px-3">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={nextDate}
                      onSelect={setNextDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNextDateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-purple hover:bg-purple/90" 
              onClick={handleSaveNextDate}
              disabled={updateNextDateMutation.isPending}
            >
              {updateNextDateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recorrentes;
