/**
 * Students List Page
 * Admin student directory with summary stats, search, and performance table
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, PageHeader } from '../components/common';
import { listStudents } from '../api/studentsApi';
import {
  GraduationCap,
  UserPlus,
  Search,
  Calendar,
  TrendingUp,
  Users,
  Activity,
  BookOpen,
  Target,
} from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatJoinedDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '—';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

const SummaryCard = ({ label, value, icon: Icon, iconClass }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 hover:border-white/20 transition-colors">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  </div>
);

const EMPTY_SUMMARY = {
  totalStudents: 0,
  activeThisWeek: 0,
  avgTestsPerStudent: 0,
  avgScore: 0,
};

const ExamineeList = () => {
  const navigate = useNavigate();
  const [examinees, setExaminees] = useState([]);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });

  const isAllView = !debouncedSearchTerm.trim();
  const summary = globalSummary ?? EMPTY_SUMMARY;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination((prev) => ({ ...prev, page: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchExaminees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      };
      const trimmedSearch = debouncedSearchTerm.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      const response = await listStudents(params);
      if (response.success) {
        setExaminees(response.data?.students || []);
        setPagination((prev) => ({ ...prev, total: response.data?.total || 0 }));
        if (!trimmedSearch && response.data?.summary) {
          setGlobalSummary(response.data.summary);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchExaminees();
  }, [fetchExaminees]);

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize) || 1);
  const rangeStart = pagination.total === 0 ? 0 : pagination.page * pagination.pageSize + 1;
  const rangeEnd = Math.min((pagination.page + 1) * pagination.pageSize, pagination.total);

  const columns = [
    {
      key: 'student',
      title: 'Student',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">
            {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'joined',
      title: 'Joined',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{formatJoinedDate(row.registeredAt)}</span>
        </div>
      ),
    },
    {
      key: 'testsTaken',
      title: 'Tests Taken',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/examinees/${row.id}`);
          }}
          className="text-blue-400 hover:text-blue-300 font-medium text-sm underline-offset-2 hover:underline"
        >
          {row.testsCompleted ?? 0} test{(row.testsCompleted ?? 0) !== 1 ? 's' : ''}
        </button>
      ),
    },
    {
      key: 'avgScore',
      title: 'Avg. Score',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-medium">{row.avgScore ?? 0}%</span>
          {(row.avgScore ?? 0) > 0 && (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
      ),
    },
    {
      key: 'totalSpent',
      title: 'Total Spent',
      render: (row) => (
        <span className="font-semibold text-emerald-400">
          {formatCurrency(row.totalSpent)}
        </span>
      ),
    },
    {
      key: 'lastActive',
      title: 'Last Active',
      render: (row) => (
        <span className="text-slate-400">{formatRelativeTime(row.lastActivity)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<GraduationCap className="w-5 h-5" />}
        title="Students"
        subtitle={
          isAllView
            ? 'All students enrolled in your tests'
            : 'Search results'
        }
        actions={
          <Button variant="primary" onClick={() => navigate('/examinees/invite')}>
            <UserPlus className="w-4 h-4" />
            Invite Student
          </Button>
        }
      />

      <div className="space-y-5">
        {isAllView && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Students"
              value={summary.totalStudents?.toLocaleString('en-IN') ?? '0'}
              icon={Users}
              iconClass="bg-blue-500/20 text-blue-400"
            />
            <SummaryCard
              label="Active This Week"
              value={summary.activeThisWeek?.toLocaleString('en-IN') ?? '0'}
              icon={Activity}
              iconClass="bg-violet-500/20 text-violet-400"
            />
            <SummaryCard
              label="Avg. Tests per Student"
              value={summary.avgTestsPerStudent ?? '0'}
              icon={BookOpen}
              iconClass="bg-amber-500/20 text-amber-400"
            />
            <SummaryCard
              label="Avg. Score"
              value={`${summary.avgScore ?? 0}%`}
              icon={Target}
              iconClass="bg-emerald-500/20 text-emerald-400"
            />
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
          />
        </div>

        <Table
          columns={columns}
          data={examinees}
          rowKey="id"
          isLoading={loading}
          onRowClick={(row) => navigate(`/examinees/${row.id}`)}
          emptyState={
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
              <p className="text-white font-medium">
                {debouncedSearchTerm ? 'No students match your search' : 'No students found'}
              </p>
              {debouncedSearchTerm && (
                <p className="text-sm text-slate-400 mt-1">
                  Try a different name or email
                </p>
              )}
              {!debouncedSearchTerm && (
                <Button variant="primary" className="mt-4" onClick={() => navigate('/examinees/invite')}>
                  <UserPlus className="w-4 h-4" />
                  Invite Student
                </Button>
              )}
            </div>
          }
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-sm text-slate-400">
            {pagination.total === 0
              ? 'Showing 0 students'
              : `Showing ${rangeStart}–${rangeEnd} of ${pagination.total.toLocaleString('en-IN')} students`}
          </p>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Per page
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  const pageSize = Number(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 0, pageSize }));
                }}
                className="bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <Button
              variant="ghost"
              disabled={pagination.page === 0 || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-400 min-w-[7rem] text-center">
              Page {pagination.page + 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={pagination.page + 1 >= totalPages || pagination.total === 0 || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamineeList;
