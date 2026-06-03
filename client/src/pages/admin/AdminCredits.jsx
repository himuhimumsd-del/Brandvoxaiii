// client/src/pages/admin/AdminCredits.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCredits, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Coins, Award, History, TrendingUp, DollarSign, Gift, RefreshCw, Check, X, ShieldAlert, Image, ExternalLink } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminCredits() {
  const [txs, setTxs] = useState([]);
  const [upiSubmissions, setUpiSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Bulk grant state
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Verification processing states
  const [adminNotes, setAdminNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);
  
  // Screenshot modal preview
  const [previewImage, setPreviewImage] = useState(null);

  const fetchCreditsData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data.kpis || {});

      const txsRes = await api.get('/admin/transactions');
      setTxs(txsRes.data || []);

      const upiRes = await api.get('/admin/upi-submissions');
      setUpiSubmissions(upiRes.data || []);
    } catch (err) {
      toast.error('Failed to sync billing ledgers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditsData();
  }, []);

  const handleBulkGrant = async (e) => {
    e.preventDefault();
    if (!bulkAmount || isNaN(bulkAmount) || parseFloat(bulkAmount) <= 0) {
      toast.error('Please enter a positive numeric reward amount.');
      return;
    }

    setSubmittingBulk(true);
    try {
      const res = await api.post('/admin/credits/grant', {
        amount: parseFloat(bulkAmount),
        reason: bulkReason
      });

      if (res.data.success) {
        toast.success(`Successfully dispatched ₹${bulkAmount} bonus to ${res.data.grantedUsers} users!`);
        setBulkAmount('');
        setBulkReason('');
        fetchCreditsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to dispatch mass reward.');
    } finally {
      setSubmittingBulk(false);
    }
  };

  const handleApproveUpi = async (id) => {
    setProcessingId(id);
    try {
      const res = await api.post(`/admin/upi-submissions/${id}/approve`, {
        admin_notes: adminNotes[id] || 'Payment approved and verified.'
      });
      if (res.data.success) {
        toast.success('UPI Payment approved and credits successfully credited.');
        await fetchCreditsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve UPI payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectUpi = async (id) => {
    const reason = adminNotes[id];
    if (!reason || reason.trim().length === 0) {
      toast.error('Please enter a rejection reason in the remarks field.');
      return;
    }

    setProcessingId(id);
    try {
      const res = await api.post(`/admin/upi-submissions/${id}/reject`, {
        admin_notes: reason
      });
      if (res.data.success) {
        toast.success('UPI Payment rejected successfully.');
        await fetchCreditsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject UPI payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const getTxTypeBadge = (type) => {
    const types = {
      purchase: { label: 'Purchase', variant: 'success' },
      usage: { label: 'Usage', variant: 'primary' },
      refund: { label: 'Refund', variant: 'warning' },
      admin_grant: { label: 'Admin Gift', variant: 'featured' }
    };
    const t = types[type] || { label: type, variant: 'secondary' };
    return <Badge variant={t.variant}>{t.label}</Badge>;
  };

  const getSubStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'Pending Audit', variant: 'warning' },
      approved: { label: 'Approved', variant: 'success' },
      rejected: { label: 'Rejected', variant: 'error' }
    };
    const s = statuses[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const pendingSubmissions = upiSubmissions.filter(sub => sub.status === 'pending');
  const processedSubmissions = upiSubmissions.filter(sub => sub.status !== 'pending');

  return (
    <div className="space-y-8 select-none">
      
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">UPI Approvals & Billing</h1>
          <p className="text-[10.5px] text-purple-300 font-bold uppercase tracking-widest mt-1">
            Manual UPI verification queues, global circulation metrics, and site ledger audits
          </p>
        </div>
        <button
          onClick={fetchCreditsData}
          className="p-2 bg-[#130E26] hover:bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/15 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* TOP ROW: Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total revenue */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest block">Total Sales Revenue</span>
            <h3 className="text-2xl font-black text-success">{formatCredits(stats?.totalRevenue || 0)}</h3>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
            <DollarSign className="w-5 h-5 text-success" />
          </div>
        </div>

        {/* Circulating credits */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest block">Circulating Tokens</span>
            <h3 className="text-2xl font-black text-warning">{formatCredits(stats?.creditsInCirculation || 0)}</h3>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
            <Coins className="w-5 h-5 text-warning" />
          </div>
        </div>

        {/* Pending approvals count */}
        <div className="bg-[#0F0A1E] border border-purple-500/10 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest block">Pending UPI Submissions</span>
            <h3 className="text-2xl font-black text-error">
              {pendingSubmissions.length}
            </h3>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-error animate-pulse" />
          </div>
        </div>

      </div>

      {/* UPI VERIFICATION AUDIT QUEUE */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
          <ShieldAlert className="w-4.5 h-4.5 mr-1.5 text-purple-400" />
          <span>Manual UPI payment verification queue ({pendingSubmissions.length} pending)</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : pendingSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-[#0F0A1E] border border-purple-500/10 rounded-2xl text-xs text-purple-300/40 tracking-wider font-bold">
            🎉 All manual payments are fully audited! No pending verifications.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingSubmissions.map((sub) => (
              <div 
                key={sub.id}
                className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-premium relative overflow-hidden"
              >
                {/* Visual Glow */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

                {/* Left columns: Metadata details */}
                <div className="md:col-span-8 space-y-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] text-purple-300/40 uppercase tracking-widest font-black block">Submitted {formatDate(sub.created_at)}</span>
                    <Badge variant="warning">Pending Audit</Badge>
                    <Badge variant="primary">{sub.package_id.toUpperCase()}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Registered Email</span>
                      <span className="text-xs font-extrabold text-white">{sub.email}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Transaction / UTR ID</span>
                      <span className="text-xs font-mono font-black text-warning tracking-wide">{sub.utr_id}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Payment Capital</span>
                      <span className="text-xs font-black text-success">₹{sub.amount}</span>
                    </div>
                  </div>

                  {/* Remarks input */}
                  <div className="max-w-md">
                    <Input
                      label="Admin Audit Notes / Remarks (Mandatory if Rejecting)"
                      placeholder="e.g. Verified on bank console. / Incorrect UTR ID."
                      value={adminNotes[sub.id] || ''}
                      onChange={(e) => setAdminNotes({
                        ...adminNotes,
                        [sub.id]: e.target.value
                      })}
                    />
                  </div>
                </div>

                {/* Middle columns: Screenshot Preview */}
                <div className="md:col-span-2 flex flex-col items-center">
                  <span className="text-[9px] text-purple-300/40 uppercase tracking-widest font-black mb-2 block">Receipt Screenshot</span>
                  {sub.screenshot_url ? (
                    <div 
                      onClick={() => setPreviewImage(sub.screenshot_url)}
                      className="w-20 h-20 border border-purple-500/10 rounded-xl overflow-hidden cursor-pointer hover:border-purple-500/40 transition-all flex items-center justify-center bg-black/40 group relative shadow-premium"
                    >
                      <img src={sub.screenshot_url} alt="screenshot receipt" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest">
                        <ExternalLink className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center bg-[#130E26]/20 text-white/20 select-none text-[8px] font-bold uppercase">
                      <Image className="w-5 h-5 mb-1 text-white/10" />
                      <span>No receipt</span>
                    </div>
                  )}
                </div>

                {/* Right columns: Audit Action Buttons */}
                <div className="md:col-span-2 flex flex-col space-y-2">
                  <Button
                    variant="success"
                    size="sm"
                    className="w-full font-black text-[10px] uppercase py-2 cursor-pointer"
                    isLoading={processingId === sub.id}
                    icon={Check}
                    onClick={() => handleApproveUpi(sub.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full font-black text-[10px] uppercase py-2 cursor-pointer"
                    isLoading={processingId === sub.id}
                    icon={X}
                    onClick={() => handleRejectUpi(sub.id)}
                  >
                    Reject
                  </Button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* PROCESSED UPI SUBMISSIONS LOG */}
      {processedSubmissions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-purple-500/10">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
            <History className="w-4.5 h-4.5 mr-1.5 text-purple-400" />
            <span>Audited UPI Payments Log ({processedSubmissions.length} requests)</span>
          </h3>

          <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl overflow-hidden shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/10 text-purple-300/40 uppercase font-black tracking-wider text-[10px] bg-[#130E26]/40">
                    <th className="p-4">Audited At</th>
                    <th className="p-4">User Email</th>
                    <th className="p-4">UTR ID</th>
                    <th className="p-4">Capital</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Audit Status</th>
                    <th className="p-4">Admin Audit Notes</th>
                    <th className="p-4">Receipt</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-white/70 divide-y divide-purple-500/5">
                  {processedSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-purple-300/40">{formatDate(sub.updated_at)}</td>
                      <td className="p-4 text-white/70">{sub.email}</td>
                      <td className="p-4 font-mono font-bold text-white">{sub.utr_id}</td>
                      <td className="p-4 text-warning">₹{sub.amount}</td>
                      <td className="p-4 uppercase text-[10px] text-primary-hover">{sub.package_id}</td>
                      <td className="p-4">{getSubStatusBadge(sub.status)}</td>
                      <td className="p-4 text-white/50 max-w-xs truncate" title={sub.admin_notes || '-'}>
                        {sub.admin_notes || '-'}
                      </td>
                      <td className="p-4">
                        {sub.screenshot_url ? (
                          <button
                            onClick={() => setPreviewImage(sub.screenshot_url)}
                            className="text-purple-400 hover:text-purple-300 font-extrabold uppercase text-[9px] tracking-wider cursor-pointer"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-white/20">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MIDDLE: Mass Promo Grant */}
      <div className="bg-[#0F0A1E] border border-purple-500/10 p-6 rounded-2xl max-w-xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
          <Gift className="w-4.5 h-4.5 mr-1.5 text-purple-400" />
          <span>Mass Campaign Credits Award (Dispatched to all users)</span>
        </h3>
        
        <form onSubmit={handleBulkGrant} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gift Amount (INR)"
              type="number"
              placeholder="e.g. 50"
              value={bulkAmount}
              onChange={(e) => setBulkAmount(e.target.value)}
              required
            />
            <Input
              label="Reward Description"
              placeholder="e.g. Festive promo reward!"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              required
            />
          </div>
          <Button type="submit" isLoading={submittingBulk} className="w-full uppercase font-bold text-xs py-2.5 shadow-premium">
            Dispatch Global Promotional Reward
          </Button>
        </form>
      </div>

      {/* BOTTOM: Full transactions table */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
          <History className="w-4.5 h-4.5 mr-1.5 text-purple-400" />
          <span>Site-wide Transactions Ledger Log</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : txs.length === 0 ? (
          <div className="text-center py-12 bg-[#0F0A1E] border border-purple-500/10 rounded-2xl text-xs text-purple-300/40 tracking-wider">
            No system-wide transactions recorded.
          </div>
        ) : (
          <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl overflow-hidden shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/10 text-purple-300/40 uppercase font-black tracking-wider text-[10px] bg-[#130E26]/40">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Balance Delta</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Reference ID</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-white/70 divide-y divide-purple-500/5">
                  {txs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-purple-300/40">{formatDate(tx.created_at)}</td>
                      <td className="p-4 font-mono text-[9px] text-white/40">{tx.user_id?.slice(0, 8)}...</td>
                      <td className="p-4">{getTxTypeBadge(tx.type)}</td>
                      <td className={`p-4 font-black ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                      </td>
                      <td className="p-4 text-white/60 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                      <td className="p-4 font-mono text-[9px] text-white/30 truncate max-w-[100px]" title={tx.gateway_payment_id}>
                        {tx.gateway_payment_id || 'manual_adjustment'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Clickable Image Zoom modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out animate-fadeIn"
        >
          <div className="max-w-3xl max-h-[85vh] border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#0F0A1E]">
            <img src={previewImage} alt="Audited receipt zoom" className="max-w-full max-h-[80vh] object-contain" />
            <div className="p-3 text-center text-[10px] text-white/40 font-bold uppercase tracking-widest bg-[#130E26]">
              Click anywhere outside to zoom out / exit
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
