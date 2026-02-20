import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { tasksApi, projectsApi, tagsApi } from '../api';
import { useAppStore } from '../store/appStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { Spinner, EmptyState } from '../components/ui/Badges';
import {
  Plus, Filter, SortAsc, SortDesc, Search, X, Sparkles,
  LayoutGrid, List, FolderOpen, CheckCircle
} from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../utils/helpers';
import toast from 'react-hot-toast';

export const TasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openTaskModal, openNlpModal, taskFilters, setTaskFilter, resetTaskFilters } = useAppStore();
  const [viewMode, setViewMode] = useState('grid');
  const qc = useQueryClient();

  // Sync URL project param to store
  useEffect(() => {
    const urlProject = searchParams.get('project');
    if (urlProject) setTaskFilter('project', urlProject);
  }, []);

  const filters = {
    ...(taskFilters.status && { status: taskFilters.status }),
    ...(taskFilters.priority && { priority: taskFilters.priority }),
    ...(taskFilters.project && { project: taskFilters.project }),
    ...(taskFilters.search && { search: taskFilters.search }),
    sortBy: taskFilters.sortBy,
    sortOrder: taskFilters.sortOrder,
    limit: 100,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.getAll(filters),
    keepPreviousData: true,
  });

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll });
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll });

  const tasks = data?.tasks || [];
  const total = data?.total || 0;
  const activeFiltersCount = [taskFilters.status, taskFilters.priority, taskFilters.project, taskFilters.search].filter(Boolean).length;

  const sortOptions = [
    { value: 'priorityScore', label: 'Priority Score' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'createdAt', label: 'Created' },
    { value: 'title', label: 'Title' },
    { value: 'urgency', label: 'Urgency' },
    { value: 'importance', label: 'Importance' },
  ];

  const selectedProject = projects.find(p => p._id === taskFilters.project);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            {selectedProject && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedProject.color }}
              />
            )}
            <h1 className="text-2xl font-bold text-slate-800">
              {selectedProject ? selectedProject.name : 'All Tasks'}
            </h1>
            {total > 0 && <span className="badge bg-slate-100 text-slate-600 border border-slate-200">{total}</span>}
          </div>
          {selectedProject?.description && (
            <p className="text-sm text-slate-500 mt-0.5">{selectedProject.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={openNlpModal} className="btn-secondary">
            <Sparkles className="w-4 h-4 text-purple-500" /> AI Input
          </button>
          <button onClick={() => openTaskModal()} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            className="input pl-8 py-1.5 text-sm"
            placeholder="Search tasks..."
            value={taskFilters.search}
            onChange={e => setTaskFilter('search', e.target.value)}
          />
        </div>

        {/* Status */}
        <select
          className="input w-auto py-1.5 text-sm"
          value={taskFilters.status}
          onChange={e => setTaskFilter('status', e.target.value)}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Priority */}
        <select
          className="input w-auto py-1.5 text-sm"
          value={taskFilters.priority}
          onChange={e => setTaskFilter('priority', e.target.value)}
        >
          <option value="">All Priority</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Project */}
        <select
          className="input w-auto py-1.5 text-sm"
          value={taskFilters.project}
          onChange={e => setTaskFilter('project', e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.icon} {p.name}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <select
            className="input w-auto py-1.5 text-sm"
            value={taskFilters.sortBy}
            onChange={e => setTaskFilter('sortBy', e.target.value)}
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setTaskFilter('sortOrder', taskFilters.sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn-secondary py-1.5 px-2"
          >
            {taskFilters.sortOrder === 'desc'
              ? <SortDesc className="w-4 h-4" />
              : <SortAsc className="w-4 h-4" />
            }
          </button>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <button onClick={resetTaskFilters} className="btn-ghost py-1.5 text-red-500 hover:bg-red-50 hover:text-red-600">
            <X className="w-3.5 h-3.5" /> Clear ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Tasks grid/list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No tasks found"
          description={activeFiltersCount > 0 ? 'Try adjusting your filters' : 'Create your first task to get started'}
          action={
            <button onClick={() => openTaskModal()} className="btn-primary">
              <Plus className="w-4 h-4" /> New Task
            </button>
          }
        />
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
            : 'space-y-2'
        }>
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
