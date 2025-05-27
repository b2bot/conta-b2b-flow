import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { categoriesAPI, contactsAPI } from '@/services/api';

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
  }
};

export interface Receita {
  id: string;
  data: string;
  codigo: string;
  cliente: string;
  servico: string;
  plano: string;
  plano_id?: string;
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
  plano_id?: string;
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
  const [filterServico, setFilterServico] = useState('all');
  const [filterPlano, setFilterPlano] = useState('all');
  const [filterModeloCobranca, setFilterModeloCobranca] = useState('all');
  
  const [receitas, setReceitas] = useState<Receita[]>([
    {
      id: '1',
      data: '2025-05-05',
      codigo: 'CL169',
      cliente: 'Ultra Eventos Ltda',
      servico: 'Hospedagem E Co',
      plano: 'Cloud Hosting',
      plano_id: '1',
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
      plano_id: '1',
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
      plano_id: '1',
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
      plano_id: '1',
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

  // Fetch planos for dropdown
  const { data: planos = [] } = useQuery({
    queryKey: ['planos'],
    queryFn: async () => {
      const response = await planosAPI.list();
      return response.status === 'success' ? response.planos : [];
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
        plano_id: receita.plano_id,
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

  // Delete receita mutation
  const deleteReceitaMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulate API call - in real implementation, this would call an API
      setReceitas(prev => prev.filter(r => r.id !== id));
      return { status: 'success' };
    },
    onSuccess: () => {
      toast({
        title: "Receita excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir receita",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get unique services for filter
  const servicos = useMemo(() => {
    const uniqueServicos = new Set(receitas.map(r => r.servico));
    return Array.from(uniqueServicos);
  }, [receitas]);

  // Get unique modelos de cobrança for filter
  const modelosCobranca = useMemo(() => {
    const uniqueModelos = new Set(receitas.map(r => r.modeloCobranca));
    return Array.from(uniqueModelos);
  }, [receitas]);

  // Filter receitas
  const filteredReceitas = useMemo(() => {
    return receitas.filter(receita => {
      const matchesSearch = receita.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           receita.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           receita.servico.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || receita.status === filterStatus;
      const matchesTipo = filterTipo === 'all' || receita.tipo === filterTipo;
      const matchesServico = filterServico === 'all' || receita.servico === filterServico;
      const matchesPlano = filterPlano === 'all' || receita.plano === filterPlano;
      const matchesModeloCobranca = filterModeloCobranca === 'all' || receita.modeloCobranca === filterModeloCobranca;
      
      return matchesSearch && matchesStatus && matchesTipo && matchesServico && matchesPlano && matchesModeloCobranca;
    });
  }, [receitas, searchTerm, filterStatus, filterTipo, filterServico, filterPlano, filterModeloCobranca]);

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

  // Duplicate receita function
  const duplicateReceita = (receita: Receita) => {
    const duplicatedReceita: ReceitaForm = {
      data: new Date(),
      codigo: receita.codigo,
      contato_id: receita.contato_id || '',
      servico: receita.servico,
      plano: receita.plano,
      plano_id: receita.plano_id,
      categoria_id: receita.categoria_id || '',
      valor: receita.valor.toString(),
      tipo: receita.tipo,
      modeloCobranca: receita.modeloCobranca,
      status: 'A receber', // Reset status to 'A receber'
      entregasPrincipais: receita.entregasPrincipais
    };
    
    return duplicatedReceita;
  };

  return {
    receitas: filteredReceitas,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterTipo,
    setFilterTipo,
    filterServico,
    setFilterServico,
    filterPlano,
    setFilterPlano,
    filterModeloCobranca,
    setFilterModeloCobranca,
    categories,
    contacts,
    planos,
    servicos,
    modelosCobranca,
    financialSummary,
    saveReceitaMutation,
    deleteReceitaMutation,
    duplicateReceita
  };
};
