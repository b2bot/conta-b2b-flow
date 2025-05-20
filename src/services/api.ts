// src/services/api.ts

const API_BASE_URL = 'https://sistema.vksistemas.com.br/api';

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro na API');
  return data;
};

// --- CATEGORIAS ---
export const categoriesAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-categorias.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },
  save: async (categoria: { id?: string; name: string; tipo: string }) => {
    const res = await fetch(`${API_BASE_URL}/salvar-categoria.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },
  save: async (contato: any) => {
    const res = await fetch(`${API_BASE_URL}/salvar-contato.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },
  save: async (centro: { id?: string; nome: string }) => {
    const res = await fetch(`${API_BASE_URL}/salvar-centro-custo.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(centro),
    });
    return handleResponse(res);
  }
};
