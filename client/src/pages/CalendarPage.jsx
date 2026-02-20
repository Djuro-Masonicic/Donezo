import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api';
import { useAppStore } from '../store/appStore';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, addMonths, subMonths, getDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PRIORITY_CONFIG } from '../utils/helpers';

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { openTaskModal } = useAppStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data } = useQuery({
    queryKey: ['tasks', 'calendar', format(currentDate, 'yyyy-MM')],
    queryFn: () => tasksApi.getAll({
      dueAfter: monthStart.toISOString(),
      dueBefore: monthEnd.toISOString(),
      limit: 200,
    }),
  });

  const tasks = data?.tasks || [];

  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach(t => {
    if (t.dueDate) {
      const key = format(new Date(t.dueDate), 'yyyy-MM-dd');
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(t);
    }
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const padDays = Array(startPad).fill(null);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedTasks = tasksByDate[selectedKey] || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">View tasks by due date</p>
        </div>
        <button onClick={() => openTaskModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar Grid */}
        <div className="card lg:col-span-2">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-ghost p-2">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-slate-800 text-lg">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-ghost p-2">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {padDays.map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate[key] || [];
              const isSelected = isSameDay(day, selectedDate);
              const todayDay = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={`relative min-h-[64px] p-1.5 rounded-xl text-left transition-all text-xs border ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : todayDay
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className={`text-xs font-semibold mb-1 block ${
                    isSelected ? 'text-white' : todayDay ? 'text-primary-700' : 'text-slate-600'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <div
                      key={t._id}
                      className={`text-[10px] truncate rounded px-1 py-0.5 mb-0.5 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day tasks */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-1">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {selectedTasks.length === 0 ? 'No tasks due' : `${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} due`}
          </p>

          {selectedTasks.length > 0 ? (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: PRIORITY_CONFIG[t.priority]?.color || '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {t.title}
                      </p>
                      {t.project && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.project.icon} {t.project.name}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: PRIORITY_CONFIG[t.priority]?.color + '22',
                        color: PRIORITY_CONFIG[t.priority]?.color
                      }}
                    >
                      {PRIORITY_CONFIG[t.priority]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm text-slate-400">No tasks due on this day</p>
              <button
                onClick={() => openTaskModal()}
                className="btn-ghost mt-3 text-primary-600 hover:bg-primary-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
