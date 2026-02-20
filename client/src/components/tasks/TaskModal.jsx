import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tasksApi, projectsApi, tagsApi } from '../../api';
import { useAppStore } from '../../store/appStore';
import { Modal } from '../ui/Modal';
import { EFFORT_LABELS, PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { Sparkles, Plus, Trash2, CheckCircle } from 'lucide-react';
import { aiApi } from '../../api';
import { format } from 'date-fns';

const defaultForm = {
  title: '',
  description: '',
  project: '',
  tags: [],
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  estimatedEffort: 1,
  urgency: 5,
  importance: 5,
  notes: '',
  subtasks: [],
};

export const TaskModal = ({ open, onClose, task }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [newSubtask, setNewSubtask] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll });
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        project: task.project?._id || task.project || '',
        tags: (task.tags || []).map(t => t._id || t),
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        estimatedEffort: task.estimatedEffort || 1,
        urgency: task.urgency || 5,
        importance: task.importance || 5,
        notes: task.notes || '',
        subtasks: task.subtasks || [],
      });
    } else {
      setForm(defaultForm);
    }
    setAiSuggestion(null);
  }, [task, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const createMutation = useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Task created!');
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => tasksApi.update(task._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Task updated!');
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      project: form.project || null,
      tags: form.tags,
      urgency: Number(form.urgency),
      importance: Number(form.importance),
      estimatedEffort: Number(form.estimatedEffort),
    };
    if (task) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const handleAiSuggest = async () => {
    if (!task?._id) return;
    setAiLoading(true);
    try {
      const s = await aiApi.suggest(task._id, false);
      setAiSuggestion(s);
    } catch (e) {
      toast.error('AI suggestion failed: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setForm(f => ({
      ...f,
      priority: aiSuggestion.priority || f.priority,
      urgency: aiSuggestion.urgency || f.urgency,
      importance: aiSuggestion.importance || f.importance,
    }));
    setAiSuggestion(null);
    toast.success('AI suggestions applied!');
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    set('subtasks', [...form.subtasks, { title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (idx) => set('subtasks', form.subtasks.filter((_, i) => i !== idx));

  const toggleTag = (tagId) => {
    set('tags', form.tags.includes(tagId)
      ? form.tags.filter(t => t !== tagId)
      : [...form.tags, tagId]
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'New Task'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Optional details..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {/* Row: Status + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row: Due Date + Effort */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Estimated Effort</label>
            <select className="input" value={form.estimatedEffort} onChange={e => set('estimatedEffort', e.target.value)}>
              {EFFORT_LABELS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Urgency + Importance sliders */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Urgency: <span className="text-primary-600 font-semibold">{form.urgency}</span>/10</label>
            <input type="range" min="1" max="10" value={form.urgency}
              onChange={e => set('urgency', e.target.value)}
              className="w-full accent-primary-600"
            />
          </div>
          <div>
            <label className="label">Importance: <span className="text-primary-600 font-semibold">{form.importance}</span>/10</label>
            <input type="range" min="1" max="10" value={form.importance}
              onChange={e => set('importance', e.target.value)}
              className="w-full accent-primary-600"
            />
          </div>
        </div>

        {/* Project */}
        <div>
          <label className="label">Project</label>
          <select className="input" value={form.project} onChange={e => set('project', e.target.value)}>
            <option value="">No Project</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.icon} {p.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => toggleTag(t._id)}
                  className={`badge cursor-pointer transition-colors ${
                    form.tags.includes(t._id)
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                  style={form.tags.includes(t._id) ? { backgroundColor: t.color + '22', color: t.color, borderColor: t.color + '44' } : {}}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks */}
        <div>
          <label className="label">Subtasks</label>
          <div className="space-y-1.5 mb-2">
            {form.subtasks.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <CheckCircle className={`w-4 h-4 ${st.completed ? 'text-primary-600' : 'text-slate-300'}`} />
                <span className={`flex-1 text-sm ${st.completed ? 'line-through text-slate-400' : ''}`}>{st.title}</span>
                <button type="button" onClick={() => removeSubtask(idx)}>
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
            />
            <button type="button" onClick={addSubtask} className="btn-secondary shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} value={form.notes}
            onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
        </div>

        {/* AI Suggestion */}
        {task && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">AI Priority Advisor</span>
            </div>
            {aiSuggestion ? (
              <div>
                <p className="text-xs text-purple-700 mb-2">{aiSuggestion.reasoning}</p>
                <div className="flex items-center gap-2 text-xs text-purple-600 mb-2">
                  <span>Priority: <b>{aiSuggestion.priority}</b></span>
                  <span>Urgency: <b>{aiSuggestion.urgency}</b></span>
                  <span>Importance: <b>{aiSuggestion.importance}</b></span>
                </div>
                <button type="button" onClick={applyAiSuggestion} className="text-xs btn-primary py-1 bg-purple-600 hover:bg-purple-700">
                  Apply Suggestions
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="text-xs btn-ghost text-purple-700 hover:bg-purple-100 py-1"
              >
                {aiLoading ? 'Analyzing...' : 'Get AI Priority Suggestion'}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
