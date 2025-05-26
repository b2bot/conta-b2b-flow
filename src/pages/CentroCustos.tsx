import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { costCentersAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { 
  MoreVertical, 
  Edit, 
  Trash
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

// Interface para centro de custo
interface CentroCusto {
  id: string;
  nome: string;
  tipo: 'Despesa' | 'Receita';
}

const CentroCustos = () => {
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<'Despesa' | 'Receita'>('Despesa');
  const [editingCentroCusto, setEditingCentroCusto] = useState<CentroCusto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Busca centros de custo
  const { data: costCentersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['costCenters'],
    queryFn: async () => {
      const response = await costCentersAPI.list();
      // ATENÇÃO: Tem que bater com o backend!
      // Se no PHP está "centros_custo", mantenha aqui!
      return response.status === 'success' ? response.centros_custo : [];
    },
    staleTime: 0, // Sempre considerar os dados obsoletos para forçar refetch
    cacheTime: 0, // Não manter cache
  });

  // Adiciona/atualiza centro de custo
  const saveMutation = useMutation({
    mutationFn: async (centro: { id?: string; nome: string; tipo: 'Despesa' | 'Receita' }) => {
      // Garantir que o tipo seja enviado corretamente
      return costCentersAPI.save(centro);
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({ title: editingCentroCusto ? 'Centro de custo atualizado com sucesso!' : 'Centro de custo criado com sucesso!' });
        setNovoNome('');
        setNovoTipo('Despesa');
        setEditingCentroCusto(null);
        setDialogOpen(false);
        
        // Forçar invalidação do cache e refetch imediato
        queryClient.invalidateQueries({ queryKey: ['costCenters'] });
        queryClient.resetQueries({ queryKey: ['costCenters'] });
        
        // Forçar múltiplos refetches para garantir atualização da UI
        refetch();
        
        // Pequeno delay para garantir que a UI seja atualizada após o refetch
        setTimeout(() => {
          refetch();
          // Forçar atualização da UI
          queryClient.invalidateQueries({ queryKey: ['costCenters'] });
        }, 300);
      } else {
        toast({
          title: 'Erro ao salvar centro de custo',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar centro de custo',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  // Exclui centro de custo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Usar o endpoint real de exclusão
      const response = await fetch('https://sistema.vksistemas.com.br/api/excluir-centro-custo.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').token || ''}`
        },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao excluir centro de custo');
      return data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({ title: 'Centro de custo excluído com sucesso!' });
        queryClient.invalidateQueries({ queryKey: ['costCenters'] });
        refetch();
      } else {
        toast({
          title: 'Erro ao excluir centro de custo',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir centro de custo',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  // Efeito para forçar refetch quando o componente montar
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do centro de custo',
        variant: 'destructive',
      });
      return;
    }

    const centroToSave = {
      ...(editingCentroCusto ? { id: editingCentroCusto.id } : {}),
      nome: novoNome.trim(),
      tipo: novoTipo
    };
    
    saveMutation.mutate(centroToSave);
  };

  const handleEdit = (centro: CentroCusto) => {
    setEditingCentroCusto(centro);
    setNovoNome(centro.nome);
    setNovoTipo(centro.tipo || 'Despesa');
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este centro de custo?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-dark">Novo Centro de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex-1">
              <Label htmlFor="nome-centro">Nome</Label>
              <Input
                id="nome-centro"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Administrativo"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="tipo-centro">Tipo</Label>
              <Select
                value={novoTipo}
                onValueChange={(value) => setNovoTipo(value as 'Despesa' | 'Receita')}
              >
                <SelectTrigger id="tipo-centro">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                  <SelectItem value="Receita">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-purple hover:bg-purple/90" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-purple-dark">Centros de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : isError ? (
            <div className="text-red-500">Erro ao carregar centros de custo.</div>
          ) : costCentersData && costCentersData.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
                <div className="col-span-6">Nome</div>
                <div className="col-span-4">Tipo</div>
                <div className="col-span-2"></div>
              </div>
              <ul className="divide-y">
                {costCentersData.map((centro: CentroCusto) => (
                  <li key={centro.id} className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors">
                    <div className="col-span-6 font-medium">{centro.nome}</div>
                    <div className="col-span-4">
                      <Badge className={`${centro.tipo === 'Receita' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                        {centro.tipo || 'Despesa'}
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
                          <DropdownMenuItem onClick={() => handleEdit(centro)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(centro.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>Nenhum centro de custo cadastrado.</div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Centro de Custo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome do centro de custo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tipo">Tipo</Label>
              <Select
                value={novoTipo}
                onValueChange={(value) => setNovoTipo(value as 'Despesa' | 'Receita')}
              >
                <SelectTrigger id="edit-tipo">
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
              setEditingCentroCusto(null);
              setNovoNome('');
              setNovoTipo('Despesa');
            }}>
              Cancelar
            </Button>
            <Button 
              className="bg-purple hover:bg-purple/90" 
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CentroCustos;
