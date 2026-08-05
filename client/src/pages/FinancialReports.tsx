import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { IncomeStatementReport, BalanceSheetReport } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Building,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  Download,
} from 'lucide-react';

export const FinancialReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'draws'>('income');
  const [incomeData, setIncomeData] = useState<IncomeStatementReport | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceSheetReport | null>(null);
  const [drawsData, setDrawsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate };

      if (activeTab === 'income') {
        const res = await api.get('/reports/income-statement', { params });
        setIncomeData(res.data);
      } else if (activeTab === 'balance') {
        const res = await api.get('/reports/balance-sheet');
        setBalanceData(res.data);
      } else if (activeTab === 'draws') {
        const res = await api.get('/reports/partner-draws');
        setDrawsData(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generating financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };



  return (
    <div className="space-y-6">
      {/* Header and Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Financial Statement Reports
          </h1>
          <p className="text-sm text-slate-400">
            Printable Income Statement (P&L), Balance Sheet, and Partner Draw Audit Ledgers.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all w-fit"
        >
          <Printer className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 no-print">
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'income'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Income Statement (P&L)
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'balance'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" /> Balance Sheet
        </button>
        <button
          onClick={() => setActiveTab('draws')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'draws'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" /> Partner Draw Ledgers
        </button>
      </div>

      {/* Printable Report Document Body */}
      <div className="print-area">
        {/* Printable Header Banner */}
        <div className="glass-card p-8 rounded-2xl border border-slate-800 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
            <div>
              <div className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                Serumion Inc.
              </div>
              <p className="text-xs text-slate-400 mt-1">Official Financial & Accounting Statement</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-cyan-400">
                {activeTab === 'income'
                  ? 'INCOME STATEMENT (P&L)'
                  : activeTab === 'balance'
                  ? 'BALANCE SHEET STATEMENT'
                  : 'PARTNER DRAW LEDGERS'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Generating statement data...</div>
          ) : activeTab === 'income' && incomeData ? (
            /* Income Statement */
            <div className="space-y-8 text-sm">
              {/* Revenue Section */}
              <div>
                <h3 className="font-bold text-slate-200 uppercase text-xs tracking-wider mb-3 pb-1 border-b border-slate-800">
                  I. Revenue & Gross Sales
                </h3>
                <div className="space-y-2">
                  {incomeData.revenue.byCategory.map((c) => (
                    <div key={c.category} className="flex justify-between py-1 border-b border-slate-900 text-xs">
                      <span className="text-slate-300">{c.category}</span>
                      <span className="font-medium text-slate-100">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t border-slate-700 font-bold text-emerald-400">
                    <span>Total Gross Sales</span>
                    <span>{formatCurrency(incomeData.revenue.totalGrossSales)}</span>
                  </div>
                </div>
              </div>

              {/* Expense Section */}
              <div>
                <h3 className="font-bold text-slate-200 uppercase text-xs tracking-wider mb-3 pb-1 border-b border-slate-800">
                  II. Operating Expenses (OpEx)
                </h3>
                <div className="space-y-2">
                  {incomeData.expenses.byCategory.map((c) => (
                    <div key={c.category} className="flex justify-between py-1 border-b border-slate-900 text-xs">
                      <span className="text-slate-300">{c.category}</span>
                      <span className="font-medium text-slate-100">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t border-slate-700 font-bold text-amber-400">
                    <span>Total Operating Expenses</span>
                    <span>{formatCurrency(incomeData.expenses.totalOperatingExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex justify-between items-center font-extrabold text-base">
                <span className="text-slate-100">NET BUSINESS OPERATING PROFIT</span>
                <span className="text-emerald-400 text-xl">{formatCurrency(incomeData.netOperatingProfit)}</span>
              </div>
            </div>
          ) : activeTab === 'balance' && balanceData ? (
            /* Balance Sheet */
            <div className="space-y-8 text-sm">
              {/* Assets */}
              <div>
                <h3 className="font-bold text-slate-200 uppercase text-xs tracking-wider mb-3 pb-1 border-b border-slate-800">
                  Assets
                </h3>
                <div className="flex justify-between py-2 text-xs border-b border-slate-900">
                  <span className="text-slate-300">Cash & Liquid Equivalents</span>
                  <span className="font-semibold text-slate-100">{formatCurrency(balanceData.assets.cashAndEquivalents)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-cyan-400 border-t border-slate-700 mt-2">
                  <span>TOTAL ASSETS</span>
                  <span>{formatCurrency(balanceData.assets.totalAssets)}</span>
                </div>
              </div>

              {/* Equity & Partner Breakdown */}
              <div>
                <h3 className="font-bold text-slate-200 uppercase text-xs tracking-wider mb-3 pb-1 border-b border-slate-800">
                  Owner Capital & Partner Equity Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs mb-4">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 font-semibold">Partner</th>
                        <th className="py-2 font-semibold">Equity %</th>
                        <th className="py-2 font-semibold text-right">Capital Invested</th>
                        <th className="py-2 font-semibold text-right">Scaled Profit Share</th>
                        <th className="py-2 font-semibold text-right">Less Draws</th>
                        <th className="py-2 font-semibold text-right">Ending Equity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {balanceData.equity.partnerBreakdown.map((p) => (
                        <tr key={p.partnerId}>
                          <td className="py-2.5 font-bold text-slate-200">{p.name}</td>
                          <td className="py-2.5 text-slate-400">{p.equityPct}%</td>
                          <td className="py-2.5 text-right font-medium text-slate-300">{formatCurrency(p.capitalInvested)}</td>
                          <td className="py-2.5 text-right font-medium text-emerald-400">{formatCurrency(p.netProfitShare)}</td>
                          <td className="py-2.5 text-right font-medium text-amber-400">-{formatCurrency(p.totalWithdrawn)}</td>
                          <td className="py-2.5 text-right font-bold text-purple-300">{formatCurrency(p.endingEquity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between py-2 font-bold text-purple-300 border-t border-slate-700">
                  <span>TOTAL OWNER EQUITY</span>
                  <span>{formatCurrency(balanceData.equity.totalEquity)}</span>
                </div>
              </div>
            </div>
          ) : activeTab === 'draws' && drawsData ? (
            /* Partner Draws */
            <div className="space-y-6 text-xs">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-800">
                Partner Draw Transactions & Payout Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 font-semibold">Date</th>
                      <th className="py-2 font-semibold">Partner</th>
                      <th className="py-2 font-semibold">Category</th>
                      <th className="py-2 font-semibold">Description</th>
                      <th className="py-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {drawsData.draws?.map((d: any) => (
                      <tr key={d._id}>
                        <td className="py-2.5 text-slate-300">{new Date(d.transactionDate).toLocaleDateString()}</td>
                        <td className="py-2.5 font-bold text-slate-100">{d.partnerRef?.partnerName || 'Partner'}</td>
                        <td className="py-2.5 text-slate-300">{d.category}</td>
                        <td className="py-2.5 text-slate-400">{d.description || '-'}</td>
                        <td className="py-2.5 text-right font-bold text-amber-400">{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
