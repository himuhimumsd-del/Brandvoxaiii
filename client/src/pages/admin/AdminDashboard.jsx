// client/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCredits } from '../../lib/utils';
import {
  Users,
  Video,
  Coins,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentGens, setRecentGens] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
      
      const genRes = await api.get('/admin/generations?limit=10');
      setRecentGens(genRes.data.generations || []);
    } catch (err) {
      toast.error('Failed to sync administrative parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3.5">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-xs text-purple-300 font-bold uppercase tracking-widest">Aggregating Site KPI Ledger...</p>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const charts = stats?.charts || {};

  const COLORS = ['#6C5CE7', '#00B894', '#E17055'];

  return (
    <div className="space-y-8 select-none">
      
      {/* Page header banner */}
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Metrics Dashboard</h1>
          <p className="text-[10.5px] text-purple-300 font-bold uppercase tracking-widest mt-1">
            Real-time diagnostics and platform statistics in INR
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 bg-[#130E26] hover:bg-purple-600/20 text-purple-300 rounded-xl border border-purple-500/15 cursor-pointer transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 1. KPI CARDS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Users */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest">Total Users</span>
            <h3 className="text-2xl font-black text-white">{kpis.totalUsers}</h3>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl z-10">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Videos Generated */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest">Total Videos</span>
            <h3 className="text-2xl font-black text-white">{kpis.totalVideosGenerated}</h3>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl z-10">
            <Video className="w-5 h-5" />
          </div>
        </div>

        {/* Total Platform Revenue */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest">Total Revenue (INR)</span>
            <h3 className="text-2xl font-black text-warning">{formatCredits(kpis.totalRevenue)}</h3>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl z-10">
            <Coins className="w-5 h-5 text-warning" />
          </div>
        </div>

        {/* Circulating Credits */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest">Credits in Circulation</span>
            <h3 className="text-2xl font-black text-purple-300">{formatCredits(kpis.creditsInCirculation)}</h3>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl z-10">
            <Activity className="w-5 h-5 text-purple-300" />
          </div>
        </div>

      </div>

      {/* 2. RECHARTS METRICS GRAPHS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Videos Compilations Chart */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-purple-400" />
            <span>Weekly Video Compilations Output</span>
          </h3>
          <div className="w-full h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.generationsChart}>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" />
                <YAxis stroke="rgba(255,255,255,0.2)" />
                <Tooltip contentStyle={{ background: '#130E26', border: '1px solid rgba(108,92,231,0.2)', color: 'white' }} />
                <Line type="monotone" dataKey="videos" stroke="#6C5CE7" strokeWidth={3} dot={{ fill: '#6C5CE7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Model Popularity Pie */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-purple-400" />
            <span>Model Usage Shares</span>
          </h3>
          <div className="w-full h-44 text-xs flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.modelUsageChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.modelUsageChart?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#130E26', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around text-[10px] uppercase font-bold text-white/40 pt-2 border-t border-purple-500/5">
            {charts.modelUsageChart?.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span>{entry.name.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. RECENT ACTIVITY TABLE */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
          <Activity className="w-4.5 h-4.5 mr-1.5 text-purple-400" />
          <span>System-wide Generation Dispatch Activity</span>
        </h3>
        <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 text-purple-300/40 uppercase font-black tracking-wider text-[10px] bg-[#130E26]/40">
                  <th className="p-4">Video ID</th>
                  <th className="p-4">Prompt</th>
                  <th className="p-4">Model Used</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">INR Cost</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-white/70 divide-y divide-purple-500/5">
                {recentGens.map((gen) => (
                  <tr key={gen.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-[10px] text-purple-300/40">{gen.id.slice(0, 8)}...</td>
                    <td className="p-4 text-white/80 max-w-xs truncate" title={gen.prompt}>{gen.prompt}</td>
                    <td className="p-4">{gen.model_name}</td>
                    <td className="p-4 uppercase text-[9px] font-black tracking-wider text-purple-300">{gen.status}</td>
                    <td className="p-4 text-warning">{formatCredits(gen.cost || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
