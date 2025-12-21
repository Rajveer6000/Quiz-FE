/**
 * Dashboard Page
 * Overview with stats and quick actions
 */

import { Card, Button, Badge, PageHeader } from '../components/common';

const Dashboard = () => {
  // Mock data - would come from API in real app
  const stats = [
    { label: 'Total Tests', value: '12', icon: '📝', change: '+3 this week', color: 'primary' },
    { label: 'Questions Bank', value: '450', icon: '❓', change: '+25 new', color: 'accent' },
    { label: 'Completed Tests', value: '8', icon: '✅', change: '75% pass rate', color: 'success' },
    { label: 'Pending Reviews', value: '3', icon: '⏳', change: '2 due today', color: 'warning' },
  ];

  const recentTests = [
    { id: 1, name: 'JEE Main Mock Test 1', date: '2025-12-18', score: '78%', status: 'passed' },
    { id: 2, name: 'Physics Practice Test', date: '2025-12-17', score: '65%', status: 'passed' },
    { id: 3, name: 'Chemistry Full Test', date: '2025-12-15', score: '42%', status: 'failed' },
  ];

  return (
    <div>
      <PageHeader
        icon="D"
        title="Dashboard"
        subtitle="Overview of your quiz platform"
      />
      
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} hover className="cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">+ Create New Test</Button>
              <Button variant="accent">+ Add Questions</Button>
              <Button variant="outline">Take a Practice Test</Button>
              <Button variant="ghost">View All Reports</Button>
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
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
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
