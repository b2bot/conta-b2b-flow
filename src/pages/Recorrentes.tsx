
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, 
  Plus, 
  MoreVertical,
  Search,
  RefreshCw
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { recurrencesAPI, categoriesAPI, contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

interface Recurrence {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  categoria_nome: string;
  contato_id: string;
  contato_nome: string;
  data_inicial: string;
  frequencia: 'Mensal' | 'Anual';
  status: 'Ativo' | 'Pausado';
}

interface RecurrenceForm {
  descricao: string;
  valor: string;
  tipo: 'Despesa' | 'Receita';
  categoria_id: string;
  contato_id: string;
  data_inicial: Date;
  frequencia: 'Mensal' | 'Anual';
}

const Recorrentes = () => {
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceForm>({
    descricao: '',
    valor: '',
    tipo: 'Despesa',
    categoria_id: '',
    contato_id: '',
    data_inicial: new Date(),
    frequencia: 'Mensal',
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recurrences
  const { data: recurrencesData, isLoading, error } = useQuery({
    queryKey: ['recurrences'],
    queryFn: async () => {
      try {
        const response = await recurrencesAPI.list();
        console.log('Recurrences response:', response);
        if (response.status === 'success') {
          return response.recorrencias;
        }
        return [];
      } catch (err) {
        console.error('Error fetching recurrences:', err);
        throw err;
      }
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.list();
      return response.status === 'success' ? response.categorias : [];
    }
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await contactsAPI.list();
      return response.status === 'success' ? response.contatos : [];
    }
  });

  // Save recurrence mutation
  const saveRecurrenceMutation = useMutation({
    mutationFn: async (recurrence: any) => {
      console.log('Saving recurrence:', recurrence);
      return await recurrencesAPI.save(recurrence);
    },
    onSuccess: (data) => {
      if (data && typeof data === 'object' && 'status' in data && data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        toast({
          title: "Recorrência salva com sucesso",
        });
        setDialogOpen(false);
        resetForm();
      } else {
        toast({
          title: "Erro ao salvar recorrência",
          description: data && typeof data === 'object' && 'message' in data ? String(data.message) : "Ocorreu um erro ao salvar a recorrência",
          variant: "destructive",
        });
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      toast({
        title: "Erro ao salvar recorrência",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setNewRecurrence({
      descricao: '',
      valor: '',
      tipo: 'Despesa',
      categoria_id: '',
      contato_id: '',
      data_inicial: new Date(),
      frequencia: 'Mensal',
    });
  };

  const handleSaveRecurrence = () => {
    if (!newRecurrence.descricao || !newRecurrence.valor || !newRecurrence.categoria_id || !newRecurrence.contato_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newRecurrence.valor.replace(',', '.'));
    if (isNaN(amount)) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido",
        variant: "destructive",
      });
      return;
    }

    const recurrenceToSave = {
      descricao: newRecurrence.descricao,
      valor: amount,
      tipo: newRecurrence.tipo,
      categoria_id: newRecurrence.categoria_id,
      contato_id: newRecurrence.contato_id,
      data_inicial: format(newRecurrence.data_inicial, 'yyyy-MM-dd'),
      frequencia: newRecurrence.frequencia,
      status: 'Ativo'
    };

    saveRecurrenceMutation.mutate(recurrenceToSave);
  };

  const deleteRecurrenceMutation = useMutation({
    mutationFn: async (id: string) => {
      // This would normally call a delete API, but for now we'll just simulate success
      return { status: 'success', id };
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        // Update local data by filtering out the deleted item
        const currentData = queryClient.getQueryData<Recurrence[]>(['recurrences']) || [];
        const updatedData = currentData.filter(item => item.id !== data.id);
        queryClient.setQueryData(['recurrences'], updatedData);
        
        toast({
          title: "Recorrência removida com sucesso",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover recorrência",
        description: error instanceof Error ? error.message : "Um erro ocorreu",
        variant: "destructive",
      });
    }
  });

  const handleDeleteRecurrence = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta recorrência?')) {
      deleteRecurrenceMutation.mutate(id);
    }
  };

  // Filter recurrences based on search term
  const recurrences = recurrencesData || [];
  const filteredRecurrences = recurrences.filter(
    (recurrence) =>
      recurrence.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recurrence.categoria_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recurrence.contato_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Lançamentos Recorrentes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento Recorrente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Novo Lançamento Recorrente</DialogTitle>
              <DialogDescription>
                Crie um lançamento que se repetirá automaticamente conforme a frequência escolhida.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={newRecurrence.descricao}
                  onChange={(e) => setNewRecurrence({...newRecurrence, descricao: e.target.value})}
                  placeholder="Ex: Aluguel do escritório"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={newRecurrence.tipo}
                    onValueChange={(value) => setNewRecurrence({...newRecurrence, tipo: value as 'Despesa' | 'Receita'})}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                      <SelectItem value="Receita">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    value={newRecurrence.valor}
                    onChange={(e) => setNewRecurrence({...newRecurrence, valor: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={newRecurrence.categoria_id}
                    onValueChange={(value) => setNewRecurrence({...newRecurrence, categoria_id: value})}
                  >
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Select
                    value={newRecurrence.contato_id}
                    onValueChange={(value) => setNewRecurrence({...newRecurrence, contato_id: value})}
                  >
                    <SelectTrigger id="contato">
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
                <div className="grid gap-2">
                  <Label htmlFor="data-inicial">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="data-inicial"
                        variant={"outline"}
                        className="justify-start text-left font-normal"
                      >
                        {format(newRecurrence.data_inicial, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newRecurrence.data_inicial}
                        onSelect={(date) => date && setNewRecurrence({...newRecurrence, data_inicial: date})}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select
                    value={newRecurrence.frequencia}
                    onValueChange={(value) => setNewRecurrence({...newRecurrence, frequencia: value as 'Mensal' | 'Anual'})}
                  >
                    <SelectTrigger id="frequencia">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button 
                className="bg-purple hover:bg-purple/90" 
                onClick={handleSaveRecurrence}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar lançamentos recorrentes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['recurrences'] })}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Atualizar</span>
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Lançamentos Recorrentes
              </h2>
            </div>
            
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple border-t-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Carregando lançamentos recorrentes...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-red-500">Erro ao carregar recorrências</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['recurrences'] })}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredRecurrences.length === 0 ? (
              <div className="py-12 text-center border rounded-md">
                <p className="text-muted-foreground">Nenhum lançamento recorrente encontrado</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
                  <div className="col-span-3">Descrição</div>
                  <div className="col-span-2">Valor</div>
                  <div className="col-span-2">Categoria</div>
                  <div className="col-span-2">Contato</div>
                  <div className="col-span-2">Frequência</div>
                  <div className="col-span-1"></div>
                </div>
                {filteredRecurrences.map((recurrence) => (
                  <div 
                    key={recurrence.id} 
                    className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Badge className={recurrence.tipo === 'Receita' ? 'bg-green-500' : 'bg-blue-500'}>
                          {recurrence.tipo}
                        </Badge>
                        <span>{recurrence.descricao}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {recurrence.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {recurrence.categoria_nome}
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {recurrence.contato_nome}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="font-normal">
                        {recurrence.frequencia}
                      </Badge>
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
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recorrentes;
