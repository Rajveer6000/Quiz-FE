/**
 * Dashboard Page
 * Overview with stats and quick actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, PageHeader } from '../components/common';
import { generateInvitation } from '../api/examineesApi';
import { useToast } from '../context';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  CheckCircle,
  Clock,
  Plus,
  ClipboardList,
  BarChart3,
  UserPlus
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Mock data - would come from API in real app
  const stats = [
    { label: 'Total Tests', value: '12', icon: FileText, change: '+3 this week', color: 'primary' },
    { label: 'Questions Bank', value: '450', icon: HelpCircle, change: '+25 new', color: 'accent' },
    { label: 'Completed Tests', value: '8', icon: CheckCircle, change: '75% pass rate', color: 'success' },
    { label: 'Pending Reviews', value: '3', icon: Clock, change: '2 due today', color: 'warning' },
  ];

  const recentTests = [
    { id: 1, name: 'JEE Main Mock Test 1', date: '2025-12-18', score: '78%', status: 'passed' },
    { id: 2, name: 'Physics Practice Test', date: '2025-12-17', score: '65%', status: 'passed' },
    { id: 3, name: 'Chemistry Full Test', date: '2025-12-15', score: '42%', status: 'failed' },
  ];

  const handleGenerateAndCopyInvite = async () => {
    if (generating) return;

    setGenerating(true);
    try {
      const response = await generateInvitation({});
      if (response.success) {
        const token = response.data.token;
        const link = `${window.location.origin}/register/examinee?t=${token}`;

        // Copy to clipboard
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

  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard className="w-5 h-5" />}
        title="Dashboard"
        subtitle="Overview of your quiz platform"
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const IconComp = stat.icon;
            return (
              <Card key={index} hover className="cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                    <IconComp className={`w-6 h-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => navigate('/tests/new')}>
                <Plus className="w-4 h-4" />
                Create Test
              </Button>
              <Button variant="accent" onClick={() => navigate('/questions/new')}>
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
              <Button variant="success" onClick={handleGenerateAndCopyInvite} isLoading={generating}>
                <UserPlus className="w-4 h-4" />
                Invite Students
              </Button>
              <Button variant="outline" onClick={() => navigate('/take-test')}>
                <ClipboardList className="w-4 h-4" />
                Take Practice Test
              </Button>
              <Button variant="ghost" onClick={() => navigate('/history')}>
                <BarChart3 className="w-4 h-4" />
                View Reports
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tests */}
          <Card>
            <Card.Header>
              <Card.Title>Recent Test Attempts</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {recentTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white">{test.name}</p>
                      <p className="text-sm text-gray-400">{test.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">{test.score}</span>
                      <Badge variant={test.status === 'passed' ? 'success' : 'danger'} dot>
                        {test.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Performance Chart Placeholder */}
          <Card>
            <Card.Header>
              <Card.Title>Performance Overview</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="aspect-video flex items-center justify-center bg-dark-800/50 rounded-xl">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Chart will appear here</p>
                  <p className="text-sm">Connect to backend for real data</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
