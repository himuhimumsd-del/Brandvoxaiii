// client/src/pages/admin/AdminGenerations.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCredits, formatDate, truncateText } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ShieldCheck, Video, HelpCircle, Eye, Trash2, Coins, Globe, Lock, Play, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminGenerations() {
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const fetchGenerations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/generations');
      setGenerations(res.data.generations || []);
    } catch (err) {
      toast.error('Failed to retrieve server generations log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const handleRefund = async (genId) => {
    if (window.confirm('Execute immediate manual refund for this video generation? This will credit the user back.')) {
      try {
        const res = await api.post(`/admin/generations/${genId}/refund`);
        if (res.data.success) {
          toast.success(`Refunded ₹${res.data.refundedAmount} credits to user profile successfully.`);
          fetchGenerations();
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Refund execution failed.');
      }
    }
  };

  const handleDelete = async (genId) => {
    if (window.confirm('Remove this generation record permanently from the database?')) {
      try {
        await api.delete(`/generate/${genId}`);
        setGenerations(prev => prev.filter(g => g.id !== genId));
        toast.success('Record deleted.');
      } catch (err) {
        toast.error('Failed to remove record.');
      }
    }
  };

  const handleToggleShare = async (genId, currentState) => {
    const targetState = !currentState;
    try {
      await api.patch(`/generate/${genId}`, { is_public: targetState });
      setGenerations(prev => prev.map(g => g.id === genId ? { ...g, is_public: targetState } : g));
      toast.success(targetState ? 'Video shared to Explore.' : 'Video restricted to private.');
    } catch (err) {
      toast.error('Sharing update failed.');
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Generations Ledger</h1>
          <p className="text-[10.5px] text-purple-300 font-bold uppercase tracking-widest mt-1">
            System-wide compilations log, refund controls, and assets overrides
          </p>
        </div>
        <button
          onClick={fetchPublicVideos => fetchGenerations()}
          className="p-2 bg-[#130E26] hover:bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/15 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* generations table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : generations.length === 0 ? (
        <div className="text-center py-12 bg-[#0F0A1E] border border-purple-500/10 rounded-2xl text-xs text-purple-300/40 tracking-wider">
          No generated assets logged.
        </div>
      ) : (
        <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 text-purple-300/40 uppercase font-black tracking-wider text-[10px] bg-[#130E26]/40">
                  <th className="p-4">Visual</th>
                  <th className="p-4">Prompt</th>
                  <th className="p-4">Model</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Cost (INR)</th>
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-center">Controls</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-white/70 divide-y divide-purple-500/5">
                {generations.map((g) => (
                  <tr key={g.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      {g.status === 'completed' && g.video_url ? (
                        <div
                          onClick={() => {
                            setActiveVideo(g);
                            setPlayerModalOpen(true);
                          }}
                          className="w-14 aspect-video bg-black rounded-lg overflow-hidden border border-purple-500/15 cursor-pointer relative group flex items-center justify-center"
                        >
                          <Play className="w-3.5 h-3.5 text-white/50 group-hover:text-white group-hover:scale-110 transition-all absolute" />
                        </div>
                      ) : (
                        <div className="w-14 aspect-video bg-purple-600/5 rounded-lg border border-purple-500/10 flex items-center justify-center text-[9px] uppercase font-bold text-white/30">
                          {g.status === 'failed' ? 'Error' : 'Pending'}
                        </div>
                      )}
                    </td>
                    <td className="p-4 max-w-xs truncate" title={g.prompt}>{g.prompt}</td>
                    <td className="p-4 text-purple-300/80 font-bold">{g.model_name}</td>
                    <td className="p-4">
                      <Badge variant={g.status === 'completed' ? 'success' : g.status === 'failed' ? 'error' : 'warning'}>
                        {g.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-warning font-black">{formatCredits(g.cost || 0)}</td>
                    <td className="p-4 font-mono text-[9px] text-white/30 truncate max-w-[100px]" title={g.fal_request_id}>
                      {g.fal_request_id || 'local_sim'}
                    </td>
                    <td className="p-4 text-white/30">{formatDate(g.created_at)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Toggle Share status */}
                        {g.status === 'completed' && (
                          <button
                            onClick={() => handleToggleShare(g.id, g.is_public)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              g.is_public ? 'text-success hover:bg-success/10' : 'text-white/30 hover:text-white hover:bg-white/5'
                            }`}
                            title={g.is_public ? 'Make Private' : 'Make Public'}
                          >
                            {g.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Force manual refund */}
                        {g.status !== 'refunded' && (
                          <button
                            onClick={() => handleRefund(g.id)}
                            className="p-1.5 rounded-lg text-warning hover:bg-warning/10 transition-colors cursor-pointer"
                            title="Force refund credits"
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete entry */}
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-error hover:bg-white/5 transition-colors cursor-pointer"
                          title="Delete generation entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIDEO PLAYER PREVIEW MODAL */}
      <Modal
        isOpen={playerModalOpen}
        onClose={() => {
          setPlayerModalOpen(false);
          setActiveVideo(null);
        }}
        title={`Video Review: ${activeVideo?.title || 'Untitled'}`}
      >
        {activeVideo?.video_url && (
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-xl bg-black overflow-hidden relative border border-purple-500/10">
              <video src={activeVideo.video_url} controls autoPlay className="w-full h-full object-cover" />
            </div>
            
            <div className="bg-[#130E26]/50 p-4 rounded-xl border border-purple-500/5 space-y-2 text-xs">
              <h4 className="font-extrabold text-white">Generation Prompt:</h4>
              <p className="text-purple-300/80 leading-relaxed font-semibold italic">{activeVideo.prompt}</p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
