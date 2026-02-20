import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { DbStatusBanner } from '../ui/DbStatusBanner';
import { TaskModal } from '../tasks/TaskModal';
import { NlpModal } from '../tasks/NlpModal';
import { DailyPlanModal } from '../tasks/DailyPlanModal';
import { ProjectModal } from '../projects/ProjectModal';
import { useAppStore } from '../../store/appStore';

export const AppLayout = () => {
  const { taskModalOpen, closeTaskModal, editingTask, nlpModalOpen, closeNlpModal, dailyPlanOpen, closeDailyPlan, projectModalOpen, closeProjectModal, editingProject } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DbStatusBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <TaskModal open={taskModalOpen} onClose={closeTaskModal} task={editingTask} />
      <NlpModal open={nlpModalOpen} onClose={closeNlpModal} />
      <DailyPlanModal open={dailyPlanOpen} onClose={closeDailyPlan} />
      <ProjectModal open={projectModalOpen} onClose={closeProjectModal} project={editingProject} />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        }}
      />
    </div>
  );
};
