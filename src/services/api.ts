
/**
 * API Service
 * Centralizes all API calls to the PHP backend
 */

const API_BASE_URL = 'https://vksistemas.com.br/api';

// Helper to get the authentication token
export const getAuthToken = (): string | null => {
  const user = localStorage.getItem('user');
  if (!user) return null;
  
  try {
    const userData = JSON.parse(user);
    return userData.token || null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Generic API request function
const apiRequest = async <T>(
  endpoint: string, 
  method: 'GET' | 'POST' = 'GET', 
  data?: any
): Promise<T> => {
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
    credentials: 'include',
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    console.log(`Making ${method} request to ${endpoint}`);
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized by logging out
    if (response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    return result as T;
  } catch (error) {
    console.error(`Error in ${method} request to ${endpoint}:`, error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  login: (email: string, password: string) => {
    return apiRequest<{ success: boolean; user: any; token: string }>(
      '/login.php',
      'POST',
      { email, password }
    );
  },
  getUserProfile: () => {
    return apiRequest<{ success: boolean; user: any }>(
      '/dados-usuario.php'
    );
  },
  updateUserProfile: (userData: any) => {
    return apiRequest<{ success: boolean; user: any }>(
      '/atualizar-usuario.php',
      'POST',
      userData
    );
  }
};

// Contacts APIs
export const contactsAPI = {
  list: () => {
    return apiRequest<{ success: boolean; contacts: any[] }>(
      '/listar-contatos.php'
    );
  },
  save: (contact: any) => {
    return apiRequest<{ success: boolean; contact: any }>(
      '/salvar-contato.php',
      'POST',
      contact
    );
  }
};

// Transactions APIs
export const transactionsAPI = {
  list: () => {
    return apiRequest<{ success: boolean; transactions: any[] }>(
      '/listar-transacoes.php'
    );
  },
  save: (transaction: any) => {
    return apiRequest<{ success: boolean; transaction: any }>(
      '/salvar-transacao.php',
      'POST',
      transaction
    );
  }
};

// Recurring transactions APIs
export const recurringAPI = {
  list: () => {
    return apiRequest<{ success: boolean; recurrings: any[] }>(
      '/listar-recorrentes.php'
    );
  },
  save: (recurring: any) => {
    return apiRequest<{ success: boolean; recurring: any }>(
      '/salvar-recorrente.php',
      'POST',
      recurring
    );
  }
};

// Categories APIs
export const categoriesAPI = {
  list: () => {
    return apiRequest<{ success: boolean; categories: any[] }>(
      '/listar-categorias.php'
    );
  },
  save: (category: any) => {
    return apiRequest<{ success: boolean; category: any }>(
      '/salvar-categoria.php',
      'POST',
      category
    );
  }
};

// Cost centers APIs
export const costCentersAPI = {
  list: () => {
    return apiRequest<{ success: boolean; costCenters: any[] }>(
      '/listar-centro-custos.php'
    );
  },
  save: (costCenter: any) => {
    return apiRequest<{ success: boolean; costCenter: any }>(
      '/salvar-centro-custo.php',
      'POST',
      costCenter
    );
  }
};
