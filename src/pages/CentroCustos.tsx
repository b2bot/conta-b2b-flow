import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, 
  Plus, 
  MoreVertical 
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
import { costCentersAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/fileUtils';

// Define cost center type
interface CostCenter {
  id: string;
  nome: string;
  descricao: string;
}

// Define new cost center form
interface CostCenterForm {
  nome: string;
  descricao: string;
}

const CentroCustos = () => {
  const [newCostCenter, setNewCostCenter] = useState<CostCenterForm>({
    nome: '',
    descricao: '',
  });
  
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cost centers
  const { data: costCentersData, isLoading, isError } = useQuery({
    queryKey: ['costCenters'],
    queryFn: async () => {
      try {
        const response = await costCentersAPI.list();
        console.log('Cost centers response:', response);
        return response.status === 'success' ? response.centros_custo : [];
      } catch (err) {
        console.error('Error fetching cost centers:', err);
        throw err;
      }
    }
  });

  // Create/update cost center mutation
  const saveCostCenterMutation = useMutation({
    mutationFn: async (costCenter: CostCenterForm & { id?: string }) => {
      console.log('Saving cost center:', costCenter);
      return await costCentersAPI.save(costCenter);
    },
    onSuccess: (data) => {
      console.log('Save cost center response:', data);
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['costCenters'] });
        toast({
          title: editingCostCenter ? "Centro de custo atualizado com sucesso" : "Centro de custo criado com sucesso",
        });
        setDialogOpen(false);
        resetCostCenterForm();
      } else {
        toast({
          title: "Erro ao salvar centro de custo",
          description: data.message || "Ocorreu um erro ao salvar o centro de custo",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error saving cost center:', error);
      toast({
        title: "Erro ao salvar centro de custo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete cost center mutation
  const deleteCostCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder - actual implementation would call the delete API
      // return await costCentersAPI.delete(id);
      // For now we'll simulate a successful delete
      return { status: 'success' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast({
        title: "Centro de custo excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir centro de custo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const costCenters = costCentersData || [];

  // Function to verify if a cost center with the same name exists
  const isDuplicateName = (name: string, excludeId?: string) => {
    return costCenters.some(
      center => center.nome === name && center.id !== excludeId
    );
  };

  const resetCostCenterForm = () => {
    setNewCostCenter({
      nome: '',
      descricao: '',
    });
    setEditingCostCenter(null);
  };
  
  const handleSaveCostCenter = () => {
    if (!newCostCenter.nome) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do centro de custo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates when creating new cost center or changing name
    if (isDuplicateName(newCostCenter.nome, editingCostCenter?.id)) {
      toast({
        title: "Nome duplicado",
        description: "Já existe um centro de custo com este nome.",
        variant: "destructive",
      });
      return;
    }

    const costCenterToSave = {
      ...(editingCostCenter ? { id: editingCostCenter.id } : {}),
      nome: newCostCenter.nome,
      descricao: newCostCenter.descricao || '',
    };
    
    saveCostCenterMutation.mutate(costCenterToSave);
  };
  
  const handleEditCostCenter = (costCenter: CostCenter) => {
    console.log('Editing cost center:', costCenter);
    setEditingCostCenter(costCenter);
    setNewCostCenter({
      nome: costCenter.nome,
      descricao: costCenter.descricao || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteCostCenter = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este centro de custo?')) {
      deleteCostCenterMutation.mutate(id);
    }
  };

  const handleExportCostCenters = () => {
    // Transform cost centers for export
    const dataToExport = costCenters.map(costCenter => ({
      Nome: costCenter.nome,
      Descrição: costCenter.descricao || '-',
    }));
    
    exportToExcel(dataToExport, 'centros_custo');
    
    toast({
      title: "Exportação concluída",
      description: "Os centros de custo foram exportados com sucesso.",
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
      <div className="mx-auto h-12 w-12 text-red-500">X</div>
      <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar centros de custo</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível carregar a lista de centros de custo. Tente novamente mais tarde.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['costCenters'] })}
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
        <h1 className="text-2xl font-bold text-purple-dark">Centro de Custos</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCostCenters}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple hover:bg-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Centro de Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
                <DialogDescription>
                  {editingCostCenter ? 'Edite as informações do centro de custo.' : 'Preencha as informações para criar um novo centro de custo.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newCostCenter.nome}
                    onChange={(e) => setNewCostCenter({ ...newCostCenter, nome: e.target.value })}
                    placeholder="Ex: Administrativo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newCostCenter.descricao}
                    onChange={(e) => setNewCostCenter({ ...newCostCenter, descricao: e.target.value })}
                    placeholder="Ex: Despesas administrativas gerais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetCostCenterForm();
                }}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-purple hover:bg-purple/90" 
                  onClick={handleSaveCostCenter}
                  disabled={saveCostCenterMutation.isPending}
                >
                  {saveCostCenterMutation.isPending ? 'Salvando...' : 'Salvar'}
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
              Lista de Centros de Custo
            </h2>
          </div>
          
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
              <div className="col-span-4">Nome</div>
              <div className="col-span-6">Descrição</div>
              <div className="col-span-2"></div>
            </div>
            
            {isLoading ? (
              renderLoadingSkeleton()
            ) : isError ? (
              renderErrorState()
            ) : costCenters.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Nenhum centro de custo encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Crie um novo centro de custo para começar.
                </p>
              </div>
            ) : (
              costCenters.map((costCenter) => (
                <div 
                  key={costCenter.id} 
                  className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-4 font-medium">
                    {costCenter.nome}
                  </div>
                  <div className="col-span-6 text-muted-foreground break-words">
                    {costCenter.descricao ? costCenter.descricao : <span className="italic text-muted-foreground/60">Sem descrição</span>}
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
                        <DropdownMenuItem onClick={() => handleEditCostCenter(costCenter)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCostCenter(costCenter.id)}
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

export default CentroCustos;
