
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  X,
  Pencil,
  MoreHorizontal,
  Loader2
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '@/services/api';

interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
}

const Categorias = () => {
  const [newCategory, setNewCategory] = useState<{ name: string; type: 'expense' | 'income' }>({ 
    name: '', 
    type: 'expense' 
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoriesAPI.list();
        return response.success ? response.categories : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Erro ao carregar categorias",
          description: "Não foi possível carregar a lista de categorias",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (category: { name: string; type: string }) => categoriesAPI.save(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoria criada com sucesso",
      });
      setDialogOpen(false);
      setNewCategory({ name: '', type: 'expense' });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => {
      const category = categoriesData?.find(cat => cat.id === id);
      return categoriesAPI.save({ id, name, type: category?.type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoria atualizada com sucesso",
      });
      setEditId(null);
      setEditName('');
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoria excluída com sucesso",
      });
      setAlertDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const categories = categoriesData || [];

  const filteredCategories = categories.filter(category => {
    if (filter === 'all') return true;
    return category.type === filter;
  });

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createCategoryMutation.mutate({
      name: newCategory.name.trim(),
      type: newCategory.type
    });
  };
  
  const startEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
  };
  
  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
  };
  
  const saveEdit = (id: string) => {
    if (!editName.trim()) {
      toast({
        title: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    updateCategoryMutation.mutate({ id, name: editName.trim() });
  };
  
  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setAlertDialogOpen(true);
  };
  
  const deleteCategory = () => {
    if (!categoryToDelete) return;
    deleteCategoryMutation.mutate(categoryToDelete);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-purple-dark">Categorias</h1>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
          <span className="ml-2">Carregando categorias...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-purple-dark">Categorias</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="text-center">Erro ao carregar categorias. Por favor, tente novamente.</p>
          <div className="flex justify-center mt-4">
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
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
        <h1 className="text-2xl font-bold text-purple-dark">Categorias</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple hover:bg-purple/90">
              <Plus size={18} className="mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da categoria</Label>
                <Input 
                  id="name" 
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Ex: Marketing, Vendas, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={newCategory.type}
                  onValueChange={(value: 'expense' | 'income') => setNewCategory({...newCategory, type: value})}
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-purple hover:bg-purple/90" 
                onClick={handleCreateCategory}
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : 'Criar Categoria'}
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
          Todas
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                {editId === category.id ? (
                  <div className="flex-1 mr-2">
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${
                      category.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                )}

                <div className="flex items-center">
                  {editId === category.id ? (
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() => saveEdit(category.id)}
                        disabled={updateCategoryMutation.isPending}
                      >
                        {updateCategoryMutation.isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600"
                        onClick={cancelEdit}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => startEdit(category.id, category.name)}
                          className="cursor-pointer"
                        >
                          <Pencil size={14} className="mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(category.id)}
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          <X size={14} className="mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma categoria encontrada. Crie uma nova categoria para começar.
        </div>
      )}
      
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={deleteCategory}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? (
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

export default Categorias;
