import React, { useState, useEffect } from 'react';
import {
  Mail, MessageSquare, Search, Filter, CheckCircle2, Clock,
  AlertCircle, Trash2, ExternalLink, ArrowUpDown, ChevronDown,
  X, User, Shield, RefreshCw, Send, Check, Hash, Calendar
} from 'lucide-react';
import { ContactInquiry, InquiryStatus, InquiryPriority } from '../../types.js';

interface AdminInquiriesPageProps {
  onNavigate: (path: string) => void;
}

export const AdminInquiriesPage: React.FC<AdminInquiriesPageProps> = ({ onNavigate }) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Detail Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (topicFilter !== 'all') params.set('topic', topicFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      params.set('sort', sortBy);

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`, {
        headers: getHeaders()
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          onNavigate('/login');
          return;
        }
        throw new Error('Failed to load inquiries');
      }

      const data = await res.json();
      setInquiries(data.inquiries || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [searchTerm, statusFilter, topicFilter, priorityFilter, sortBy]);

  const handleStatusChange = async (inquiryId: number, newStatus: InquiryStatus) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      const data = await res.json();

      // Update state locally
      setInquiries(prev => prev.map(item => item.id === inquiryId ? { ...item, status: newStatus } : item));
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
      }

      // Refresh metrics silently
      fetchInquiries();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (inquiryId: number, newPriority: InquiryPriority) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ priority: newPriority })
      });
      if (!res.ok) throw new Error('Failed to update priority');

      setInquiries(prev => prev.map(item => item.id === inquiryId ? { ...item, priority: newPriority } : item));
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry(prev => prev ? { ...prev, priority: newPriority } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update priority');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (inquiryId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete inquiry');

      setInquiries(prev => prev.filter(item => item.id !== inquiryId));
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry(null);
      }
      setDeleteConfirmId(null);
      fetchInquiries();
    } catch (err: any) {
      alert(err.message || 'Failed to delete inquiry');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            New
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: InquiryPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-red-950/80 text-red-300 border border-red-800/60">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-orange-950/80 text-orange-300 border border-orange-800/60">
            High
          </span>
        );
      case 'Normal':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-slate-800/80 text-slate-300 border border-slate-700/60">
            Normal
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-slate-900/60 text-slate-400 border border-slate-800">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Contact Inquiries</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review, triage, and reply to real student and university inquiries recorded in the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            ← Admin Console
          </button>
          <button
            onClick={fetchInquiries}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Total Inquiries</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{metrics.total}</p>
        </div>

        <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-blue-300">New Inquiries</span>
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">{metrics.new}</p>
        </div>

        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
          <span className="text-[11px] font-medium text-amber-300">In Progress</span>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">{metrics.inProgress}</p>
        </div>

        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <span className="text-[11px] font-medium text-emerald-300">Resolved</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{metrics.resolved}</p>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or inquiry ID..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Topic Filter */}
          <div className="md:col-span-3">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Topics</option>
              <option value="Student Roadmap Guidance">Student Roadmap Guidance</option>
              <option value="Skill Assessment Question">Skill Assessment Question</option>
              <option value="Feedback">Feedback</option>
              <option value="University / College Department">University / College Department</option>
              <option value="License">License</option>
              <option value="Employer Internship Verification">Employer Internship Verification</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer text-center"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inquiries Table / List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <span>Loading inquiries from database...</span>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mx-auto mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No inquiries yet</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || topicFilter !== 'all' || priorityFilter !== 'all'
                ? 'No inquiries match the selected search and filter criteria.'
                : 'Any incoming contact form submissions from students and partners will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Inquiry Ref</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Message Preview</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-blue-400 whitespace-nowrap">
                      {item.inquiry_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.full_name}</div>
                      <div className="text-[11px] text-slate-400">{item.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-200">
                        {item.topic}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="line-clamp-1 text-slate-300" title={item.message}>
                        {item.message}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(item.submitted_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.submitted_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPriorityBadge(item.priority)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInquiry(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                          View
                        </button>

                        <a
                          href={`mailto:${item.email}?subject=Re:%20${encodeURIComponent(item.topic)}%20-%20SkillPath%20AI%20[${item.inquiry_id}]`}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="Reply to sender via Email"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </a>

                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete inquiry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-400 font-bold">{selectedInquiry.inquiry_id}</span>
                  {getStatusBadge(selectedInquiry.status)}
                  {getPriorityBadge(selectedInquiry.priority)}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">Inquiry Details</h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sender Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Full Name</span>
                <span className="text-white font-medium text-sm mt-0.5 block">{selectedInquiry.full_name}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Email Address</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-blue-400 font-mono text-xs">{selectedInquiry.email}</span>
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re:%20${encodeURIComponent(selectedInquiry.topic)}%20-%20SkillPath%20AI%20[${selectedInquiry.inquiry_id}]`}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Reply
                  </a>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Topic</span>
                <span className="text-slate-200 mt-0.5 block">{selectedInquiry.topic}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Submitted At</span>
                <span className="text-slate-300 mt-0.5 block">
                  {new Date(selectedInquiry.submitted_at).toLocaleString()}
                </span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-800/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">User Identity Association</span>
                <span className="text-slate-400 text-[11px] mt-0.5 block">
                  {selectedInquiry.user_id ? (
                    <span className="text-emerald-400 font-mono">
                      Authenticated Student (User ID: #{selectedInquiry.user_id}
                      {selectedInquiry.firebase_uid ? ` • UID: ${selectedInquiry.firebase_uid}` : ''})
                    </span>
                  ) : (
                    <span className="text-slate-500">Visitor Inquiry (Unauthenticated Submission)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">Message Body</span>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Admin Management Actions */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Admin Triage Actions</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5">Change Status</label>
                  <div className="flex items-center gap-1.5">
                    {(['New', 'In Progress', 'Resolved'] as InquiryStatus[]).map((st) => (
                      <button
                        key={st}
                        disabled={actionLoading || selectedInquiry.status === st}
                        onClick={() => handleStatusChange(selectedInquiry.id, st)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          selectedInquiry.status === st
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        } disabled:opacity-50`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5">Change Priority</label>
                  <div className="flex items-center gap-1.5">
                    {(['Low', 'Normal', 'High', 'Urgent'] as InquiryPriority[]).map((pr) => (
                      <button
                        key={pr}
                        disabled={actionLoading || selectedInquiry.priority === pr}
                        onClick={() => handlePriorityChange(selectedInquiry.id, pr)}
                        className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          selectedInquiry.priority === pr
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        } disabled:opacity-50`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setDeleteConfirmId(selectedInquiry.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Inquiry</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re:%20${encodeURIComponent(selectedInquiry.topic)}%20-%20SkillPath%20AI%20[${selectedInquiry.inquiry_id}]`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Reply via Email</span>
                </a>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/80 border border-red-800/60 text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delete Inquiry?</h4>
                <p className="text-xs text-slate-400">This action will permanently remove the inquiry.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
