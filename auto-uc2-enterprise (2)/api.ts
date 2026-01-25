
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

interface RequestOptions extends RequestInit {
  data?: any;
}

export const api = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { data, ...customConfig } = options;
    const token = localStorage.getItem('auto_uc2_token');
    
    const isFormData = data instanceof FormData || (data && typeof data.append === 'function');
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method: options.method || (data ? 'POST' : 'GET'),
      ...customConfig,
      headers: {
        ...headers,
        ...customConfig.headers,
      },
    };

    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    const text = await response.text();
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error('Erreur serveur: Réponse invalide (non-JSON)');
    }

    if (!response.ok) {
      throw new Error(result.message || `Erreur ${response.status}`);
    }

    return result;
  },

  get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  },

  put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  },

  delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
