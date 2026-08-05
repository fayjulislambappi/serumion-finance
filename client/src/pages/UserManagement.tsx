import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, UserRole, PartnerProfile } from '../types';
import { RoleBadge } from '../components/RoleBadge';
import { formatCurrency } from '../utils/formatters';
import { Users, ShieldCheck, Edit2, Trash2, X, Plus, UserPlus } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'partner' as UserRole,
    equitySharePercentage: 0,
    profitScaleFactor: 1.0,
    totalCapitalInvested: 0,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'partner',
      equitySharePercentage: 0,
      profitScaleFactor: 1.0,
      totalCapitalInvested: 0,
    });
    setIsAddModalOpen(true);
  };

  const getProfile = (u: User): PartnerProfile | null => {
    const p = u.partnerProfileRef || u.partnerProfile;
    return p && typeof p === 'object' ? (p as PartnerProfile) : null;
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    const profile = getProfile(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      equitySharePercentage: profile?.equitySharePercentage || 0,
      profitScaleFactor: profile?.profitScaleFactor !== undefined ? profile.profitScaleFactor : 1.0,
      totalCapitalInvested: profile?.totalCapitalInvested || 0,
    });
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);
        setSuccessMsg(`Updated user account: ${formData.name}`);
      } else {
        await api.post('/users', formData);
        setSuccessMsg(`Created new account for ${formData.name}`);
      }
      setIsAddModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user account "${name}"?`)) return;
    setError('');
    try {
      await api.delete(`/users/${id}`);
      setSuccessMsg(`User "${name}" deleted successfully.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            System User & Role Management
          </h1>
          <p className="text-sm text-slate-400">
            Super Admin panel to manage access credentials, partner profiles, and equity share rules.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all w-fit"
        >
          <UserPlus className="w-4 h-4" /> Add New User / Partner
        </button>
      </div>

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

      {/* Users Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">User Name</th>
                  <th className="py-3.5 px-4 font-bold">Email</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Equity Share %</th>
                  <th className="py-3.5 px-4 font-bold">Scale Factor</th>
                  <th className="py-3.5 px-4 font-bold text-right">Capital Invested</th>
                  <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const profile = getProfile(u);
                  return (
                    <tr key={u._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100">{u.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-cyan-400">
                        {profile ? `${profile.equitySharePercentage}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-purple-300">
                        {profile ? `${profile.profitScaleFactor}x` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                        {profile ? formatCurrency(profile.totalCapitalInvested) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Role & Equity Rules"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u._id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">
                {editingUser ? `Edit Account: ${editingUser.name}` : 'Add New System Account'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@serumion.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editingUser ? 'Password (Leave blank to keep existing)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder="Set account password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="super_admin">super_admin (Master Full Control)</option>
                  <option value="partner">partner (View Financial Statements & Personal Equity)</option>
                  <option value="staff">staff (Log Daily Sales & Expenses Only)</option>
                </select>
              </div>

              {formData.role === 'partner' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 space-y-3">
                  <h4 className="font-bold text-cyan-400 text-xs uppercase tracking-wider">Partner Profile Parameters</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Equity Share Percentage (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={formData.equitySharePercentage}
                      onChange={(e) => setFormData({ ...formData, equitySharePercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Profit Scale Factor</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.profitScaleFactor}
                      onChange={(e) => setFormData({ ...formData, profitScaleFactor: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Capital Invested (৳ BDT)</label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={formData.totalCapitalInvested}
                      onChange={(e) => setFormData({ ...formData, totalCapitalInvested: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
