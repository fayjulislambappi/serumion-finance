import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { EquitySummaryResponse, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<EquitySummaryResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch real transactions
      const txRes = await api.get('/transactions');
      setRecentTransactions(txRes.data.slice(0, 6));

      // 2. Fetch real equity summary
      if (user?.role === 'super_admin' || user?.role === 'partner') {
        const equityRes = await api.get('/equity/summary');
        setSummaryData(equityRes.data);
      } else {
        // Staff user real metrics calculation
        const sales = txRes.data
          .filter((t: Transaction) => t.type === 'income_sale' && t.status === 'approved')
          .reduce((acc: number, t: Transaction) => acc + t.amount, 0);
        const expenses = txRes.data
          .filter((t: Transaction) => t.type === 'operating_expense' && t.status === 'approved')
          .reduce((acc: number, t: Transaction) => acc + t.amount, 0);
        setSummaryData({
          metrics: {
            grossSales: sales,
            operatingExpenses: expenses,
            netBusinessProfit: sales - expenses,
            totalCapitalInvested: 0,
            totalWithdrawn: 0,
            totalOwnerEquity: sales - expenses,
          },
          partners: [],
        });
      }
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Transform real transactions into monthly trend data
  const getMonthlyTrendData = () => {
    const monthlyMap: { [key: string]: { month: string; income: number; expenses: number } } = {};

    recentTransactions.forEach((tx) => {
      const date = new Date(tx.transactionDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      }

      if (tx.type === 'income_sale') {
        monthlyMap[monthKey].income += tx.amount;
      } else if (tx.type === 'operating_expense') {
        monthlyMap[monthKey].expenses += tx.amount;
      }
    });

    return Object.values(monthlyMap);
  };

  const trendData = getMonthlyTrendData();

  const partnerPieData = summaryData?.partners.map((p) => ({
    name: p.partnerName,
    value: p.equitySharePercentage,
    capital: p.totalCapitalInvested,
  })) || [];

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400 font-medium">Loading Financial Ledgers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time revenue, expense metrics, and owner equity calculations.
          </p>
        </div>

      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 4 Core Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Sales */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 tracking-tight">
            {formatCurrency(summaryData?.metrics.grossSales)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Approved Revenue Entries</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 tracking-tight">
            {formatCurrency(summaryData?.metrics.operatingExpenses)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>OpEx & Payroll Costs</span>
          </div>
        </div>

        {/* Net Business Profit */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Business Profit</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(summaryData?.metrics.netBusinessProfit)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <span>Sales minus Operating Expenses</span>
          </div>
        </div>

        {/* Total Owner Equity */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Owner Equity</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 tracking-tight">
            {formatCurrency(summaryData?.metrics.totalOwnerEquity)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
            <span>Capital + Net Profit - Draws</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Monthly Income vs Operating Expenses</h3>
              <p className="text-xs text-slate-400">Financial trend over recent billing periods</p>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {trendData.length === 0 ? (
              <div className="flex flex-col items-center text-center p-8 text-slate-500">
                <Inbox className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">No Real Transaction Data Recorded Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Log sales and operating expenses in the Transaction Manager to generate real-time financial charts.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => `৳${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#ffffff',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Gross Income" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Operating Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Partner Equity Distribution Donut Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-100 text-base">Partner Equity Shares</h3>
              <PieIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400 mb-4">Ownership percentage allocation across partners</p>

            <div className="h-48 w-full flex items-center justify-center">
              {partnerPieData.length === 0 ? (
                <div className="flex flex-col items-center text-center p-6 text-slate-500">
                  <Inbox className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">No Partners Added Yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Super Admin can create partner profiles in User Management.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partnerPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {partnerPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#ffffff',
                      }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff' }}
                      formatter={(val: any) => [`${val}% Equity`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Legend Items */}
          {partnerPieData.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {partnerPieData.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></span>
                    <span className="font-medium text-slate-300">{p.name}</span>
                  </div>
                  <span className="font-bold text-slate-100">{p.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base">Recent Ledger Entries</h3>
            <p className="text-xs text-slate-400">Latest financial activities logged in the system</p>
          </div>
          <a
            href="/transactions"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all"
          >
            View All Transactions &rarr;
          </a>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
            <Inbox className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
            <span>No transaction entries logged in the database yet. Go to Transaction Manager to record entries.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Logged By</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(tx.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          tx.type === 'income_sale'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.type === 'operating_expense'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : tx.type === 'capital_injection'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{tx.category}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{tx.description || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-300">{tx.loggedBy?.name || 'System'}</td>
                    <td className={`py-3.5 px-4 text-right font-bold ${
                      tx.type === 'income_sale' || tx.type === 'capital_injection'
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }`}>
                      {tx.type === 'operating_expense' || tx.type === 'partner_draw' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
