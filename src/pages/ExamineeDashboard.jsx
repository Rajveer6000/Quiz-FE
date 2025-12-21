/**
 * Examinee Dashboard Page
 * Dashboard for students/examinees
 */

import { Card, PageHeader } from '../components/common';
import { useAuth } from '../context';

const ExamineeDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        icon="S"
        title="Student Dashboard"
        subtitle="Welcome to your learning portal"
      />

      <div className="space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary-600/20 to-accent-600/20 border-primary-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Hello, {user?.firstName || user?.email || 'Student'}! 👋
              </h2>
              <p className="text-gray-300 mt-1">
                Welcome to your student dashboard.
              </p>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card>
          <Card.Header>
            <Card.Title>Your Dashboard</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-400">
              More features will be available soon. Stay tuned!
            </p>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default ExamineeDashboard;

