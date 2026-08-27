import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api.ts';
import { Users as UsersIcon, UserPlus, AlertCircle, X } from 'lucide-react';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/users', formData);
      setMessage(`User '${formData.name}' created successfully.`);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'STAFF' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <UsersIcon className="w-6 h-6 text-blue-400" />
            <span>User & RBAC Role Management</span>
          </h1>
          <p className="text-sm text-slate-400">Manage application users, assign permissions, and create accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-sm">
          {message}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/70 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">User ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3 rounded-r-xl">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono text-slate-500">#{u.id}</td>
                    <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                    <td className="px-4 py-3 text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        u.role === 'MANAGER' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-card bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span>Create User Account</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="e.g. john@stockpilot.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">RBAC Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="STAFF">STAFF (Inventory view & standard actions)</option>
                  <option value="MANAGER">MANAGER (Approvals, restocks & refunds)</option>
                  <option value="ADMIN">ADMIN (Full system & user access)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
