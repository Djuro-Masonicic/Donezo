import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { aiApi } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/Badges';
import { Brain, Sunrise, Sun, Zap, Lightbulb } from 'lucide-react';

export const DailyPlanModal = ({ open, onClose }) => {
  const { data: plan, isLoading, refetch } = useQuery({
    queryKey: ['daily-plan'],
    queryFn: aiApi.dailyPlan,
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="AI Daily Plan" size="lg">
      <div className="space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-500">AI is crafting your personalized day plan...</p>
          </div>
        ) : plan ? (
          <>
            {/* Summary */}
            <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-primary-800">Today's Overview</span>
              </div>
              <p className="text-sm text-slate-700">{plan.summary}</p>
            </div>

            {/* Morning */}
            {plan.morningFocus?.length > 0 && (
              <Section icon={Sunrise} title="Morning Focus" items={plan.morningFocus} color="orange" />
            )}

            {/* Afternoon */}
            {plan.afternoonFocus?.length > 0 && (
              <Section icon={Sun} title="Afternoon Focus" items={plan.afternoonFocus} color="blue" />
            )}

            {/* Quick wins */}
            {plan.quickWins?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Quick Wins</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.quickWins.map((t, i) => (
                    <span key={i} className="badge bg-yellow-50 text-yellow-700 border border-yellow-200">{t.title}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            {plan.tip && (
              <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-4">
                <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-800">{plan.tip}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => refetch()} className="btn-secondary">
                <Brain className="w-4 h-4" /> Regenerate Plan
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No plan available. Add some tasks first!</p>
        )}
      </div>
    </Modal>
  );
};

const Section = ({ icon: Icon, title, items, color }) => {
  const colorMap = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorMap[color]}`} />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              {item.reason && <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
