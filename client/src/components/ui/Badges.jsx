import React from 'react';
import { cn } from '../../utils/helpers';

export const PriorityBadge = ({ priority }) => {
  const map = {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };
  const labels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
  return (
    <span className={cn('badge', map[priority] || 'priority-low')}>
      {labels[priority] || priority}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    todo: 'status-todo',
    in_progress: 'status-in_progress',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  };
  const labels = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
  return (
    <span className={cn('badge', map[status] || 'status-todo')}>
      {labels[status] || status}
    </span>
  );
};

export const ScoreBadge = ({ score }) => {
  const color = score >= 70 ? 'bg-red-100 text-red-700' :
    score >= 50 ? 'bg-orange-100 text-orange-700' :
    score >= 30 ? 'bg-yellow-100 text-yellow-700' :
    'bg-slate-100 text-slate-600';
  return (
    <span className={cn('badge font-mono', color)}>
      {score}
    </span>
  );
};

export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return (
    <svg className={cn('animate-spin text-primary-600', s)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
};

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-4 max-w-xs">{description}</p>
    {action}
  </div>
);
