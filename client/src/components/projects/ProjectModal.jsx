import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { projectsApi } from '../../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PROJECT_COLORS, PROJECT_ICONS } from '../../utils/helpers';

const defaultForm = { name: '', description: '', color: '#16a34a', icon: '📁', status: 'active', dueDate: '' };

export const ProjectModal = ({ open, onClose, project }) => {
  const qc = useQueryClient();
  const [form, setForm] = React.useState(defaultForm);

  React.useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        color: project.color || '#16a34a',
        icon: project.icon || '📁',
        status: project.status || 'active',
        dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [project, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) => project ? projectsApi.update(project._id, data) : projectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(project ? 'Project updated!' : 'Project created!');
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, dueDate: form.dueDate || null });
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Edit Project' : 'New Project'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Project name" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        {/* Icon picker */}
        <div>
          <label className="label">Icon</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => set('icon', icon)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${form.icon === icon ? 'bg-primary-100 ring-2 ring-primary-400' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : project ? 'Update' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
