/**
 * Examinee List Page
 * Examinee management for staff
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Table, PageHeader } from '../components/common';
import { listExaminees } from '../api/examineesApi';
import { USER_STATUS } from '../constants/constants';
import { GraduationCap, UserPlus, Eye } from 'lucide-react';

const ExamineeList = () => {
  const navigate = useNavigate();
  const [examinees, setExaminees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });

  // Debounce search term - 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, page: 0 }));
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
      if (debouncedSearchTerm.trim()) {
        params.searchTerm = debouncedSearchTerm.trim();
      }
      const response = await listExaminees(params);
      if (response.success) {
        setExaminees(response.data?.list || []);
        setPagination(prev => ({ ...prev, total: response.data?.totalRecords || 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch examinees:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchExaminees();
  }, [fetchExaminees]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getInitials = (examinee) => {
    const initials = `${examinee.firstName?.[0] || ''}${examinee.lastName?.[0] || ''}`.trim();
    return initials || (examinee.email?.[0]?.toUpperCase() || '?');
  };

  const columns = [
    {
      key: 'name',
      title: 'Examinee',
      render: (examinee) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/90 to-primary-500/80 flex items-center justify-center text-white font-semibold">
            {getInitials(examinee)}
          </div>
          <div>
            <p className="text-white font-semibold">
              {examinee.firstName} {examinee.lastName}
            </p>
            <p className="text-xs text-slate-400">{examinee.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: (examinee) => (
        <span className="text-gray-200">{examinee.email}</span>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (examinee) => (
        <span className="text-gray-200">{examinee.phone || '-'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (examinee) => (
        <Badge variant={examinee.status === USER_STATUS.ACTIVE ? 'success' : 'danger'} dot>
          {examinee.status === USER_STATUS.ACTIVE ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (examinee) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/examinees/${examinee.id}`)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<GraduationCap className="w-5 h-5" />}
        title="Examinees"
        subtitle="Manage and monitor your examinees at a glance"
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        actions={
          <Button variant="primary" onClick={() => navigate('/examinees/invite')}>
            <UserPlus className="w-4 h-4" />
            Invite Examinee
          </Button>
        }
      />

      <div className="space-y-6">
        <Table
          columns={columns}
          data={examinees}
          rowKey="id"
          isLoading={loading}
          emptyState={
            <Card className="text-center py-12 w-full">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg">{searchTerm ? 'No examinees match your search' : 'No examinees found'}</p>
                {!searchTerm && (
                  <Button variant="primary" className="mt-4" onClick={() => navigate('/examinees/invite')}>
                    + Invite Examinee
                  </Button>
                )}
              </div>
            </Card>
          }
        />

        {/* Pagination */}
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              disabled={pagination.page === 0}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-gray-400">
              Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="ghost"
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamineeList;
