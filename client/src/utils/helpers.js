import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return null;
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return null;
  return format(new Date(date), 'MMM d, yyyy HH:mm');
};

export const formatRelative = (date) => {
  if (!date) return null;
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getDueDateLabel = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isPast(d) && !isToday(d)) return { label: `Overdue · ${format(d, 'MMM d')}`, color: 'text-red-600' };
  if (isToday(d)) return { label: 'Due Today', color: 'text-orange-600' };
  if (isTomorrow(d)) return { label: 'Due Tomorrow', color: 'text-yellow-600' };
  return { label: `Due ${format(d, 'MMM d')}`, color: 'text-slate-500' };
};

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444', bgColor: '#fef2f2', textColor: '#dc2626', dot: '🔴' },
  high: { label: 'High', color: '#f97316', bgColor: '#fff7ed', textColor: '#ea580c', dot: '🟠' },
  medium: { label: 'Medium', color: '#eab308', bgColor: '#fefce8', textColor: '#ca8a04', dot: '🟡' },
  low: { label: 'Low', color: '#94a3b8', bgColor: '#f8fafc', textColor: '#64748b', dot: '⚪' },
};

export const STATUS_CONFIG = {
  todo: { label: 'To Do', color: '#64748b', icon: '○' },
  in_progress: { label: 'In Progress', color: '#3b82f6', icon: '◑' },
  completed: { label: 'Completed', color: '#16a34a', icon: '●' },
  cancelled: { label: 'Cancelled', color: '#94a3b8', icon: '✕' },
};

export const EFFORT_LABELS = [
  { value: 0.5, label: '30 min' },
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: 'Half day' },
  { value: 8, label: '1 day' },
  { value: 16, label: '2 days' },
  { value: 40, label: '1 week' },
];

export const PROJECT_COLORS = [
  '#16a34a', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899',
  '#06b6d4', '#84cc16', '#eab308', '#ef4444', '#64748b',
];

export const PROJECT_ICONS = ['📁', '🚀', '💡', '🎯', '🔧', '📊', '🎨', '📝', '🔬', '💼'];

export const scoreToColor = (score) => {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 30) return '#eab308';
  return '#94a3b8';
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');
