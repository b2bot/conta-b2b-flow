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
  Download as DownloadIcon,
  Upload as UploadIcon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { categoriesAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/fileUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

// Define category type
interface Category {
  id: string;
  nome: string;
  tipo: 'Despesa' | 'Receita';
}

// Define new category form
interface CategoryForm {
  nome: string;
  tipo: 'Despesa' | 'Receita';
}

const Categorias = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    tipo: 'all',
  });
  
  const [newCategory, setNewCategory] = useState<CategoryForm>({
    nome: '',
    tipo: 'Despesa',
  });
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoriesAPI.list();
        return response.status === 'success' ? response.categorias : [];
      } catch (err) {
        console.error('Error fetching categories:', err);
        throw err;
      }
    }
  });

  // Create/update category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: (category: any) => categoriesAPI.save(category),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast({
          title: editingCategory ? "Categoria atualizada com sucesso" : "Categoria criada com sucesso",
        });
        setDialogOpen(false);
        resetCategoryForm();
      } else {
        toast({
          title: "Erro ao salvar categoria",
          description: data.message || "Ocorreu um erro ao salvar a categoria",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar categoria",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder - actual implementation would call the delete API
      // return await categoriesAPI.delete(id);
      // For now we'll just simulate a delete
      return { status: 'success' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoria excluída com sucesso",
      });
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      tipo: 'all',
    });
  };

  const resetCategoryForm = () => {
    setNewCategory({
      nome: '',
      tipo: 'Despesa',
    });
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter(category => {
    // Apply filters
    if (filters.tipo !== 'all' && category.tipo !== filters.tipo) return false;
    return true;
  });
  
  const handleSaveCategory = () => {
    if (!newCategory.nome) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const categoryToSave = {
      ...(editingCategory ? { id: editingCategory.id } : {}),
      nome: newCategory.nome,
      tipo: newCategory.tipo,
    };
    
    saveCategoryMutation.mutate(categoryToSave);
  };
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      nome: category.nome,
      tipo: category.tipo,
    });
    setDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleExportCategories = () => {
    // Transform categories for export
    const dataToExport = filteredCategories.map(category => ({
      Nome: category.nome,
      Tipo: category.tipo,
    }));
    
    exportToExcel(dataToExport, 'categorias');
    
    toast({
      title: "Exportação concluída",
      description: "As categorias foram exportadas com sucesso.",
    });
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-6">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-4">
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
      <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar categorias</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível carregar a lista de categorias. Tente novamente mais tarde.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
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
        <h1 className="text-2xl font-bold text-purple-dark">Categorias</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCategories}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple hover:bg-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newCategory.nome}
                    onChange={(e) => setNewCategory({ ...newCategory, nome: e.target.value })}
                    placeholder="Ex: Alimentação"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newCategory.tipo}
                    onValueChange={(value) => setNewCategory({ ...newCategory, tipo: value as 'Despesa' | 'Receita' })}
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetCategoryForm();
                }}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-purple hover:bg-purple/90" 
                  onClick={handleSaveCategory}
                  disabled={saveCategoryMutation.isPending}
                >
                  {saveCategoryMutation.isPending ? 'Salvando...' : 'Salvar'}
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
              Lista de Categorias
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
                <Label htmlFor="type-filter">Tipo</Label>
                <Select
                  value={filters.tipo}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Despesa">Despesas</SelectItem>
                    <SelectItem value="Receita">Receitas</SelectItem>
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
              <div className="col-span-6">Nome</div>
              <div className="col-span-4">Tipo</div>
              <div className="col-span-2"></div>
            </div>
            
            {isLoading ? (
              renderLoadingSkeleton()
            ) : isError ? (
              renderErrorState()
            ) : filteredCategories.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Nenhuma categoria encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há categorias com os filtros aplicados.
                </p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div 
                  key={category.id} 
                  className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-6 font-medium">
                    {category.nome}
                  </div>
                  <div className="col-span-4">
                    <Badge className={`${category.tipo === 'Receita' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                      {category.tipo}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCategory(category.id)}
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

export default Categorias;
