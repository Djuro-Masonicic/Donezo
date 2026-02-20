import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, tasksApi } from '../api';
import { useAppStore } from '../store/appStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { Spinner, EmptyState } from '../components/ui/Badges';
import { PriorityBadge, StatusBadge, ScoreBadge } from '../components/ui/Badges';
import {
  CheckSquare, TrendingUp, AlertTriangle, Clock, Plus, Sparkles,
  ArrowUpRight, Brain, FolderOpen, ChevronRight
} from 'lucide-react';
import { formatDate, getDueDateLabel, PRIORITY_CONFIG } from '../utils/helpers';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { openTaskModal, openNlpModal, openDailyPlan } = useAppStore();

  const { data: overview } = useQuery({ queryKey: ['analytics', 'overview'], queryFn: analyticsApi.getOverview });
  const { data: productivity = [] } = useQuery({ queryKey: ['analytics', 'productivity'], queryFn: () => analyticsApi.getProductivity(14) });
  const { data: overdue = [] } = useQuery({ queryKey: ['analytics', 'overdue'], queryFn: analyticsApi.getOverdue });
  const { data: upcoming = [] } = useQuery({ queryKey: ['analytics', 'upcoming'], queryFn: () => analyticsApi.getUpcoming(7) });
  const { data: completionRate } = useQuery({ queryKey: ['analytics', 'completion-rate'], queryFn: () => analyticsApi.getCompletionRate(30) });
  const { data: topTasks } = useQuery({
    queryKey: ['tasks', 'top'],
    queryFn: () => tasksApi.getAll({ sortBy: 'priorityScore', sortOrder: 'desc', limit: 5, status: 'todo' }),
  });

  const stats = [
    {
      label: 'Total Tasks',
      value: overview?.total || 0,
      icon: CheckSquare,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      sub: 'All tasks',
    },
    {
      label: 'In Progress',
      value: overview?.statusMap?.in_progress || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: 'Active now',
    },
    {
      label: 'Overdue',
      value: overdue.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      sub: 'Need attention',
      warn: overdue.length > 0,
    },
    {
      label: 'Completion Rate',
      value: `${completionRate?.rate || 0}%`,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: 'Last 30 days',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Plan, prioritize, and accomplish your tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openDailyPlan} className="btn-secondary">
            <Brain className="w-4 h-4 text-purple-500" /> Daily Plan
          </button>
          <button onClick={openNlpModal} className="btn-secondary">
            <Sparkles className="w-4 h-4 text-purple-500" /> AI Input
          </button>
          <button onClick={() => openTaskModal()} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className={`card ${s.warn ? 'border-red-200 bg-red-50/50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-0.5">{s.value}</div>
            <div className="text-sm font-medium text-slate-700">{s.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Productivity chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Task Completion Trend</h3>
            <span className="text-xs text-slate-400">Last 14 days</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={productivity}>
              <defs>
                <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => format(new Date(d), 'MMM d')} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(val) => [val, 'Tasks completed']}
                labelFormatter={l => format(new Date(l), 'MMM d, yyyy')}
              />
              <Area type="monotone" dataKey="count" stroke="#16a34a" fill="url(#green)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Status Breakdown</h3>
          {overview?.statusMap ? (
            <div className="space-y-2.5">
              {Object.entries(overview.statusMap).map(([status, count]) => {
                const total = overview.total || 1;
                const pct = Math.round((count / total) * 100);
                const colors = { todo: '#94a3b8', in_progress: '#3b82f6', completed: '#16a34a', cancelled: '#cbd5e1' };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[status] || '#94a3b8' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top priority tasks */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Top Priority Tasks</h3>
            <Link to="/tasks" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {topTasks?.tasks?.length > 0 ? (
            <div className="space-y-2">
              {topTasks.tasks.map(task => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState icon="🎯" title="No tasks yet" description="Create your first task to get started" />
          )}
        </div>

        {/* Upcoming + Overdue */}
        <div className="space-y-4">
          {/* Upcoming */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Due This Week</h3>
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map(t => {
                  const due = getDueDateLabel(t.dueDate);
                  return (
                    <div key={t._id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{
                        backgroundColor: t.priority === 'critical' ? '#ef4444' :
                          t.priority === 'high' ? '#f97316' : '#eab308'
                      }} />
                      <span className="text-xs text-slate-700 flex-1 truncate">{t.title}</span>
                      {due && <span className={`text-xs shrink-0 ${due.color}`}>{due.label}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">Nothing due this week 🎉</p>
            )}
          </div>

          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="card border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-red-700">Overdue ({overdue.length})</h3>
              </div>
              <div className="space-y-2">
                {overdue.slice(0, 4).map(t => (
                  <div key={t._id} className="flex items-center gap-2">
                    <span className="text-xs text-red-600 flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-red-500 shrink-0">{formatDate(t.dueDate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
