import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { costCentersAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const CentroCustos = () => {
  const [novoNome, setNovoNome] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Busca centros de custo
  const { data: costCentersData, isLoading, isError } = useQuery({
    queryKey: ['costCenters'],
    queryFn: async () => {
      const response = await costCentersAPI.list();
      // ATENÇÃO: Tem que bater com o backend!
      // Se no PHP está "centros_custo", mantenha aqui!
      return response.status === 'success' ? response.centros_custo : [];
    },
  });

  // Adiciona novo centro de custo
  const mutation = useMutation({
    mutationFn: async (novo: { nome: string }) => costCentersAPI.save(novo),
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({ title: 'Centro de custo criado com sucesso!' });
        setNovoNome('');
        queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      } else {
        toast({
          title: 'Erro ao criar centro de custo',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar centro de custo',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

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
    mutation.mutate({ nome: novoNome.trim() });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-dark">Novo Centro de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
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
            <Button type="submit" className="bg-purple hover:bg-purple/90" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
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
            <ul className="divide-y">
              {costCentersData.map((centro: any) => (
                <li key={centro.id} className="py-2 flex items-center">
                  <span className="flex-1">{centro.nome}</span>
                  {/* Se quiser, pode colocar botões de editar/excluir aqui */}
                </li>
              ))}
            </ul>
          ) : (
            <div>Nenhum centro de custo cadastrado.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CentroCustos;
