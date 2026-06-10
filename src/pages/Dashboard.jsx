/**
 * Dashboard Page
 * Creator/admin overview — stats, charts, performance, categories, top tests
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, PageHeader, Loader } from '../components/common';
import { generateInvitation } from '../api/examineesApi';
import { getCreatorOverview } from '../api/creatorDashboardApi';
import { useAuth, useToast } from '../context';
import {
  LayoutDashboard,
  IndianRupee,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  BarChart3,
  UserPlus,
  BookOpen,
  PieChart as PieChartIcon,
  Trophy,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#06b6d4', '#eab308'];

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getDefaultDateRange = (days = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

const formatRangeLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
};

const getChartGroupBy = (startDate, endDate) => {
  const days = (new Date(endDate) - new Date(startDate)) / 86400000;
  if (days > 120) return 'month';
  if (days > 45) return 'week';
  return 'day';
};

const formatChartDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const truncateLabel = (text, max = 18) => {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const timeAgo = (dateString) => {
  if (!dateString) return '—';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const buildRevenueChartData = (revenueData) => {
  const map = new Map();
  for (const row of revenueData?.testRevenue || []) {
    const key = row.period;
    map.set(key, (map.get(key) || 0) + Number(row.revenue || 0));
  }
  for (const row of revenueData?.seriesRevenue || []) {
    const key = row.period;
    map.set(key, (map.get(key) || 0) + Number(row.revenue || 0));
  }
  return Array.from(map.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([period, revenue]) => ({
      date: formatChartDate(period),
      revenue: Math.round(revenue),
    }));
};

const TrendBadge = ({ value, suffix = '%' }) => {
  const n = Number(value || 0);
  const isUp = n >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      <Icon className="w-3.5 h-3.5" />
      {isUp ? '+' : ''}{n.toFixed(1)}{suffix}
    </span>
  );
};

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-white font-semibold mb-1">{label}</p>
      <p className="text-sm text-emerald-400">
        Revenue: <span className="font-bold">₹{payload[0].value?.toLocaleString('en-IN')}</span>
      </p>
    </div>
  );
};

const StudentsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-white font-semibold mb-1">{label}</p>
      <p className="text-sm text-blue-400">
        New Students: <span className="font-bold">{payload[0].value}</span>
      </p>
    </div>
  );
};

const PerformanceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}:{' '}
          <span className="font-bold">
            {entry.name.includes('Score')
              ? `${entry.value}%`
              : entry.name.includes('Revenue')
                ? `₹${Number(entry.value).toLocaleString('en-IN')}`
                : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-white font-semibold">{item.name}</p>
      <p className="text-sm text-gray-300">{item.studentCount} students · {item.percentage}%</p>
      <p className="text-sm text-emerald-400">{formatCurrency(item.revenue)}</p>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [newStudentsData, setNewStudentsData] = useState(null);
  const [performanceTests, setPerformanceTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topTests, setTopTests] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [appliedRange, setAppliedRange] = useState(getDefaultDateRange);

  const rangeLabel = formatRangeLabel(appliedRange.startDate, appliedRange.endDate);
  const chartGroupBy = useMemo(
    () => getChartGroupBy(appliedRange.startDate, appliedRange.endDate),
    [appliedRange.startDate, appliedRange.endDate]
  );
  const fetchIdRef = useRef(0);

  const handleDateChange = (e) => {
    setDateRange((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    setAppliedRange({ ...dateRange });
  };

  const setPresetRange = (days) => {
    const range = getDefaultDateRange(days);
    setDateRange(range);
    setAppliedRange(range);
  };

  useEffect(() => {
    if (!appliedRange.startDate || !appliedRange.endDate) return;

    const fetchId = ++fetchIdRef.current;

    const fetchDashboard = async () => {
      setLoading(true);
      setChartsLoading(true);
      try {
        const response = await getCreatorOverview({
          startDate: appliedRange.startDate,
          endDate: appliedRange.endDate,
          groupBy: chartGroupBy,
          performanceLimit: 8,
          topLimit: 5,
          purchasesLimit: 8,
        });

        if (fetchId !== fetchIdRef.current) return;

        if (response.success && response.data) {
          const d = response.data;
          setSummary(d.summary || null);
          setRevenueData(d.revenue || null);
          setNewStudentsData(d.newStudents || null);
          setPerformanceTests(d.testsPerformance?.tests || []);
          setCategories(d.categories?.categories || []);
          setTopTests(d.topTests?.tests || []);
          setRecentPurchases(d.recentPurchases?.purchases || []);
        }
      } catch (error) {
        if (fetchId === fetchIdRef.current) {
          console.error('Failed to load dashboard:', error);
        }
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false);
          setChartsLoading(false);
        }
      }
    };

    fetchDashboard();
  }, [appliedRange.startDate, appliedRange.endDate, chartGroupBy]);

  const revenueChartData = useMemo(
    () => buildRevenueChartData(revenueData),
    [revenueData]
  );

  const studentsChartData = useMemo(
    () => (newStudentsData?.timeline || []).map((item) => ({
      date: formatChartDate(item.period),
      students: item.newStudents || 0,
    })),
    [newStudentsData]
  );

  const performanceChartData = useMemo(
    () => performanceTests.map((t) => ({
      name: truncateLabel(t.name),
      fullName: t.name,
      enrolled: t.purchases,
      avgScore: t.avgScore,
      revenue: t.revenue,
    })),
    [performanceTests]
  );

  const categoryPieData = useMemo(
    () => categories
      .filter((c) => c.studentCount > 0)
      .map((c) => ({
        name: c.category,
        code: c.code,
        value: c.studentCount,
        studentCount: c.studentCount,
        percentage: c.percentage,
        revenue: c.revenue,
      })),
    [categories]
  );

  const renderPieLabel = ({ name, percent }) => {
    if (percent < 0.05) return '';
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  const stats = summary ? [
    {
      label: 'Total Revenue',
      value: formatCurrency(summary.revenue?.total),
      change: summary.revenue?.percentChange,
      icon: IndianRupee,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Active Students',
      value: Number(summary.activeStudents?.total ?? 0).toLocaleString('en-IN'),
      change: summary.activeStudents?.percentChange,
      icon: Users,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Published Tests',
      value: String(summary.publishedTests?.total ?? 0),
      change: summary.publishedTests?.percentChange,
      icon: BookOpen,
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      label: 'Avg. Score',
      value: `${summary.avgScore?.value ?? 0}%`,
      change: summary.avgScore?.percentChange,
      icon: TrendingUp,
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
  ] : [];

  const handleGenerateAndCopyInvite = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const response = await generateInvitation({});
      if (response.success) {
        const token = response.data.token;
        const link = `${window.location.origin}/register/examinee?t=${token}`;
        await navigator.clipboard.writeText(link);
        toast.success('Invitation link generated and copied!');
      } else {
        toast.error('Failed to generate invitation link');
      }
    } catch (error) {
      console.error('Failed to generate invitation:', error);
      toast.error('Failed to generate invitation link');
    } finally {
      setGenerating(false);
    }
  };

  const welcomeName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.email;

  const studentName = (student) => {
    if (!student) return 'Unknown';
    const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return name || student.email;
  };

  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard className="w-5 h-5" />}
        title="Dashboard"
        subtitle={welcomeName
          ? `Welcome back, ${welcomeName}! Here's what's happening with your tests.`
          : "Welcome back! Here's what's happening with your tests."}
      />

      <div className="space-y-6">
        {/* Date range filter */}
        <Card>
          <Card.Content className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 font-medium">Date Range:</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label className="text-xs text-gray-500">From</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  max={dateRange.endDate || undefined}
                  className="px-3 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">To</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  min={dateRange.startDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <Button variant="primary" size="sm" onClick={applyDateRange}>
                Apply
              </Button>

              <div className="flex flex-wrap gap-2 ml-auto">
                {[
                  { label: '7 days', days: 7 },
                  { label: '30 days', days: 30 },
                  { label: '90 days', days: 90 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setPresetRange(preset.days)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      appliedRange.startDate === getDefaultDateRange(preset.days).startDate
                        && appliedRange.endDate === getDefaultDateRange(preset.days).endDate
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Last {preset.label}
                  </button>
                ))}
              </div>
            </div>
            {rangeLabel && (
              <p className="text-xs text-gray-500 mt-3">
                Showing data for <span className="text-gray-300">{rangeLabel}</span>
              </p>
            )}
          </Card.Content>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-10">
              <Loader size="md" />
            </div>
          ) : (
            stats.map((stat, index) => {
              const IconComp = stat.icon;
              return (
                <Card key={index} hover>
                  <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
                    <IconComp className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  <div className="mt-2">
                    <TrendBadge value={stat.change} />
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Revenue + New Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                Revenue {rangeLabel ? `(${rangeLabel})` : ''}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {chartsLoading ? (
                <div className="h-[280px] flex items-center justify-center"><Loader size="md" /></div>
              ) : revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="creatorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#creatorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-500">No paid revenue in this period</div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                New Students {rangeLabel ? `(${rangeLabel})` : ''}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {chartsLoading ? (
                <div className="h-[280px] flex items-center justify-center"><Loader size="md" /></div>
              ) : studentsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={studentsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} allowDecimals={false} />
                    <Tooltip content={<StudentsTooltip />} />
                    <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Students" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-500">No new students in this period</div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Test-wise Performance — grouped bar chart */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Test-wise Performance
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {chartsLoading ? (
              <div className="h-[360px] flex items-center justify-center"><Loader size="md" /></div>
            ) : performanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={performanceChartData} barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px' }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '11px' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#64748b" style={{ fontSize: '11px' }} />
                  <Tooltip content={<PerformanceTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '12px' }} iconType="circle" />
                  <Bar yAxisId="left" dataKey="enrolled" fill="#3b82f6" name="Enrolled Students" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avgScore" fill="#10b981" name="Avg Score (%)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="revenue" fill="#f97316" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[360px] flex items-center justify-center text-gray-500">
                No paid test performance data yet
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Category pie + Top performing tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-400" />
                Test Category Distribution
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {chartsLoading ? (
                <div className="h-[320px] flex items-center justify-center"><Loader size="md" /></div>
              ) : categoryPieData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        label={renderPieLabel}
                        labelLine={false}
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                    {categoryPieData.map((cat, index) => (
                      <div key={cat.name} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-white font-medium">{cat.name}</span>
                        <span className="text-gray-400 ml-auto whitespace-nowrap">
                          {cat.percentage}% · {cat.studentCount} students
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-gray-500 text-center px-4">
                  <p>No paid category data for this date range</p>
                  <p className="text-xs mt-2 text-gray-600">
                    Assign a test type or template when creating tests so categories appear here
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Top Performing Tests
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {chartsLoading ? (
                  <div className="py-12 flex justify-center"><Loader size="md" /></div>
                ) : topTests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No paid tests yet</p>
                ) : (
                  topTests.map((test) => (
                    <div
                      key={test.testId}
                      className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                        {test.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{test.name}</p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {test.purchaseCount} students · Avg score {test.avgScore}%
                        </p>
                      </div>
                      <p className="text-lg font-bold text-emerald-400 shrink-0">
                        {formatCurrency(test.revenue)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Recent Purchases table */}
        <Card>
          <Card.Header>
            <Card.Title>Recent Purchases</Card.Title>
          </Card.Header>
          <Card.Content>
            {chartsLoading ? (
              <div className="py-10 flex justify-center"><Loader size="md" /></div>
            ) : recentPurchases.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No paid purchases yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Test / Series</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium text-right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.map((purchase) => (
                      <tr
                        key={`${purchase.type}-${purchase.id}`}
                        className="border-b border-white/5 hover:bg-slate-800/30"
                      >
                        <td className="py-3 text-white font-medium">
                          {studentName(purchase.student)}
                        </td>
                        <td className="py-3 text-gray-300">{purchase.itemName}</td>
                        <td className="py-3 text-right text-emerald-400 font-semibold">
                          {formatCurrency(purchase.pricePaid)}
                        </td>
                        <td className="py-3 text-right text-gray-500 text-sm">
                          {timeAgo(purchase.purchaseDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Quick actions */}
        <Card>
          <Card.Header><Card.Title>Quick Actions</Card.Title></Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => navigate('/tests/new')}>
                <Plus className="w-4 h-4" /> Create Test
              </Button>
              <Button variant="accent" onClick={() => navigate('/questions/new')}>
                <Plus className="w-4 h-4" /> Add Question
              </Button>
              <Button variant="success" onClick={handleGenerateAndCopyInvite} isLoading={generating}>
                <UserPlus className="w-4 h-4" /> Invite Students
              </Button>
              <Button variant="outline" onClick={() => navigate('/examinees')}>
                <Users className="w-4 h-4" /> View Students
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
