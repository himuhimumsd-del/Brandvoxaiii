// client/src/hooks/useModels.js
import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/models');
      setModels(res.data || []);
    } catch (err) {
      console.error('[useModels] Failed to fetch active models:', err);
      setError(err.message || 'Failed to fetch models list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveModels();
  }, []);

  return {
    models,
    loading,
    error,
    refetchModels: fetchActiveModels
  };
}
