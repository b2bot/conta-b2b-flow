
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { categoriesAPI, contactsAPI } from '@/services/api';

export interface Receita {
  id: string;
  data: string;
  codigo: string;
  cliente: string;
  servico: string;
  plano: string;
  categoriaServico: string;
  valor: number;
  tipo: string;
  modeloCobranca: string;
  status: string;
  entregasPrincipais: string;
  categoria_id?: string;
  contato_id?: string;
}

export interface ReceitaForm {
  id?: string;
  data: Date;
  codigo: string;
  contato_id: string;
  servico: string;
  plano: string;
  categoria_id: string;
  valor: string;
  tipo: string;
  modeloCobranca: string;
  status: string;
  entregasPrincipais: string;
}

export const useReceitas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [receitas, setReceitas] = useState<Receita[]>([
    {
      id: '1',
      data: '2025-05-05',
      codigo: 'CL169',
      cliente: 'Ultra Eventos Ltda',
      servico: 'Hospedagem E Co',
      plano: 'Cloud Hosting',
      categoriaServico: 'E-com Essencia',
      valor: 250.00,
      tipo: 'Receita',
      modeloCobranca: 'Assinatura',
      status: 'A receber',
      entregasPrincipais: 'Hosting compartilhado; SSL; bac'
    },
    {
      id: '2',
      data: '2025-05-05',
      codigo: 'CL169',
      cliente: 'Ultra Eventos Ltda',
      servico: 'Manutenção de P',
      plano: 'Cloud Hosting',
      categoriaServico: '',
      valor: 24.90,
      tipo: 'Receita',
      modeloCobranca: 'Assinatura',
      status: 'A receber',
      entregasPrincipais: 'Manutenção WordPress; update'
    },
    {
      id: '3',
      data: '2025-05-05',
      codigo: 'CL150',
      cliente: 'Bioquality Date Clini',
      servico: 'Hospedagem/Ma',
      plano: 'Cloud Hosting',
      categoriaServico: 'Web Essencial',
      valor: 89.90,
      tipo: 'Receita',
      modeloCobranca: 'Assinatura',
      status: 'Recebido',
      entregasPrincipais: 'Manutenção WordPress; update'
    },
    {
      id: '4',
      data: '2025-05-05',
      codigo: 'CL150',
      cliente: 'Bioquality Date Clini',
      servico: 'Manutenção de P',
      plano: 'Cloud Hosting',
      categoriaServico: '',
      valor: 24.90,
      tipo: 'Receita',
      modeloCobranca: 'Fee Mensal',
      status: 'Recebido',
      entregasPrincipais: 'SEO Essencial + 4 artigos de blo'
    }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.list();
      return response.status === 'success' ? response.categorias : [];
    }
  });

  // Fetch contacts for dropdown
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await contactsAPI.list();
      return response.status === 'success' ? response.contatos : [];
    }
  });

  // Save receita mutation
  const saveReceitaMutation = useMutation({
    mutationFn: async (receita: ReceitaForm) => {
      // Simulate API call - in real implementation, this would call an API
      const newReceita: Receita = {
        id: receita.id || (receitas.length + 1).toString(),
        data: format(receita.data, 'yyyy-MM-dd'),
        codigo: receita.codigo,
        cliente: contacts.find(c => c.id === receita.contato_id)?.nome || '',
        servico: receita.servico,
        plano: receita.plano,
        categoriaServico: categories.find(c => c.id === receita.categoria_id)?.nome || '',
        valor: parseFloat(receita.valor.replace(',', '.')),
        tipo: receita.tipo,
        modeloCobranca: receita.modeloCobranca,
        status: receita.status,
        entregasPrincipais: receita.entregasPrincipais,
        categoria_id: receita.categoria_id,
        contato_id: receita.contato_id
      };

      if (receita.id) {
        // Update existing
        setReceitas(prev => prev.map(r => r.id === receita.id ? newReceita : r));
      } else {
        // Add new
        setReceitas(prev => [...prev, newReceita]);
      }

      return { status: 'success' };
    },
    onSuccess: () => {
      toast({
        title: "Receita salva com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar receita",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter receitas
  const filteredReceitas = useMemo(() => {
    return receitas.filter(receita => {
      const matchesSearch = receita.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           receita.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           receita.servico.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || receita.status === filterStatus;
      const matchesTipo = filterTipo === 'all' || receita.tipo === filterTipo;
      
      return matchesSearch && matchesStatus && matchesTipo;
    });
  }, [receitas, searchTerm, filterStatus, filterTipo]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    const recebido = filteredReceitas
      .filter(r => r.status === 'Recebido')
      .reduce((sum, r) => sum + r.valor, 0);
    
    const aReceber = filteredReceitas
      .filter(r => r.status === 'A receber')
      .reduce((sum, r) => sum + r.valor, 0);
    
    return {
      recebido,
      aReceber,
      total: recebido + aReceber,
      lucro: recebido // Simplified calculation
    };
  }, [filteredReceitas]);

  return {
    receitas: filteredReceitas,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterTipo,
    setFilterTipo,
    categories,
    contacts,
    financialSummary,
    saveReceitaMutation
  };
};
