import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    const error = new Error(message);
    error.status = status;
    // Mark DB-down errors so queries don't retry endlessly
    if (status === 503 || status === 500) error.dbDown = true;
    return Promise.reject(error);
  }
);

// Tasks
export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }).then(r => r.data),
  getById: (id) => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }).then(r => r.data),
  updateSubtask: (id, subtaskId, completed) =>
    api.patch(`/tasks/${id}/subtasks/${subtaskId}`, { completed }).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
  bulkUpdate: (ids, update) => api.post('/tasks/bulk-update', { ids, update }).then(r => r.data),
};

// Projects
export const projectsApi = {
  getAll: () => api.get('/projects').then(r => r.data),
  getById: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then(r => r.data),
};

// Tags
export const tagsApi = {
  getAll: () => api.get('/tags').then(r => r.data),
  create: (data) => api.post('/tags', data).then(r => r.data),
  update: (id, data) => api.put(`/tags/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tags/${id}`).then(r => r.data),
};

// Analytics
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview').then(r => r.data),
  getProductivity: (days = 30) => api.get('/analytics/productivity', { params: { days } }).then(r => r.data),
  getOverdue: () => api.get('/analytics/overdue').then(r => r.data),
  getUpcoming: (days = 7) => api.get('/analytics/upcoming', { params: { days } }).then(r => r.data),
  getCompletionRate: (days = 30) => api.get('/analytics/completion-rate', { params: { days } }).then(r => r.data),
};

// AI
export const aiApi = {
  parse: (input) => api.post('/ai/parse', { input }).then(r => r.data),
  suggest: (taskId, apply = false) => api.post(`/ai/suggest/${taskId}`, { apply }).then(r => r.data),
  dailyPlan: () => api.get('/ai/daily-plan').then(r => r.data),
};

export default api;
