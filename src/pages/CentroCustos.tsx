import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  X,
  Pencil,
  MoreHorizontal,
  Loader2,
  Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'https://sistema.vksistemas.com.br/api';

const costCentersAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-centro-custos.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  },
  save: async (centro: any) => {
    const res = await fetch(`${API_BASE_URL}/salvar-centro-custo.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(centro),
    });
    return await res.json();
  }
};

interface CostCenter {
  id: string;
  name: string;
  budget: number;
  used?: number;
}

const CentroCustos = () => {
  const [newCostCenter, setNewCostCenter] = useState({ name: '', budget: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', budget: '' });
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cost centers
  const { data: costCentersData, isLoading, isError } = useQuery({
    queryKey: ['costCenters'],
    queryFn: async () => {
      try {
        const response = await costCentersAPI.list();
        return response.success ? response.costCenters : [];
      } catch (error) {
        console.error('Error fetching cost centers:', error);
        toast({
          title: "Erro ao carregar centros de custo",
          description: "Não foi possível carregar a lista de centros de custo",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Create cost center mutation
  const createCostCenterMutation = useMutation({
    mutationFn: (costCenter: { name: string; budget: number }) => costCentersAPI.save(costCenter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast({
        title: "Centro de custo criado com sucesso",
      });
      setDialogOpen(false);
      setNewCostCenter({ name: '', budget: '' });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar centro de custo",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Update cost center mutation
  const updateCostCenterMutation = useMutation({
    mutationFn: ({ id, name, budget }: { id: string; name: string; budget: number }) => {
      return costCentersAPI.save({ id, name, budget });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast({
        title: "Centro de custo atualizado com sucesso",
      });
      setEditId(null);
      setEditData({ name: '', budget: '' });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar centro de custo",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete cost center mutation
  const deleteCostCenterMutation = useMutation({
    mutationFn: (id: string) => costCentersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast({
        title: "Centro de custo excluído com sucesso",
      });
      setAlertDialogOpen(false);
      setCenterToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir centro de custo",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const costCenters = costCentersData || [];

  const handleCreateCostCenter = () => {
    if (!newCostCenter.name.trim()) {
      toast({
        title: "Nome do centro de custo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!newCostCenter.budget.trim()) {
      toast({
        title: "Orçamento é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createCostCenterMutation.mutate({
      name: newCostCenter.name.trim(),
      budget: parseFloat(newCostCenter.budget)
    });
  };
  
  const startEdit = (id: string, name: string, budget: number) => {
    setEditId(id);
    setEditData({ name, budget: budget.toString() });
  };
  
  const cancelEdit = () => {
    setEditId(null);
    setEditData({ name: '', budget: '' });
  };
  
  const saveEdit = (id: string) => {
    if (!editData.name.trim()) {
      toast({
        title: "Nome do centro de custo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!editData.budget.trim()) {
      toast({
        title: "Orçamento é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    updateCostCenterMutation.mutate({
      id,
      name: editData.name.trim(),
      budget: parseFloat(editData.budget)
    });
  };
  
  const confirmDelete = (id: string) => {
    setCenterToDelete(id);
    setAlertDialogOpen(true);
  };
  
  const deleteCostCenter = () => {
    if (!centerToDelete) return;
    deleteCostCenterMutation.mutate(centerToDelete);
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Calculate used budget (mocked for now, can be replaced with actual data from API when available)
  const getUsedBudget = (center: CostCenter) => {
    return center.used !== undefined ? center.used : center.budget * 0.3;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-purple-dark">Centro de Custos</h1>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
          <span className="ml-2">Carregando centros de custo...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-purple-dark">Centro de Custos</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="text-center">Erro ao carregar centros de custo. Por favor, tente novamente.</p>
          <div className="flex justify-center mt-4">
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['costCenters'] })}
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
        <h1 className="text-2xl font-bold text-purple-dark">Centro de Custos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus size={18} className="mr-2" />
              Novo Centro de Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">Novo Centro de Custo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do centro de custo</Label>
                <Input 
                  id="name" 
                  value={newCostCenter.name}
                  onChange={(e) => setNewCostCenter({...newCostCenter, name: e.target.value})}
                  placeholder="Ex: Marketing, Vendas, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento</Label>
                <Input 
                  id="budget" 
                  value={newCostCenter.budget}
                  onChange={(e) => setNewCostCenter({...newCostCenter, budget: e.target.value})}
                  placeholder="0,00"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-purple hover:bg-purple/90" 
                onClick={handleCreateCostCenter}
                disabled={createCostCenterMutation.isPending}
              >
                {createCostCenterMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : 'Criar Centro de Custo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {costCenters.map((center) => (
          <Card key={center.id}>
            <CardContent className="p-4">
              {editId === center.id ? (
                <div className="space-y-3">
                  <Input 
                    value={editData.name} 
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    placeholder="Nome do centro de custo"
                    autoFocus
                  />
                  <Input 
                    value={editData.budget} 
                    onChange={(e) => setEditData({...editData, budget: e.target.value})}
                    placeholder="Orçamento"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      className="bg-purple hover:bg-purple/90"
                      onClick={() => saveEdit(center.id)}
                      disabled={updateCostCenterMutation.isPending}
                    >
                      {updateCostCenterMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : 'Salvar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">{center.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => startEdit(center.id, center.name, center.budget)}
                          className="cursor-pointer"
                        >
                          <Pencil size={14} className="mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(center.id)}
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          <X size={14} className="mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Orçamento: <span className="font-medium text-purple-dark">{formatCurrency(center.budget)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple rounded-full" 
                      style={{width: `${(getUsedBudget(center) / center.budget) * 100}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Utilizado: {formatCurrency(getUsedBudget(center))}</span>
                    <span>Disponível: {formatCurrency(center.budget - getUsedBudget(center))}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {costCenters.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum centro de custo encontrado. Crie um novo centro de custo para começar.
        </div>
      )}
      
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir centro de custo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este centro de custo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={deleteCostCenter}
              disabled={deleteCostCenterMutation.isPending}
            >
              {deleteCostCenterMutation.isPending ? (
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

export default CentroCustos;
