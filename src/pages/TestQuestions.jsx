/**
 * TestQuestions Page
 * Manage questions in a test section - add existing or create new
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input, Modal, Loader } from '../components/common';
import { Header } from '../components/layout';
import { getTest, addQuestionToTest, listQuestions, listQuestionTypes } from '../api';
import { DIFFICULTY_LABELS } from '../constants/constants';

const TestQuestions = () => {
  const { testId, sectionId } = useParams();
  const navigate = useNavigate();

  // State
  const [test, setTest] = useState(null);
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'new'
  
  // Existing questions state
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [filters, setFilters] = useState({ questionType: '', subjectName: '', difficulty: '' });
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  
  // Question types
  const [questionTypes, setQuestionTypes] = useState([]);
  
  // New question form state
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionTypeId: 1,
    subjectName: '',
    difficulty: 'medium',
    explanation: '',
    answer: '',
    options: [
      { optionLabel: 'A', optionText: '', isCorrect: false },
      { optionLabel: 'B', optionText: '', isCorrect: false },
      { optionLabel: 'C', optionText: '', isCorrect: false },
      { optionLabel: 'D', optionText: '', isCorrect: false },
    ],
  });
  const [errors, setErrors] = useState({});
  
  // Success modal
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });

  // Fetch test details
  useEffect(() => {
    fetchTestDetails();
    fetchQuestionTypes();
  }, [testId]);

  // Fetch questions when filters or pagination change
  useEffect(() => {
    if (activeTab === 'existing') {
      fetchQuestions();
    }
  }, [activeTab, pagination.page, filters]);

  const fetchTestDetails = async () => {
    try {
      const response = await getTest(testId);
      if (response.success) {
        setTest(response.data);
        const foundSection = response.data.sections?.find(s => s.id === parseInt(sectionId));
        setSection(foundSection);
        // Pre-fill subject if section has one
        if (foundSection?.subjectName) {
          setNewQuestion(prev => ({ ...prev, subjectName: foundSection.subjectName }));
          setFilters(prev => ({ ...prev, subjectName: foundSection.subjectName }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch test:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionTypes = async () => {
    try {
      const response = await listQuestionTypes();
      if (response.success) {
        setQuestionTypes(response.data.list || []);
      }
    } catch (error) {
      console.error('Failed to fetch question types:', error);
    }
  };

  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const params = {
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (filters.questionType) params.questionType = filters.questionType;
      if (filters.subjectName) params.subjectName = filters.subjectName;
      if (filters.difficulty) params.difficulty = filters.difficulty;

      const response = await listQuestions(params);
      if (response.success) {
        setQuestions(response.data.list || []);
        setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAddExisting = async (questionId) => {
    setSaving(true);
    try {
      const response = await addQuestionToTest(testId, {
        sectionId: parseInt(sectionId),
        questionId: questionId,
      });
      if (response.success) {
        setSuccessModal({ open: true, message: 'Question added to section successfully!' });
        fetchTestDetails(); // Refresh section question count
      } else {
        setErrors({ submit: response.message || 'Failed to add question' });
      }
    } catch (error) {
      console.error('Failed to add question:', error);
      setErrors({ submit: 'Failed to add question' });
    } finally {
      setSaving(false);
    }
  };

  const validateNewQuestion = () => {
    const errs = {};
    if (!newQuestion.questionText.trim()) {
      errs.questionText = 'Question text is required';
    }
    
    const selectedType = questionTypes.find(t => t.id === newQuestion.questionTypeId);
    const isNumeric = selectedType?.code?.startsWith('NUM');
    
    if (!isNumeric) {
      const hasCorrectOption = newQuestion.options.some(o => o.isCorrect);
      if (!hasCorrectOption) {
        errs.options = 'At least one correct option is required';
      }
      const hasEmptyOption = newQuestion.options.some(o => !o.optionText.trim());
      if (hasEmptyOption) {
        errs.options = 'All options must have text';
      }
    } else if (!newQuestion.answer.trim()) {
      errs.answer = 'Answer is required for numeric questions';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!validateNewQuestion()) return;

    setSaving(true);
    try {
      const selectedType = questionTypes.find(t => t.id === newQuestion.questionTypeId);
      const isNumeric = selectedType?.code?.startsWith('NUM');

      const payload = {
        sectionId: parseInt(sectionId),
        questionData: {
          questionText: newQuestion.questionText,
          questionTypeId: newQuestion.questionTypeId,
          subjectName: newQuestion.subjectName,
          difficulty: newQuestion.difficulty,
          explanation: newQuestion.explanation,
        },
      };

      if (isNumeric) {
        payload.questionData.answer = newQuestion.answer;
      } else {
        payload.options = newQuestion.options;
      }

      const response = await addQuestionToTest(testId, payload);
      if (response.success) {
        setSuccessModal({ open: true, message: 'New question created and added to section!' });
        fetchTestDetails();
        // Reset form
        setNewQuestion({
          questionText: '',
          questionTypeId: 1,
          subjectName: section?.subjectName || '',
          difficulty: 'medium',
          explanation: '',
          answer: '',
          options: [
            { optionLabel: 'A', optionText: '', isCorrect: false },
            { optionLabel: 'B', optionText: '', isCorrect: false },
            { optionLabel: 'C', optionText: '', isCorrect: false },
            { optionLabel: 'D', optionText: '', isCorrect: false },
          ],
        });
      } else {
        setErrors({ submit: response.message || 'Failed to create question' });
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      setErrors({ submit: 'Failed to create question' });
    } finally {
      setSaving(false);
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // For single choice, only one option can be correct
    const selectedType = questionTypes.find(t => t.id === newQuestion.questionTypeId);
    if (field === 'isCorrect' && value && selectedType?.code === 'MCQ_SINGLE') {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const addOption = () => {
    const labels = 'ABCDEFGHIJ';
    const nextLabel = labels[newQuestion.options.length] || `O${newQuestion.options.length + 1}`;
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, { optionLabel: nextLabel, optionText: '', isCorrect: false }],
    });
  };

  const removeOption = (index) => {
    if (newQuestion.options.length <= 2) return;
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const getDifficultyVariant = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  };

  const getQuestionTypeLabel = (code) => {
    const type = questionTypes.find(t => t.code === code);
    return type?.name || code;
  };

  const selectedType = questionTypes.find(t => t.id === newQuestion.questionTypeId);
  const isNumericQuestion = selectedType?.code?.startsWith('NUM');

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!section) {
    return (
      <div>
        <Header title="Section Not Found" />
        <Card className="mt-6 text-center py-12">
          <p className="text-gray-400">The requested section was not found.</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate(`/tests/${testId}/edit`)}>
            Back to Test
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Manage Questions - ${section.sectionName}`}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/tests/${testId}/edit`)}>
            ← Back to Test
          </Button>
        }
      />

      <div className="space-y-6 mt-6">
        {/* Section Info */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{section.sectionName}</h3>
              <div className="flex gap-4 mt-2 text-sm text-gray-400">
                {section.subjectName && (
                  <span className="flex items-center gap-1">
                    <Badge variant="accent">{section.subjectName}</Badge>
                  </span>
                )}
                <span>
                  Questions: {section.currentQuestionCount || 0} / {section.maxQuestionCount || section.questionCount || '∞'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-dark-600 pb-0">
          <button
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'existing'
                ? 'text-primary-400 border-primary-500'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('existing')}
          >
            Add Existing Question
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'new'
                ? 'text-primary-400 border-primary-500'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('new')}
          >
            Create New Question
          </button>
        </div>

        {errors.submit && (
          <div className="p-4 bg-danger-500/10 border border-danger-500/50 rounded-xl text-danger-400">
            {errors.submit}
          </div>
        )}

        {/* Add Existing Tab */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <div className="flex flex-wrap gap-4">
                <select
                  className="input max-w-xs"
                  value={filters.questionType}
                  onChange={(e) => setFilters({ ...filters, questionType: e.target.value })}
                >
                  <option value="">All Types</option>
                  {questionTypes.map(type => (
                    <option key={type.id} value={type.code}>{type.name}</option>
                  ))}
                </select>

                <Input
                  placeholder="Filter by subject..."
                  value={filters.subjectName}
                  onChange={(e) => setFilters({ ...filters, subjectName: e.target.value })}
                  className="max-w-xs"
                />

                <select
                  className="input max-w-xs"
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </Card>

            {/* Questions List */}
            {questionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader size="lg" />
              </div>
            ) : questions.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-400">No questions found matching your filters.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <Card key={question.id} hover>
                    <div className="flex items-start gap-4">
                      <span className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold shrink-0">
                        {question.id}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-white font-medium line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: question.questionText }}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="primary">
                            {getQuestionTypeLabel(question.questionType)}
                          </Badge>
                          {question.subjectName && (
                            <Badge variant="accent">{question.subjectName}</Badge>
                          )}
                          {question.difficulty && (
                            <Badge variant={getDifficultyVariant(question.difficulty)}>
                              {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddExisting(question.id)}
                        isLoading={saving}
                      >
                        + Add
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

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
        )}

        {/* Create New Tab */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateNew} className="space-y-6">
            {/* Question Type */}
            <Card>
              <Card.Header>
                <Card.Title>Question Type</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-3">
                  {questionTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setNewQuestion({ ...newQuestion, questionTypeId: type.id })}
                      className={`px-4 py-3 rounded-xl border-2 transition-all text-left
                        ${newQuestion.questionTypeId === type.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-600 hover:border-dark-500'
                        }`}
                    >
                      <p className="font-medium text-white">{type.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                    </button>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* Question Details */}
            <Card>
              <Card.Header>
                <Card.Title>Question Details</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Question Text <span className="text-danger-400">*</span>
                  </label>
                  <textarea
                    className={`input min-h-32 ${errors.questionText ? 'input-error' : ''}`}
                    value={newQuestion.questionText}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                    placeholder="Enter your question here..."
                  />
                  {errors.questionText && <p className="text-xs text-danger-400 mt-1">{errors.questionText}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Subject"
                    value={newQuestion.subjectName}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subjectName: e.target.value })}
                    placeholder="e.g., Physics, Chemistry"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Difficulty</label>
                    <select
                      className="input"
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Explanation (Optional)</label>
                  <textarea
                    className="input min-h-20"
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    placeholder="Explain the correct answer..."
                  />
                </div>
              </Card.Content>
            </Card>

            {/* Options or Numeric Answer */}
            <Card>
              <Card.Header>
                <Card.Title>
                  {isNumericQuestion ? 'Answer' : 'Options'}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                {isNumericQuestion ? (
                  <Input
                    label="Correct Answer"
                    value={newQuestion.answer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                    placeholder="Enter the numeric answer"
                    error={errors.answer}
                    required
                  />
                ) : (
                  <div className="space-y-3">
                    {errors.options && (
                      <p className="text-sm text-danger-400 bg-danger-500/10 px-4 py-2 rounded-lg">{errors.options}</p>
                    )}
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-gray-400 font-medium">
                          {option.optionLabel}
                        </span>
                        <input
                          type="text"
                          className="input flex-1"
                          value={option.optionText}
                          onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                          placeholder={`Option ${option.optionLabel}`}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type={selectedType?.code === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                            name="correctOption"
                            checked={option.isCorrect}
                            onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                            className="w-4 h-4 rounded accent-success-500"
                          />
                          <span className="text-sm text-gray-400">Correct</span>
                        </label>
                        {newQuestion.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-gray-400 hover:text-danger-400 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="ghost" onClick={addOption}>
                      + Add Option
                    </Button>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => navigate(`/tests/${testId}/edit`)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={saving}>
                Create & Add Question
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ open: false, message: '' })}
        title="Success"
        footer={
          <Button variant="primary" onClick={() => setSuccessModal({ open: false, message: '' })}>
            Continue
          </Button>
        }
      >
        <p className="text-success-400">{successModal.message}</p>
        <p className="text-sm text-gray-400 mt-2">
          Section now has {section?.currentQuestionCount || 0} questions.
        </p>
      </Modal>
    </div>
  );
};

export default TestQuestions;
