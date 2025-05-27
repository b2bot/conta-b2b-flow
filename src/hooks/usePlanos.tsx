// src/hooks/usePlanos.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { planosAPI } from '@/services/api';

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  criado_em?: string;
}

export interface PlanoForm {
  id?: string;
  nome: string;
  descricao: string;
  ativo?: boolean;
}

export const usePlanos = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: planos = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['planos'],
    queryFn: async () => {
      const response = await planosAPI.list();
      if (response.status === 'success') return response.planos;
      throw new Error(response.message || 'Erro ao buscar planos');
    }
  });

  const savePlanoMutation = useMutation({
    mutationFn: async (plano: PlanoForm) => {
      return await planosAPI.save(plano);
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({ title: 'Plano salvo com sucesso' });
        queryClient.invalidateQueries({ queryKey: ['planos'] });
      } else {
        toast({
          title: 'Erro ao salvar plano',
          description: data.message || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar plano',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  const deletePlanoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await planosAPI.delete(id);
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({ title: 'Plano excluído com sucesso' });
        queryClient.invalidateQueries({ queryKey: ['planos'] });
      } else {
        toast({
          title: 'Erro ao excluir plano',
          description: data.message || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir plano',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  return {
    planos,
    isLoading,
    isError,
    refetch,
    savePlanoMutation,
    deletePlanoMutation,
  };
};
