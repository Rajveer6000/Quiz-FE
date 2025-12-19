/**
 * TestForm Page
 * Create or edit a test
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Badge, Loader } from '../components/common';
import { Header } from '../components/layout';
import { createTest, getTest, updateTest } from '../api';

const TestForm = () => {
  const params = useParams();
  const id = params.testId || params.id; // Support both route param names
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMin: 60,
    price: 0,
    startTime: '',
    endTime: '',
    templateId: '',
    sections: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchTest();
    }
  }, [id]);

  const fetchTest = async () => {
    try {
      const response = await getTest(id);
      if (response.success) {
        const test = response.data;
        setFormData({
          name: test.name || '',
          description: test.description || '',
          durationMin: test.durationMin || 60,
          price: test.price || 0,
          startTime: test.startTime ? test.startTime.slice(0, 16) : '',
          endTime: test.endTime ? test.endTime.slice(0, 16) : '',
          templateId: test.templateId || '',
          sections: test.sections || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch test:', error);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Test name is required';
    }
    if (formData.durationMin < 1) {
      newErrors.durationMin = 'Duration must be at least 1 minute';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        durationMin: formData.durationMin,
        price: formData.price,
      };

      if (formData.startTime) payload.startTime = new Date(formData.startTime).toISOString();
      if (formData.endTime) payload.endTime = new Date(formData.endTime).toISOString();
      if (formData.templateId) payload.templateId = parseInt(formData.templateId);

      if (isEditing) {
        await updateTest(id, payload);
      } else {
        await createTest(payload);
      }
      navigate('/tests');
    } catch (error) {
      console.error('Failed to save test:', error);
      if (error.message) {
        setErrors({ submit: error.message });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div>
      <Header title={isEditing ? 'Edit Test' : 'Create Test'} />

      <form onSubmit={handleSubmit} className="space-y-6 mt-6 max-w-4xl">
        {errors.submit && (
          <div className="p-4 bg-danger-500/10 border border-danger-500/50 rounded-xl text-danger-400">
            {errors.submit}
          </div>
        )}

        {/* Basic Info */}
        <Card>
          <Card.Header>
            <Card.Title>Basic Information</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Input
              label="Test Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter test name"
              error={errors.name}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                className="input min-h-20"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the test"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (minutes)"
                type="number"
                min="1"
                value={formData.durationMin}
                onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
                error={errors.durationMin}
                required
              />

              <Input
                label="Price (₹)"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </Card.Content>
        </Card>

        {/* Test Window */}
        <Card>
          <Card.Header>
            <Card.Title>Test Window (Optional)</Card.Title>
            <Card.Description>Set when the test is available for attempts</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />

              <Input
                label="End Time"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </Card.Content>
        </Card>

        {/* Template Selection (for new tests) */}
        {!isEditing && (
          <Card>
            <Card.Header>
              <Card.Title>Template (Optional)</Card.Title>
              <Card.Description>Use a template to auto-generate sections</Card.Description>
            </Card.Header>
            <Card.Content>
              <select
                className="input max-w-md"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              >
                <option value="">No Template (Empty Test)</option>
                <option value="1">JEE Main Template (90 Questions, 3 Sections)</option>
                <option value="2">JEE Advanced Template (54 Questions, 2 Papers)</option>
                <option value="3">NEET Template (180 Questions, 3 Sections)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Templates define the section structure and question limits automatically.
              </p>
            </Card.Content>
          </Card>
        )}

        {/* Sections Display (for editing) */}
        {isEditing && formData.sections.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>Sections</Card.Title>
              <Card.Description>Add questions to each section</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {formData.sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-dark-600"
                  >
                    <div>
                      <p className="font-medium text-white">{section.sectionName}</p>
                      <p className="text-sm text-gray-400">
                        {section.currentQuestionCount || 0} / {section.maxQuestionCount || section.questionCount} questions
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={section.subjectName ? 'accent' : 'primary'}>
                        {section.subjectName || 'General'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tests/${id}/sections/${section.id}/questions`)}
                      >
                        Manage Questions
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/tests')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEditing ? 'Update Test' : 'Create Test'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TestForm;
