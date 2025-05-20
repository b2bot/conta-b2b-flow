
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
    console.log(`Making ${method} request to ${endpoint} with data:`, data);
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized by logging out
    if (response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    const responseData = await response.json();
    console.log(`Response from ${endpoint}:`, responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || `API request failed with status ${response.status}`);
    }
    
    return responseData as T;
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
      '/dados-usuario.php',
      'POST'
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
      '/listar-contatos.php',
      'POST'
    );
  },
  save: (contact: any) => {
    return apiRequest<{ success: boolean; contact: any }>(
      '/salvar-contato.php',
      'POST',
      contact
    );
  },
  delete: (id: string) => {
    return apiRequest<{ success: boolean }>(
      '/salvar-contato.php',
      'POST',
      { id, deleted: true }
    );
  }
};

// Transactions APIs
export const transactionsAPI = {
  list: () => {
    return apiRequest<{ success: boolean; transactions: any[] }>(
      '/listar-transacoes.php',
      'POST'
    );
  },
  save: (transaction: any) => {
    return apiRequest<{ success: boolean; transaction: any }>(
      '/salvar-transacao.php',
      'POST',
      transaction
    );
  },
  delete: (id: string) => {
    return apiRequest<{ success: boolean }>(
      '/salvar-transacao.php',
      'POST',
      { id, deleted: true }
    );
  }
};

// Recurring transactions APIs
export const recurringAPI = {
  list: () => {
    return apiRequest<{ success: boolean; recurrings: any[] }>(
      '/listar-recorrentes.php',
      'POST'
    );
  },
  save: (recurring: any) => {
    return apiRequest<{ success: boolean; recurring: any }>(
      '/salvar-recorrente.php',
      'POST',
      recurring
    );
  },
  delete: (id: string) => {
    return apiRequest<{ success: boolean }>(
      '/salvar-recorrente.php',
      'POST',
      { id, deleted: true }
    );
  }
};

// Categories APIs
export const categoriesAPI = {
  list: () => {
    return apiRequest<{ success: boolean; categories: any[] }>(
      '/listar-categorias.php',
      'POST'
    );
  },
  save: (category: any) => {
    return apiRequest<{ success: boolean; category: any }>(
      '/salvar-categoria.php',
      'POST',
      category
    );
  },
  delete: (id: string) => {
    return apiRequest<{ success: boolean }>(
      '/salvar-categoria.php',
      'POST',
      { id, deleted: true }
    );
  }
};

// Cost centers APIs
export const costCentersAPI = {
  list: () => {
    return apiRequest<{ success: boolean; costCenters: any[] }>(
      '/listar-centro-custos.php',
      'POST'
    );
  },
  save: (costCenter: any) => {
    return apiRequest<{ success: boolean; costCenter: any }>(
      '/salvar-centro-custo.php',
      'POST',
      costCenter
    );
  },
  delete: (id: string) => {
    return apiRequest<{ success: boolean }>(
      '/salvar-centro-custo.php',
      'POST',
      { id, deleted: true }
    );
  }
};
