/**
 * API Service
 * Centraliza todas as chamadas à API PHP backend
 */

const API_BASE_URL = 'https://sistema.vksistemas.com.br/api/';

// Helper para obter o token de autenticação
export const getAuthToken = (): string | null => {
  const user = localStorage.getItem('user');
  if (!user) return null;

  try {
    const userData = JSON.parse(user);
    return userData.token || null;
  } catch (error) {
    console.error('Erro ao interpretar dados do usuário:', error);
    return null;
  }
};

// Função genérica para requisições à API
export const apiRequest = async <T>({
  endpoint,
  method = 'GET',
  data,
}: {
  endpoint: string;
  method?: 'GET' | 'POST';
  data?: any;
}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    mode: 'cors',
    body: method === 'POST' ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(url, options);

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      throw new Error(result.message || `Erro ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`Erro ao acessar ${endpoint}:`, error);
    throw error;
  }
};

// ✅ API específica para cada módulo:

export const transactionsAPI = {
  list: () => apiRequest({ endpoint: 'listar-transacoes.php', method: 'POST' }),
  save: (data: any) => apiRequest({ endpoint: 'salvar-transacao.php', method: 'POST', data }),
};

export const recurringAPI = {
  list: () => apiRequest({ endpoint: 'listar-recorrentes.php', method: 'POST' }),
  save: (data: any) => apiRequest({ endpoint: 'salvar-recorrente.php', method: 'POST', data }),
};

export const categoriesAPI = {
  list: () => apiRequest({ endpoint: 'listar-categorias.php', method: 'POST' }),
  save: (data: any) => apiRequest({ endpoint: 'salvar-categoria.php', method: 'POST', data }),
};

export const centerCostsAPI = {
  list: () => apiRequest({ endpoint: 'listar-centro-custos.php', method: 'POST' }),
  save: (data: any) => apiRequest({ endpoint: 'salvar-centro-custo.php', method: 'POST', data }),
};

// ✅ Correção final duplicada (você pode escolher manter apenas uma das duas abaixo se quiser):
export const costCentersAPI = {
  list: () => apiRequest({ endpoint: 'listar-centro-custos.php', method: 'POST' }),
  save: (data: any) => apiRequest({ endpoint: 'salvar-centro-custo.php', method: 'POST', data }),
};

export const contactsAPI = {
  list: () => apiRequest({ endpoint: 'listar-contatos.php', method: 'POST' }),
  save: (data: any) => apiRequest({ endpoint: 'salvar-contato.php', method: 'POST', data }),
};

export const authAPI = {
  login: async (data: { email: string; senha: string }) => {
    const result = await apiRequest<{ status: string; user?: any; message?: string }>({
      endpoint: 'login.php',
      method: 'POST',
      data,
    });

    if (result.status !== 'success') {
      throw new Error(result.message || 'Erro ao fazer login');
    }

    return result.user;
  },

  user: () => apiRequest({ endpoint: 'dados-usuario.php', method: 'POST' }),

  update: (data: any) => apiRequest({ endpoint: 'atualizar-usuario.php', method: 'POST', data }),
};
