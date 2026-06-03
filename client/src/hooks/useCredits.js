// client/src/hooks/useCredits.js
import { useState, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function useCredits() {
  const { profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [upiSubmissions, setUpiSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/credits/transactions?page=${page}&limit=${limit}`);
      setTransactions(res.data.transactions || []);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to retrieve transaction history.';
      setError(errMsg);
      return { transactions: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpiSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/credits/upi-submissions');
      setUpiSubmissions(res.data || []);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to retrieve UPI submissions.';
      setError(errMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const submitUpiPayment = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      toast.loading('Logging payment verification details...');
      const res = await api.post('/credits/upi-submit', payload);
      toast.dismiss();
      
      if (res.data.success) {
        toast.success(res.data.message || 'Payment submission logged successfully!');
        await refreshProfile();
        await fetchUpiSubmissions();
        return res.data;
      } else {
        const errText = res.data.error || 'Failed to submit payment details.';
        toast.error(errText);
        throw new Error(errText);
      }
    } catch (err) {
      toast.dismiss();
      const errMsg = err.response?.data?.error || err.message || 'Payment submission failed.';
      setError(errMsg);
      toast.error(errMsg);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    upiSubmissions,
    loading,
    error,
    fetchTransactions,
    fetchUpiSubmissions,
    submitUpiPayment
  };
}
