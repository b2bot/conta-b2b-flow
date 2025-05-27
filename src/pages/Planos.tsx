import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronDown, 
  Plus, 
  Filter,
  X,
  Download as DownloadIcon,
  MoreVertical
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
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/fileUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define plano type
interface Plano {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

// Define new plano form
interface PlanoForm {
  nome: string;
  descricao: string;
  ativo: boolean;
}

// Mock API para planos (será substituída pela API real quando disponível)
const planosAPI = {
  list: async () => {
    // Simulação de chamada à API
    return {
      status: 'success',
      planos: [
        { id: '1', nome: 'Cloud Hosting', descricao: 'Plano de hospedagem na nuvem', ativo: true },
        { id: '2', nome: 'Web Essencial', descricao: 'Plano web básico', ativo: true },
        { id: '3', nome: 'E-com Essencia', descricao: 'Plano para e-commerce', ativo: true },
        { id: '4', nome: 'Premium', descricao: 'Plano premium com recursos avançados', ativo: true }
      ]
    };
  },
  save: async (plano: any) => {
    // Simulação de chamada à API para salvar
    console.log('Salvando plano:', plano);
    return { status: 'success', message: 'Plano salvo com sucesso' };
  },
  delete: async (id: string) => {
    // Simulação de chamada à API para excluir
    console.log('Excluindo plano:', id);
    return { status: 'success', message: 'Plano excluído com sucesso' };
  }
};

const Planos = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    ativo: 'all',
  });
  
  const [newPlano, setNewPlano] = useState<PlanoForm>({
    nome: '',
    descricao: '',
    ativo: true,
  });
  
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch planos
  const { data: planosData, isLoading, isError } = useQuery({
    queryKey: ['planos'],
    queryFn: async () => {
      try {
        const response = await planosAPI.list();
        return response.status === 'success' ? response.planos : [];
      } catch (err) {
        console.error('Error fetching planos:', err);
        throw err;
      }
    }
  });

  // Create/update plano mutation
  const savePlanoMutation = useMutation({
    mutationFn: (plano: any) => planosAPI.save(plano),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['planos'] });
        toast({
          title: editingPlano ? "Plano atualizado com sucesso" : "Plano criado com sucesso",
        });
        setDialogOpen(false);
        resetPlanoForm();
      } else {
        toast({
          title: "Erro ao salvar plano",
          description: data.message || "Ocorreu um erro ao salvar o plano",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar plano",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete plano mutation
  const deletePlanoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await planosAPI.delete(id);
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['planos'] });
        toast({
          title: "Plano excluído com sucesso",
        });
      } else {
        toast({
          title: "Erro ao excluir plano",
          description: data.message || "Ocorreu um erro ao excluir o plano",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      // Tratamento amigável para erro de plano em uso
      const errorMessage = error.message || "Erro ao excluir plano";
      
      if (errorMessage.includes("não pode ser excluído") || 
          errorMessage.includes("sendo usado") || 
          errorMessage.includes("integrity constraint")) {
        toast({
          title: "Esse plano está sendo usado e não pode ser excluído",
          description: "Remova todas as receitas que usam este plano antes de excluí-lo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao excluir plano",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });

  const planos = planosData || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      ativo: 'all',
    });
  };

  const resetPlanoForm = () => {
    setNewPlano({
      nome: '',
      descricao: '',
      ativo: true,
    });
    setEditingPlano(null);
  };

  const filteredPlanos = planos.filter(plano => {
    // Apply filters
    if (filters.ativo !== 'all') {
      const isAtivo = filters.ativo === 'true';
      if (plano.ativo !== isAtivo) return false;
    }
    return true;
  });
  
  const handleSavePlano = () => {
    if (!newPlano.nome) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do plano é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const planoToSave = {
      ...(editingPlano ? { id: editingPlano.id } : {}),
      nome: newPlano.nome,
      descricao: newPlano.descricao,
      ativo: newPlano.ativo,
    };
    
    savePlanoMutation.mutate(planoToSave);
  };
  
  const handleEditPlano = (plano: Plano) => {
    setEditingPlano(plano);
    setNewPlano({
      nome: plano.nome,
      descricao: plano.descricao,
      ativo: plano.ativo,
    });
    setDialogOpen(true);
  };

  const handleDeletePlano = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano?')) {
      deletePlanoMutation.mutate(id);
    }
  };

  const handleExportPlanos = () => {
    // Transform planos for export
    const dataToExport = filteredPlanos.map(plano => ({
      Nome: plano.nome,
      Descrição: plano.descricao,
      Status: plano.ativo ? 'Ativo' : 'Inativo',
    }));
    
    exportToExcel(dataToExport, 'planos');
    
    toast({
      title: "Exportação concluída",
      description: "Os planos foram exportados com sucesso.",
    });
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-4">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-6">
            <Skeleton className="h-4 w-1/2" />
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
      <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar planos</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível carregar a lista de planos. Tente novamente mais tarde.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['planos'] })}
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
        <h1 className="text-2xl font-bold text-purple-dark">Planos</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportPlanos}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple hover:bg-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingPlano ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newPlano.nome}
                    onChange={(e) => setNewPlano({ ...newPlano, nome: e.target.value })}
                    placeholder="Ex: Cloud Hosting"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newPlano.descricao}
                    onChange={(e) => setNewPlano({ ...newPlano, descricao: e.target.value })}
                    placeholder="Ex: Plano de hospedagem na nuvem"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={newPlano.ativo}
                    onChange={(e) => setNewPlano({ ...newPlano, ativo: e.target.checked })}
                    className="rounded border-gray-300 text-purple focus:ring-purple"
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetPlanoForm();
                }}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-purple hover:bg-purple/90" 
                  onClick={handleSavePlano}
                  disabled={savePlanoMutation.isPending}
                >
                  {savePlanoMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Lista de Planos
            </h2>
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          
          {filterOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.ativo}
                  onValueChange={(value) => handleFilterChange('ativo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Ativos</SelectItem>
                    <SelectItem value="false">Inativos</SelectItem>
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
          
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
              <div className="col-span-4">Nome</div>
              <div className="col-span-6">Descrição</div>
              <div className="col-span-2">Ações</div>
            </div>
            
            {isLoading ? (
              renderLoadingSkeleton()
            ) : isError ? (
              renderErrorState()
            ) : filteredPlanos.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Nenhum plano encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há planos com os filtros aplicados.
                </p>
              </div>
            ) : (
              filteredPlanos.map((plano) => (
                <div 
                  key={plano.id} 
                  className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-4 font-medium">
                    {plano.nome}
                    {!plano.ativo && (
                      <Badge variant="outline" className="ml-2 text-gray-500">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-6 text-gray-600">
                    {plano.descricao || '-'}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPlano(plano)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePlano(plano.id)}
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

export default Planos;
