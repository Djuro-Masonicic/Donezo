import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api';
import { Spinner } from '../components/ui/Badges';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, CheckCircle, AlertTriangle, Target } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#eab308'];

export const AnalyticsPage = () => {
  const [days, setDays] = useState(30);

  const { data: overview } = useQuery({ queryKey: ['analytics', 'overview'], queryFn: analyticsApi.getOverview });
  const { data: productivity = [], isLoading: loadProd } = useQuery({
    queryKey: ['analytics', 'productivity', days],
    queryFn: () => analyticsApi.getProductivity(days),
  });
  const { data: completionRate } = useQuery({
    queryKey: ['analytics', 'completion-rate', days],
    queryFn: () => analyticsApi.getCompletionRate(days),
  });
  const { data: overdue = [] } = useQuery({ queryKey: ['analytics', 'overdue'], queryFn: analyticsApi.getOverdue });

  const statusData = overview?.statusMap
    ? Object.entries(overview.statusMap).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value
      }))
    : [];

  const priorityData = overview?.priorityMap
    ? Object.entries(overview.priorityMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    : [];

  const totalCompleted = productivity.reduce((s, d) => s + d.count, 0);
  const avgPerDay = productivity.length > 0 ? (totalCompleted / productivity.length).toFixed(1) : 0;
  const peakDay = productivity.reduce((a, b) => b.count > a.count ? b : a, { count: 0 });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your productivity trends</p>
        </div>
        <select
          className="input w-auto"
          value={days}
          onChange={e => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={CheckCircle}
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
          label="Completed"
          value={totalCompleted}
          sub={`Last ${days} days`}
        />
        <KpiCard
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Daily Average"
          value={avgPerDay}
          sub="Tasks per day"
        />
        <KpiCard
          icon={Target}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          label="Completion Rate"
          value={`${completionRate?.rate || 0}%`}
          sub={`${completionRate?.completed || 0} of ${completionRate?.created || 0} created`}
        />
        <KpiCard
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          label="Overdue"
          value={overdue.length}
          sub="Need attention"
          warn={overdue.length > 0}
        />
      </div>

      {/* Productivity Chart */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Task Completion Over Time</h3>
          {peakDay.count > 0 && (
            <span className="text-xs text-slate-500">
              Peak: {peakDay.count} tasks on {peakDay.date && format(new Date(peakDay.date), 'MMM d')}
            </span>
          )}
        </div>
        {loadProd ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={productivity}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={d => format(new Date(d), days <= 14 ? 'MMM d' : 'MMM d')}
                interval={days > 30 ? 6 : days > 14 ? 3 : 1}
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(val) => [val, 'Tasks completed']}
                labelFormatter={l => format(new Date(l), 'MMM d, yyyy')}
              />
              <Area type="monotone" dataKey="count" stroke="#16a34a" fill="url(#greenGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status pie */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Tasks by Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-600 capitalize">{s.name}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
          )}
        </div>

        {/* Priority bar */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Tasks by Priority</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {priorityData.map((d, i) => {
                    const c = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#94a3b8' };
                    return <Cell key={i} fill={c[d.name] || '#16a34a'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
          )}
        </div>

        {/* Overdue list */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Overdue Tasks
          </h3>
          {overdue.length > 0 ? (
            <div className="space-y-2">
              {overdue.slice(0, 8).map(t => (
                <div key={t._id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                  <span className="text-xs text-red-800 flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-red-500 shrink-0">
                    {format(new Date(t.dueDate), 'MMM d')}
                  </span>
                </div>
              ))}
              {overdue.length > 8 && (
                <p className="text-xs text-slate-400 text-center pt-1">+{overdue.length - 8} more</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-slate-500">No overdue tasks!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, iconColor, iconBg, label, value, sub, warn }) => (
  <div className={`card ${warn ? 'border-red-200' : ''}`}>
    <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div className="text-2xl font-bold text-slate-800 mb-0.5">{value}</div>
    <div className="text-sm font-medium text-slate-700">{label}</div>
    <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
  </div>
);
