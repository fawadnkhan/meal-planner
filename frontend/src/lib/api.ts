import axios, { AxiosError } from 'axios';

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const defaultBaseUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://meal-planner-api-82e5.onrender.com/api'
    : 'http://localhost:4000/api';
const BASE_URL = (configuredBaseUrl || defaultBaseUrl).replace(/\/$/, '').endsWith('/api')
  ? (configuredBaseUrl || defaultBaseUrl).replace(/\/$/, '')
  : `${(configuredBaseUrl || defaultBaseUrl).replace(/\/$/, '')}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Recipes ───────────────────────────────────────────────────────────────────

export const recipesApi = {
  list: () => api.get('/recipes'),
  get: (id: string) => api.get(`/recipes/${id}`),
  create: (data: unknown) => api.post('/recipes', data),
  update: (id: string, data: unknown) => api.put(`/recipes/${id}`, data),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  export: (id: string) => api.get(`/recipes/${id}/export`),
  import: (data: unknown) => api.post('/recipes/import', data),
};

// ── Ingredients ───────────────────────────────────────────────────────────────

export const ingredientsApi = {
  search: (query: string) => api.get(`/ingredients?search=${encodeURIComponent(query)}`),
};

// ── Meal Plans ────────────────────────────────────────────────────────────────

export const mealPlansApi = {
  list: () => api.get('/meal-plans'),
  get: (id: string) => api.get(`/meal-plans/${id}`),
  create: (data: { name: string; weekStart: string }) => api.post('/meal-plans', data),
  update: (id: string, data: { name?: string; weekStart?: string }) =>
    api.put(`/meal-plans/${id}`, data),
  delete: (id: string) => api.delete(`/meal-plans/${id}`),
  addItem: (id: string, data: { recipeId: string; dayOfWeek: number; mealType: string; servings: number }) =>
    api.post(`/meal-plans/${id}/items`, data),
  updateItem: (id: string, itemId: string, data: Partial<{ recipeId: string; dayOfWeek: number; mealType: string; servings: number }>) =>
    api.put(`/meal-plans/${id}/items/${itemId}`, data),
  removeItem: (id: string, itemId: string) =>
    api.delete(`/meal-plans/${id}/items/${itemId}`),
};

// ── Shopping List ─────────────────────────────────────────────────────────────

export const shoppingListApi = {
  get: (mealPlanId: string) => api.get(`/shopping-list/${mealPlanId}`),
};
