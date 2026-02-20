import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Calendar, BarChart2,
  Users, Settings, LogOut, Plus, Sparkles, FolderOpen,
  ChevronLeft, ChevronRight, Brain
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../utils/helpers';

const navMain = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
];

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, openTaskModal, openNlpModal, openDailyPlan } = useAppStore();
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll });

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 shrink-0 relative',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
          <CheckSquare className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && <span className="font-bold text-lg tracking-tight">Donezo</span>}
      </div>

      {/* Quick Actions */}
      {sidebarOpen && (
        <div className="px-3 pt-4 pb-2 flex flex-col gap-1.5">
          <button onClick={() => openTaskModal()} className="btn-primary w-full justify-center rounded-xl py-2">
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <button onClick={openNlpModal} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
            <Sparkles className="w-4 h-4 text-primary-400" /> AI Input
          </button>
          <button onClick={openDailyPlan} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
            <Brain className="w-4 h-4 text-purple-400" /> Daily Plan
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {sidebarOpen && <p className="text-xs font-semibold text-slate-500 uppercase px-2 mb-1">Menu</p>}
        {navMain.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {sidebarOpen && label}
          </NavLink>
        ))}

        {/* Projects */}
        {sidebarOpen && projects.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase px-2 mt-4 mb-1">Projects</p>
            {projects.slice(0, 8).map(p => (
              <NavLink
                key={p._id}
                to={`/tasks?project=${p._id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors mb-0.5',
                    isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )
                }
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.color || '#16a34a' }}
                />
                <span className="truncate">{p.name}</span>
                {p.taskCount > 0 && (
                  <span className="ml-auto text-xs text-slate-500">{p.taskCount}</span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors z-20"
      >
        {sidebarOpen
          ? <ChevronLeft className="w-3 h-3 text-slate-300" />
          : <ChevronRight className="w-3 h-3 text-slate-300" />
        }
      </button>

      {/* Bottom */}
      <div className="border-t border-slate-700/50 p-3">
        <div className={cn('flex items-center gap-3 px-2', sidebarOpen ? '' : 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shrink-0 text-xs font-bold">
            TM
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Your Workspace</p>
              <p className="text-xs text-slate-500 truncate">Single User</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
