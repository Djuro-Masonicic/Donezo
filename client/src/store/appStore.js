import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  // Active project filter
  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  // Task modal
  taskModalOpen: false,
  editingTask: null,
  openTaskModal: (task = null) => set({ taskModalOpen: true, editingTask: task }),
  closeTaskModal: () => set({ taskModalOpen: false, editingTask: null }),

  // NLP modal
  nlpModalOpen: false,
  openNlpModal: () => set({ nlpModalOpen: true }),
  closeNlpModal: () => set({ nlpModalOpen: false }),

  // Daily plan modal
  dailyPlanOpen: false,
  openDailyPlan: () => set({ dailyPlanOpen: true }),
  closeDailyPlan: () => set({ dailyPlanOpen: false }),

  // Project modal
  projectModalOpen: false,
  editingProject: null,
  openProjectModal: (project = null) => set({ projectModalOpen: true, editingProject: project }),
  closeProjectModal: () => set({ projectModalOpen: false, editingProject: null }),

  // Task filters
  taskFilters: {
    status: '',
    priority: '',
    project: '',
    sortBy: 'priorityScore',
    sortOrder: 'desc',
    search: '',
  },
  setTaskFilter: (key, value) =>
    set(s => ({ taskFilters: { ...s.taskFilters, [key]: value } })),
  resetTaskFilters: () =>
    set({ taskFilters: { status: '', priority: '', project: '', sortBy: 'priorityScore', sortOrder: 'desc', search: '' } }),
}));
