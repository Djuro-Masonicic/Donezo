import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { aiApi, tasksApi } from '../../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sparkles, Wand2 } from 'lucide-react';
import { PriorityBadge } from '../ui/Badges';
import { format } from 'date-fns';

export const NlpModal = ({ open, onClose }) => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Task created from AI input!');
      setInput('');
      setParsed(null);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleParse = async () => {
    if (!input.trim()) return;
    setParsing(true);
    try {
      const result = await aiApi.parse(input);
      setParsed(result);
    } catch (e) {
      toast.error('AI parsing failed: ' + e.message);
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = () => {
    if (!parsed) return;
    createMutation.mutate({
      title: parsed.title,
      description: parsed.description || '',
      dueDate: parsed.dueDate || null,
      priority: parsed.priority || 'medium',
      urgency: parsed.urgency || 5,
      importance: parsed.importance || 5,
      estimatedEffort: parsed.estimatedEffort || 1,
      naturalLanguageInput: input,
    });
  };

  const examples = [
    'Finish quarterly report by this Friday, high priority, about 3 hours',
    'Quick 15 min standup prep tomorrow morning',
    'Review and merge 3 PRs before end of day, urgent',
    'Update project documentation, low priority, next week',
  ];

  return (
    <Modal open={open} onClose={() => { onClose(); setParsed(null); setInput(''); }} title="AI Natural Language Input" size="md">
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-purple-50 to-primary-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-slate-800">Describe your task naturally</span>
          </div>
          <p className="text-sm text-slate-600">
            Type your task in plain English — include deadlines, priority hints, and effort estimates.
          </p>
        </div>

        <div>
          <label className="label">Task Description</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder='e.g. "Write blog post about AI by next Monday, important, around 4 hours"'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleParse(); }}
          />
          <p className="text-xs text-slate-400 mt-1">Ctrl+Enter to parse</p>
        </div>

        {/* Examples */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">Examples:</p>
          <div className="flex flex-col gap-1">
            {examples.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(ex)}
                className="text-left text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg transition-colors"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

        {/* Parsed result */}
        {parsed && (
          <div className="bg-white border border-primary-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">AI Parsed Result</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Title</span>
                <span className="text-sm font-medium text-slate-800 max-w-xs text-right">{parsed.title}</span>
              </div>
              {parsed.description && (
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Description</span>
                  <span className="text-sm text-slate-700 max-w-xs text-right">{parsed.description}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Priority</span>
                <PriorityBadge priority={parsed.priority} />
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Due Date</span>
                <span className="text-sm text-slate-700">
                  {parsed.dueDate ? format(new Date(parsed.dueDate), 'MMM d, yyyy') : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Effort</span>
                <span className="text-sm text-slate-700">{parsed.estimatedEffort}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Urgency / Importance</span>
                <span className="text-sm text-slate-700">{parsed.urgency} / {parsed.importance}</span>
              </div>
              {parsed.reasoning && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700">{parsed.reasoning}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={() => { onClose(); setParsed(null); setInput(''); }} className="btn-secondary">
            Cancel
          </button>
          {!parsed ? (
            <button onClick={handleParse} disabled={parsing || !input.trim()} className="btn-primary">
              <Sparkles className="w-4 h-4" />
              {parsing ? 'Parsing...' : 'Parse with AI'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setParsed(null)} className="btn-secondary">Re-parse</button>
              <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
