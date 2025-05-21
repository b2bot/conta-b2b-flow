// src/services/api.ts

const API_BASE_URL = 'https://sistema.vksistemas.com.br/api';

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro na API');
  return data;
};

// Função utilitária para headers com Authorization
function getAuthHeaders() {
  // Busca o token dentro do objeto user salvo no localStorage
  let token = null;
  try {
    const user = localStorage.getItem('user');
    if (user) {
      token = JSON.parse(user).token;
    }
  } catch (e) {
    token = null;
  }
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// --- CATEGORIAS ---
export const categoriesAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-categorias.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  save: async (categoria: { id?: string; nome: string; tipo: string }) => {
    const res = await fetch(`${API_BASE_URL}/salvar-categoria.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoria),
    });
    return handleResponse(res);
  }
};

// --- CONTATOS ---
export const contactsAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-contatos.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  save: async (contato: any) => {
    const res = await fetch(`${API_BASE_URL}/salvar-contato.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contato),
    });
    return handleResponse(res);
  }
};

// --- CENTRO DE CUSTO ---
export const centrosAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-centro-custos.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  save: async (centro: { id?: string; nome: string }) => {
    const res = await fetch(`${API_BASE_URL}/salvar-centro-custo.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(centro),
    });
    return handleResponse(res);
  }
};

// --- TRANSAÇÕES ---
export const transactionsAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-transacoes.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  save: async (transaction: any) => {
    const res = await fetch(`${API_BASE_URL}/salvar-transacao.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transaction),
    });
    return handleResponse(res);
  }
};

// --- RECORRÊNCIAS ---
export const recurringAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-recorrencias.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  save: async (recorrencia: any) => {
    const res = await fetch(`${API_BASE_URL}/salvar-recorrencia.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(recorrencia),
    });
    return handleResponse(res);
  }
};

// --- AUTENTICAÇÃO ---
export const authAPI = {
  user: async () => {
    const res = await fetch(`${API_BASE_URL}/user.php`, {
      method: 'POST',
      headers: getAuthHeaders() // <-- Token vai aqui!
    });
    return handleResponse(res);
  },
  update: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/atualizar-perfil.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  login: async (data: any) => {
    // O login normalmente NÃO envia o token, só o JSON comum!
    const res = await fetch(`${API_BASE_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  logout: async () => {
    const res = await fetch(`${API_BASE_URL}/logout.php`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};

export const costCentersAPI = centrosAPI;
