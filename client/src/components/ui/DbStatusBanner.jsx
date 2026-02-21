import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Database, CheckCircle } from 'lucide-react';
import api from '../../api';

export const DbStatusBanner = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then(r => r.data),
    refetchInterval: 5000,         // poll every 5 s
    retry: false,
    staleTime: 0,
  });

  if (isLoading) return null;

  const isOk = data?.db === 'connected';

  if (isOk) return null;

  const isLocal = window.location.hostname === 'localhost';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-sm">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="text-amber-800 font-medium">
        Database unavailable.
      </span>
      <span className="text-amber-700">
        {isLocal
          ? <>Start MongoDB with{' '}<code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">mongod</code>{' '}in a terminal — the server will reconnect automatically.</>
          : 'The server is connecting to the database — please wait a moment and refresh.'}
      </span>
      <span className="ml-auto shrink-0 badge bg-amber-100 text-amber-700 border border-amber-300">
        DB: {data?.db ?? 'unreachable'}
      </span>
    </div>
  );
};
