import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Transaction, TransactionType } from '../types';
import { RoleBadge } from '../components/RoleBadge';
import { formatCurrency } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Filter,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  Calendar,
  Lock,
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'income_sale' as TransactionType,
    amount: '',
    category: 'Enterprise Software Licenses',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const categories = [
    'Enterprise Software Licenses',
    'Client Consulting',
    'Retainer Services',
    'Hardware Sales',
    'Office Rent',
    'Cloud Infrastructure (AWS/GCP)',
    'Staff Salaries',
    'Marketing & Ads',
    'Legal & Accounting',
    'Software Tools',
    'Initial Equity Injection',
    'Partner Dividend Payout',
  ];

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/transactions', {
        ...formData,
        amount: Number(formData.amount),
      });
      setSuccessMsg('Transaction logged successfully!');
      setIsAddModalOpen(false);
      setFormData({
        type: 'income_sale',
        amount: '',
        category: 'Enterprise Software Licenses',
        description: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error adding transaction');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setError('');
    try {
      await api.put(`/transactions/${editingTransaction._id}`, {
        type: formData.type,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        transactionDate: formData.transactionDate,
      });
      setSuccessMsg('Transaction updated successfully');
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating transaction.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this ledger entry?')) return;
    setError('');
    try {
      await api.delete(`/transactions/${id}`);
      setSuccessMsg('Transaction deleted successfully');
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Only Super Admin is authorized to delete transactions.');
    }
  };

  const handleToggleStatus = async (tx: Transaction) => {
    if (user?.role !== 'super_admin') {
      setError('Only Super Admin can change transaction approval status.');
      return;
    }
    const newStatus = tx.status === 'approved' ? 'pending' : 'approved';
    try {
      await api.patch(`/transactions/${tx._id}/status`, { status: newStatus });
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.category,
      description: tx.description || '',
      transactionDate: new Date(tx.transactionDate).toISOString().split('T')[0],
    });
  };



  return (
    <div className="space-y-6">
      {/* Page Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Transaction Manager
          </h1>
          <p className="text-sm text-slate-400">
            Log and review raw revenue sales, operating expenses, capital, and draws.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              type: 'income_sale',
              amount: '',
              category: 'Enterprise Software Licenses',
              description: '',
              transactionDate: new Date().toISOString().split('T')[0],
            });
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all w-fit"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
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

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Transaction Types</option>
            <option value="income_sale">Income / Sales</option>
            <option value="operating_expense">Operating Expense</option>
            <option value="capital_injection">Capital Injection</option>
            <option value="partner_draw">Partner Draw</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Subjects</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Date range start */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />

          {/* Date range end */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </form>
      </div>

      {/* Transactions Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2"></div>
            Loading ledger records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-4 font-bold">Type</th>
                  <th className="py-3.5 px-4 font-bold">Subject</th>
                  <th className="py-3.5 px-4 font-bold">Description</th>
                  <th className="py-3.5 px-4 font-bold">Logged By</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Amount</th>
                  <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
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
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{tx.category}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{tx.description || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{tx.loggedBy?.name || 'System'}</div>
                      <div className="text-[10px] text-slate-500">{tx.loggedBy?.role}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(tx)}
                        title={user?.role === 'super_admin' ? 'Click to toggle status' : 'Status set by Super Admin'}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}
                      >
                        {tx.status === 'approved' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Approved
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Pending
                          </>
                        )}
                      </button>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-black text-sm ${
                      tx.type === 'income_sale' || tx.type === 'capital_injection'
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }`}>
                      {tx.type === 'operating_expense' || tx.type === 'partner_draw' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {(() => {
                        const isSuperAdmin = user?.role === 'super_admin';
                        const loggedById = typeof tx.loggedBy === 'object' ? tx.loggedBy?._id : tx.loggedBy;
                        const isCreator = loggedById === user?._id;
                        const canEdit = isSuperAdmin || isCreator;
                        const canDelete = isSuperAdmin;

                        if (!canEdit && !canDelete) {
                          return <span className="text-slate-600 font-mono text-[10px]">-</span>;
                        }

                        return (
                          <div className="flex items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(tx)}
                                title={isSuperAdmin ? "Edit Entry (Super Admin)" : "Edit Your Entry"}
                                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(tx._id)}
                                title="Delete Entry (Super Admin)"
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {(isAddModalOpen || editingTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-lg">
                {editingTransaction ? 'Edit Transaction (Super Admin)' : 'Log New Financial Transaction'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTransaction(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingTransaction ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="income_sale">Income / Sales Revenue</option>
                  <option value="operating_expense">Operating Expense (OpEx)</option>
                  {user?.role !== 'staff' && (
                    <>
                      <option value="capital_injection">Capital Injection</option>
                      <option value="partner_draw">Partner Draw / Dividend</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 5000.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Rent / Client Project Payment / Salaries"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or invoice reference details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTransaction(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  {editingTransaction ? 'Save Changes' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
