import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { EquitySummaryResponse, PartnerSummaryItem, ProfitDistributionLog } from '../types';
import { RoleBadge } from '../components/RoleBadge';
import { formatCurrency } from '../utils/formatters';
import {
  PieChart,
  ShieldCheck,
  TrendingUp,
  Sliders,
  DollarSign,
  CheckCircle,
  X,
  History,
  Info,
  Lock,
  UserCheck,
  Award,
} from 'lucide-react';

export const EquityLedger: React.FC = () => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<EquitySummaryResponse | null>(null);
  const [payoutLogs, setPayoutLogs] = useState<ProfitDistributionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Scale Factor adjustment modal state (super_admin)
  const [selectedPartnerForScale, setSelectedPartnerForScale] = useState<PartnerSummaryItem | null>(null);
  const [newScaleFactor, setNewScaleFactor] = useState<string>('1.0');

  // Payout execution modal state (super_admin)
  const [selectedPartnerForPayout, setSelectedPartnerForPayout] = useState<PartnerSummaryItem | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  const fetchEquityData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equity/summary');
      setSummaryData(res.data);

      const logsRes = await api.get('/equity/payouts');
      setPayoutLogs(logsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch equity summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquityData();
  }, []);

  const handleUpdateScaleFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerForScale) return;
    setError('');
    setSuccessMsg('');
    try {
      await api.put('/equity/partner-scale', {
        partnerId: selectedPartnerForScale._id,
        profitScaleFactor: Number(newScaleFactor),
      });
      setSuccessMsg(`Profit scale factor for ${selectedPartnerForScale.partnerName} updated to ${newScaleFactor}x`);
      setSelectedPartnerForScale(null);
      fetchEquityData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Scale factor update failed');
    }
  };

  const handleProcessPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerForPayout) return;
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/equity/payout', {
        partnerId: selectedPartnerForPayout._id,
        amountPaid: Number(payoutAmount),
        notes: payoutNotes,
      });
      setSuccessMsg(`Approved payout of ৳${payoutAmount} to ${selectedPartnerForPayout.partnerName}`);
      setSelectedPartnerForPayout(null);
      setPayoutAmount('');
      setPayoutNotes('');
      fetchEquityData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payout processing failed');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400 font-medium">Computing Financial Ledgers...</span>
        </div>
      </div>
    );
  }

  // Find partner profile for current logged in partner
  const myPartner = summaryData?.myPartnerProfile || summaryData?.partners.find(p => p.isCurrentUser);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            {user?.role === 'partner' ? 'My Personal Equity & Dividend Ledger' : 'Partner Equity & Profit Scale Master Ledger'}
          </h1>
          <p className="text-sm text-slate-400">
            {user?.role === 'partner'
              ? `Individualized financial portal for ${user.name}`
              : 'Master Super Admin ledger for partner equity splits, scale factors, and approved dividend payouts.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && <RoleBadge role={user.role} />}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Partner Personal Scorecard Hero View (If logged in as Partner) */}
      {user?.role === 'partner' && myPartner && (
        <div className="glass-card p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-2xl">
                {myPartner.partnerName.charAt(0)}
              </div>
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                  Individual Partner Portal
                </span>
                <h2 className="text-2xl font-black text-slate-100 mt-1">{myPartner.partnerName}</h2>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Equity Share</span>
                <div className="text-lg font-black text-cyan-400">{myPartner.equitySharePercentage}%</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Profit Scale</span>
                <div className="text-lg font-black text-purple-300">{myPartner.profitScaleFactor}x</div>
              </div>
            </div>
          </div>

          {/* Partner Personal Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Capital Invested</span>
              <div className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(myPartner.totalCapitalInvested)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Initial equity contribution</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Adjusted Profit Share</span>
              <div className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(myPartner.adjustedProfitShare)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Based on net business profit</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Dividends Withdrawn</span>
              <div className="text-xl font-bold text-amber-400 mt-1">-{formatCurrency(myPartner.totalWithdrawn)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Historical payouts received</p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Withdrawable Earnings</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {formatCurrency(myPartner.liveWithdrawableAmount)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Available for payout request</p>
            </div>
          </div>
        </div>
      )}

      {/* Master Overview for Super Admin OR Full Table View */}
      {user?.role === 'super_admin' && (
        <>
          {/* Overall Net Profit Summary Banner */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Business Income</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {formatCurrency(summaryData?.metrics.netBusinessProfit)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Gross Sales minus Operating Expenses</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Capital Invested</span>
                <div className="text-3xl font-black text-cyan-300 mt-1">
                  {formatCurrency(summaryData?.metrics.totalCapitalInvested)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Partner initial equity contributions</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Dividends Distributed</span>
                <div className="text-3xl font-black text-purple-300 mt-1">
                  {formatCurrency(summaryData?.metrics.totalWithdrawn)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Total payouts drawn by partners to date</p>
              </div>
            </div>
          </div>

          {/* Side-by-Side 4 Partners Summary Cards for Super Admin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryData?.partners.map((partner) => (
              <div
                key={partner._id}
                className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Partner Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-extrabold text-slate-100 text-lg">{partner.partnerName}</h3>
                      <p className="text-xs text-slate-400">{partner.userId?.email || 'Partner'}</p>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                      {partner.equitySharePercentage}% Equity
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="space-y-3 mb-6 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Capital Invested</span>
                      <span className="font-bold text-slate-200">{formatCurrency(partner.totalCapitalInvested)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Profit Scale Factor</span>
                      <span className="font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {partner.profitScaleFactor}x
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Base Equity Share</span>
                      <span className="font-semibold text-slate-300">{formatCurrency(partner.baseProfitShare)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Adjusted Profit Share</span>
                      <span className="font-bold text-slate-100">{formatCurrency(partner.adjustedProfitShare)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Total Dividends Drawn</span>
                      <span className="font-semibold text-slate-400">-{formatCurrency(partner.totalWithdrawn)}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Live Withdrawable Amount
                      </span>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        {formatCurrency(partner.liveWithdrawableAmount)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Super Admin Control Actions */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedPartnerForScale(partner);
                      setNewScaleFactor(partner.profitScaleFactor.toString());
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" /> Scale Factor
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPartnerForPayout(partner);
                      setPayoutAmount(Math.max(0, partner.liveWithdrawableAmount).toString());
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Approve Payout
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Approved Profit Distributions / Payout Logs Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" /> Approved Dividend Payout History
            </h3>
            <p className="text-xs text-slate-400">
              {user?.role === 'partner'
                ? 'Your personal record of approved dividend payouts'
                : 'Master historical audit trail of partner payouts approved by Super Admin'}
            </p>
          </div>
        </div>

        {payoutLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No payout logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Payout Date</th>
                  <th className="py-3 px-4 font-semibold">Partner</th>
                  <th className="py-3 px-4 font-semibold">Scale Factor</th>
                  <th className="py-3 px-4 font-semibold">Approved By</th>
                  <th className="py-3 px-4 font-semibold">Notes</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payoutLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(log.payoutDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {log.partnerId?.partnerName || 'Partner'}
                    </td>
                    <td className="py-3.5 px-4 text-purple-300 font-semibold">
                      {log.scaleFactorAtPayout}x
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{log.approvedBy?.name || 'Super Admin'}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{log.notes || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                      {formatCurrency(log.amountPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Adjust Scale Factor (Super Admin only) */}
      {selectedPartnerForScale && user?.role === 'super_admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">
                Adjust Profit Scale Factor: {selectedPartnerForScale.partnerName}
              </h3>
              <button onClick={() => setSelectedPartnerForScale(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateScaleFactor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profit Scale Multiplier (e.g. 1.0 = 100%, 1.2 = 120%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="5"
                  required
                  value={newScaleFactor}
                  onChange={(e) => setNewScaleFactor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPartnerForScale(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-slate-100 text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20"
                >
                  Save Scale Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Payout (Super Admin only) */}
      {selectedPartnerForPayout && user?.role === 'super_admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">
                Process Dividend Payout: {selectedPartnerForPayout.partnerName}
              </h3>
              <button onClick={() => setSelectedPartnerForPayout(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payout Amount (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Approval Notes</label>
                <textarea
                  rows={3}
                  placeholder="Wire reference or notes..."
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPartnerForPayout(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Approve & Log Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
