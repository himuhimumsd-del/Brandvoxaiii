// client/src/pages/admin/AdminModels.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCredits } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Database, Plus, Edit2, Trash2, Cpu, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeModelId, setActiveModelId] = useState(null);

  // Form parameters
  const [modelId, setModelId] = useState('');
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [falEndpoint, setFalEndpoint] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerSecond, setPricePerSecond] = useState('');
  const [maxDuration, setMaxDuration] = useState(15);
  const [supportsAudio, setSupportsAudio] = useState(true);
  const [supportsImage, setSupportsImage] = useState(false);
  const [badge, setBadge] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/models');
      setModels(res.data || []);
    } catch (err) {
      toast.error('Failed to sync AI models index.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setActiveModelId(null);
    setModelId('');
    setName('');
    setProvider('');
    setFalEndpoint('');
    setDescription('');
    setPricePerSecond('');
    setMaxDuration(15);
    setSupportsAudio(true);
    setSupportsImage(false);
    setBadge('');
    setIsActive(true);
    setIsFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (model) => {
    setEditMode(true);
    setActiveModelId(model.id);
    setModelId(model.id);
    setName(model.name);
    setProvider(model.provider);
    setFalEndpoint(model.fal_endpoint);
    setDescription(model.description || '');
    setPricePerSecond(model.price_per_second);
    setMaxDuration(model.max_duration);
    setSupportsAudio(model.supports_audio);
    setSupportsImage(model.supports_image_input);
    setBadge(model.badge || '');
    setIsActive(model.is_active);
    setIsFeatured(model.is_featured);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelId || !name || !provider || !falEndpoint || !pricePerSecond) {
      toast.error('Please enter all required specifications.');
      return;
    }

    setSubmitting(true);
    const payload = {
      id: modelId,
      name,
      provider,
      fal_endpoint: falEndpoint,
      description,
      price_per_second: parseFloat(pricePerSecond),
      max_duration: parseInt(maxDuration),
      supports_audio: supportsAudio,
      supports_image_input: supportsImage,
      badge,
      is_active: isActive,
      is_featured: isFeatured
    };

    try {
      if (editMode) {
        await api.patch(`/admin/models/${activeModelId}`, payload);
        toast.success('AI Model configurations saved.');
      } else {
        await api.post('/admin/models', payload);
        toast.success('AI Model added to active listings successfully.');
      }
      setModalOpen(false);
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit model configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleState = async (model, field) => {
    const updatedValue = !model[field];
    try {
      await api.patch(`/admin/models/${model.id}`, { [field]: updatedValue });
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, [field]: updatedValue } : m));
      toast.success('Status updated.');
    } catch (err) {
      toast.error('Failed to change configuration status.');
    }
  };

  const handleSoftDelete = async (modelId) => {
    if (window.confirm('Mark this AI model configuration as inactive (soft delete)? It will disappear from client pickers.')) {
      try {
        await api.delete(`/admin/models/${modelId}`);
        toast.success('Model flagged as inactive successfully.');
        fetchModels();
      } catch (err) {
        toast.error('Failed to remove model.');
      }
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">AI Models Configurations</h1>
          <p className="text-[10.5px] text-purple-300 font-bold uppercase tracking-widest mt-1">
            Register and seed fal.ai endpoints immediately into the Studio picker
          </p>
        </div>
        
        <div className="flex space-x-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchModels}
            className="p-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openAddModal}
            className="shadow-premium uppercase font-extrabold text-[10px] py-2"
          >
            Add New AI Model
          </Button>
        </div>
      </div>

      {/* Models catalog list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 bg-[#0F0A1E] border border-purple-500/10 rounded-2xl text-xs text-purple-300/40 tracking-wider">
          No AI video models configured yet. Tap Add Model.
        </div>
      ) : (
        <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 text-purple-300/40 uppercase font-black tracking-wider text-[10px] bg-[#130E26]/40">
                  <th className="p-4">Model Name</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">fal.ai Endpoint</th>
                  <th className="p-4">Price / Sec</th>
                  <th className="p-4">Max Duration</th>
                  <th className="p-4 text-center">Active</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-white/80 divide-y divide-purple-500/5">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded bg-purple-600/10 text-purple-400">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-white block">{m.name}</span>
                          {m.badge && <span className="text-[8px] text-primary-hover font-black uppercase">{m.badge}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-purple-300/60 uppercase tracking-wide">{m.provider}</td>
                    <td className="p-4 font-mono text-[10px] text-white/40 truncate max-w-[150px]" title={m.fal_endpoint}>
                      {m.fal_endpoint}
                    </td>
                    <td className="p-4 text-warning font-black">{formatCredits(m.price_per_second)}/s</td>
                    <td className="p-4">{m.max_duration}s</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleState(m, 'is_active')}
                        className="flex items-center justify-center mx-auto text-purple-400 hover:text-white transition-all cursor-pointer"
                      >
                        {m.is_active ? <ToggleRight className="w-6 h-6 text-success" /> : <ToggleLeft className="w-6 h-6 text-white/20" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleState(m, 'is_featured')}
                        className="flex items-center justify-center mx-auto text-purple-400 hover:text-white transition-all cursor-pointer"
                      >
                        {m.is_featured ? <ToggleRight className="w-6 h-6 text-primary-hover" /> : <ToggleLeft className="w-6 h-6 text-white/20" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Edit details */}
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                          title="Modify Model"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Soft delete */}
                        <button
                          onClick={() => handleSoftDelete(m.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-error hover:bg-white/5 transition-colors cursor-pointer"
                          title="Soft delete model"
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

      {/* CRUD AI MODEL MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Edit AI Video Model Configurations' : 'Register New AI Video Model'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Model ID"
              placeholder="e.g. wan-2-2"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={editMode}
              required
            />
            <Input
              label="Display Name"
              placeholder="e.g. WAN 2.2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Provider Name"
              placeholder="e.g. Alibaba"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              required
            />
            <Input
              label="price per second (INR)"
              type="number"
              step="0.0001"
              placeholder="e.g. 15.00"
              value={pricePerSecond}
              onChange={(e) => setPricePerSecond(e.target.value)}
              required
            />
          </div>

          <Input
            label="fal.ai EndPoint String"
            placeholder="e.g. fal-ai/wan/v2.2-a14b/text-to-video"
            value={falEndpoint}
            onChange={(e) => setFalEndpoint(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Key model highlights..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Duration (Sec)"
              type="number"
              placeholder="e.g. 15"
              value={maxDuration}
              onChange={(e) => setMaxDuration(parseInt(e.target.value))}
            />
            <Input
              label="Display Badge Text"
              placeholder="e.g. Budget / Quality"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            />
          </div>

          {/* Toggle buttons grid */}
          <div className="grid grid-cols-2 gap-4 bg-[#130E26]/50 p-3 rounded-xl border border-purple-500/5 select-none">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
              <span>Supports Audio</span>
              <input
                type="checkbox"
                checked={supportsAudio}
                onChange={(e) => setSupportsAudio(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
              <span>Animate Image (I2V)</span>
              <input
                type="checkbox"
                checked={supportsImage}
                onChange={(e) => setSupportsImage(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </div>
          </div>

          <Button type="submit" isLoading={submitting} className="w-full uppercase font-bold text-xs py-2.5 shadow-premium">
            {editMode ? 'Update Model Config' : 'Register AI Model'}
          </Button>
        </form>
      </Modal>

    </div>
  );
}
