/**
 * Examinee Dashboard Page
 * Dashboard for students/examinees with stats, charts, and test breakdown
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, PageHeader, Loader } from '../components/common';
import { useAuth } from '../context';
import { getExamineeStats, getExamineeGraph } from '../api';
import {
  LayoutDashboard,
  CheckCircle,
  Pause,
  Target,
  Clock,
  TrendingUp,
  Calendar,
  BarChart2,
  BookOpen,
  Award,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const ExamineeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [groupBy, setGroupBy] = useState('day');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [error, setError] = useState(null);

  // Calculate default date range (last 30 days)
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const range = dateRange.startDate && dateRange.endDate
        ? dateRange
        : getDefaultDateRange();

      const [statsRes, graphRes] = await Promise.all([
        getExamineeStats(),
        getExamineeGraph({ ...range, groupBy }),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (graphRes.success) {
        setGraphData(graphRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set default date range on mount
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchData();
    }
  }, [dateRange, groupBy]);

  const handleDateChange = (e) => {
    setDateRange(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value?.toFixed(1) || 0}</span>
              {entry.name.includes('Score') || entry.name.includes('Accuracy') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-gray-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <PageHeader
          icon={<LayoutDashboard className="w-5 h-5" />}
          title="Student Dashboard"
          subtitle="Welcome to your learning portal"
        />
        <Card className="text-center py-12">
          <p className="text-red-400 mb-4">{error || 'Failed to load dashboard'}</p>
          <Button variant="primary" onClick={fetchData}>Retry</Button>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: 'Tests Completed', value: stats.testsCompleted || 0, icon: CheckCircle, color: 'emerald' },
    { label: 'Tests Paused', value: stats.testsPaused || 0, icon: Pause, color: 'yellow' },
    { label: 'Average Score', value: `${(stats.averageScore || 0).toFixed(1)}%`, icon: Target, color: 'primary' },
    { label: 'Best Score', value: `${(stats.bestScore || 0).toFixed(1)}%`, icon: Award, color: 'purple' },
    { label: 'Accuracy', value: `${(stats.accuracyPercentage || 0).toFixed(0)}%`, icon: TrendingUp, color: 'cyan' },
    { label: 'Time Spent', value: formatTime(stats.totalTimeSpentMinutes), icon: Clock, color: 'slate' },
    { label: 'Last 7 Days', value: stats.testsLast7Days || 0, icon: Calendar, color: 'blue' },
    { label: 'Active Purchases', value: stats.activeTestPurchases || 0, icon: BookOpen, color: 'pink' },
  ];

  // Prepare chart data
  const chartData = graphData?.timeline?.map(item => ({
    date: formatDate(item.period),
    fullDate: item.period,
    avgScore: item.avgScore || 0,
    bestScore: item.bestScore || 0,
    accuracy: item.accuracy || 0,
    tests: item.testsTaken || 0,
    timeSpent: item.timeSpentMinutes || 0
  })) || [];

  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard className="w-5 h-5" />}
        title="Student Dashboard"
        subtitle="Welcome to your learning portal"
      />

      <div className="space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary-600/20 to-accent-600/20 border-primary-500/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Hello, {user?.firstName || user?.email || 'Student'}! 👋
              </h2>
              <p className="text-gray-300 mt-1">
                {stats.lastTestDate
                  ? `Last test: ${formatDate(stats.lastTestDate)}`
                  : 'Ready to start learning?'
                }
              </p>
            </div>
            <Link to="/examinee/tests">
              <Button variant="primary">
                Take a Test
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const IconComp = stat.icon;
            return (
              <Card key={index} className="hover:bg-slate-800/60 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                    <IconComp className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <Card.Content className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 font-medium">Filters:</span>
              </div>

              {/* Date Range Inputs */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">From:</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="px-3 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">To:</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="px-3 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Group By Buttons */}
              <div className="flex gap-2 ml-auto">
                {['day', 'week', 'month'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setGroupBy(option)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${groupBy === option
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                      }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Trend Chart */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Score Trend
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Area
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#3b82f6"
                      fill="url(#colorAvg)"
                      strokeWidth={2}
                      name="Avg Score"
                    />
                    <Area
                      type="monotone"
                      dataKey="bestScore"
                      stroke="#10b981"
                      fill="url(#colorBest)"
                      strokeWidth={2}
                      name="Best Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Accuracy Chart */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-400" />
                Accuracy & Tests
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      domain={[0, 100]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                      name="Accuracy"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="tests"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      name="Tests Taken"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Test Breakdown */}
        {graphData?.testBreakdown && graphData.testBreakdown.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-400" />
                Test Performance Breakdown
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {graphData.testBreakdown.map((test, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-primary-500/30 transition-colors"
                  >
                    <h4 className="font-semibold text-white truncate mb-3">{test.testName}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Attempts</span>
                        <span className="text-white font-medium">{test.attempts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Best Score</span>
                        <span className="text-emerald-400 font-medium">{test.bestScore?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Score</span>
                        <span className="text-white font-medium">{test.avgScore?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Accuracy</span>
                        <Badge variant={test.accuracy >= 50 ? 'success' : 'warning'} className="text-xs">
                          {test.accuracy?.toFixed(0) || 0}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/examinee/history" className="block">
            <Card className="hover:bg-slate-800/60 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">View History</h3>
                    <p className="text-sm text-gray-400">{stats.testsCompleted + stats.testsPaused} total attempts</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400 transition-colors" />
              </div>
            </Card>
          </Link>
          <Link to="/examinee/tests" className="block">
            <Card className="hover:bg-slate-800/60 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Available Tests</h3>
                    <p className="text-sm text-gray-400">Browse and take tests</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-accent-400 transition-colors" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExamineeDashboard;
