import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../api';
import { useAppStore } from '../../store/appStore';
import { PriorityBadge, StatusBadge, ScoreBadge } from '../ui/Badges';
import { getDueDateLabel, STATUS_CONFIG } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { MoreHorizontal, Edit, Trash2, Calendar, Clock, CheckCircle } from 'lucide-react';

export const TaskCard = ({ task }) => {
  const qc = useQueryClient();
  const { openTaskModal } = useAppStore();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(task._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Task deleted');
    },
    onError: (e) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => tasksApi.updateStatus(task._id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const dueDateInfo = getDueDateLabel(task.dueDate);
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const nextStatus = () => {
    const order = ['todo', 'in_progress', 'completed'];
    const idx = order.indexOf(task.status);
    return order[Math.min(idx + 1, order.length - 1)];
  };

  return (
    <div className={`card hover:shadow-md transition-all duration-150 cursor-pointer group relative ${
      task.status === 'completed' ? 'opacity-60' : ''
    }`}>
      {/* Priority accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{
          backgroundColor: task.priority === 'critical' ? '#ef4444' :
            task.priority === 'high' ? '#f97316' :
            task.priority === 'medium' ? '#eab308' : '#e2e8f0'
        }}
      />

      <div className="pl-2">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <button
            onClick={() => statusMutation.mutate(nextStatus())}
            className="mt-0.5 shrink-0"
            title="Click to advance status"
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.status === 'completed'
                ? 'bg-primary-600 border-primary-600'
                : 'border-slate-300 hover:border-primary-500'
            }`}>
              {task.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium leading-snug ${
              task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ScoreBadge score={task.priorityScore} />
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="opacity-0 group-hover:opacity-100 btn-ghost p-1 rounded"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-6 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-[120px]"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => { openTaskModal(task); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { deleteMutation.mutate(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-1.5 mt-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />

          {task.project && (
            <span
              className="badge text-xs"
              style={{ backgroundColor: task.project.color + '22', color: task.project.color, border: `1px solid ${task.project.color}44` }}
            >
              {task.project.icon} {task.project.name}
            </span>
          )}

          {task.tags?.map(tag => (
            <span
              key={tag._id}
              className="badge"
              style={{ backgroundColor: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}44` }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {dueDateInfo && (
              <span className={`flex items-center gap-1 ${dueDateInfo.color}`}>
                <Calendar className="w-3 h-3" />
                {dueDateInfo.label}
              </span>
            )}
            {task.estimatedEffort && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedEffort}h
              </span>
            )}
          </div>

          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1 bg-slate-200 rounded-full">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
