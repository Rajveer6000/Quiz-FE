/**
 * TestQuestions Page
 * Split layout: Left shows existing questions, Right shows add form
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Modal, Loader, PageHeader } from '../components/common';
import { getTest, addQuestionToTest, removeQuestionFromTest, updateTestQuestion, listQuestionTypes } from '../api';
import { useToast } from '../context';
import {
  ArrowLeft,
  Plus,
  Trash2,
  HelpCircle,
  Check,
  BookOpen,
  Sparkles,
  Edit3,
  X,
  Save,
  AlertTriangle,
  FileText
} from 'lucide-react';

const TestQuestions = () => {
  const { testId, sectionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper functions for question type detection (inside component to avoid HMR issues)
  const getQuestionTypeCode = (question) => {
    return question?.questionType?.code ||
      question?.questionTypeCode ||
      question?.code ||
      (question?.questionTypeId === 3 || question?.questionType?.id === 3 ? 'NUM' : null);
  };

  const isNumericQuestion = (question) => {
    const code = getQuestionTypeCode(question);
    const hasNumericCode = code?.startsWith('NUM') || code === 'NUMERIC';
    const hasNumericTypeId = question?.questionTypeId === 3 || question?.questionType?.id === 3;
    // Also check if question has answer but no options
    const hasAnswerNoOptions = (question?.answer !== undefined && question?.answer !== null) &&
      (!question?.options || question.options.length === 0);
    return hasNumericCode || hasNumericTypeId || hasAnswerNoOptions;
  };

  const getQuestionTypeName = (question) => {
    if (question?.questionType?.name) return question.questionType.name;
    if (question?.questionTypeName) return question.questionTypeName;
    const typeId = question?.questionTypeId || question?.questionType?.id;
    if (typeId === 1) return 'MCQ - Single Correct';
    if (typeId === 2) return 'MCQ - Multiple Correct';
    if (typeId === 3) return 'Numeric';
    if (question?.options && question.options.length > 0) return 'MCQ';
    if (question?.answer !== undefined && question?.answer !== null) return 'Numeric';
    return 'MCQ';
  };

  const isSingleChoiceQuestion = (question) => {
    const code = getQuestionTypeCode(question);
    return code === 'MCQ_SINGLE' ||
      question?.questionTypeId === 1 ||
      question?.questionType?.id === 1;
  };

  // State
  const [test, setTest] = useState(null);
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);

  // Question types
  const [questionTypes, setQuestionTypes] = useState([]);

  // Edit state
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState({ open: false, question: null });
  const [deleting, setDeleting] = useState(false);

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

  // Fetch test details
  useEffect(() => {
    fetchTestDetails();
    fetchQuestionTypes();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const response = await getTest(testId);
      console.log('Test details response:', response);
      if (response.success) {
        setTest(response.data);
        // Find section - handle both string and number IDs
        const targetSectionId = parseInt(sectionId);
        const foundSection = response.data.sections?.find(s =>
          parseInt(s.id) === targetSectionId || String(s.id) === String(sectionId)
        );
        console.log('Looking for sectionId:', sectionId, 'Found:', foundSection);
        setSection(foundSection);
        // Pre-fill subject if section has one
        if (foundSection?.subjectName) {
          setNewQuestion(prev => ({ ...prev, subjectName: foundSection.subjectName }));
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
        errs.options = 'At least one option must be marked as correct';
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
        // Check if section will be full after this addition
        const currentCount = section?.currentQuestionCount || 0;
        const maxCount = section?.maxQuestionCount;
        const willBeFull = maxCount && (currentCount + 1) >= maxCount;

        if (willBeFull) {
          toast.success('Section complete! All questions added successfully.');
          // Auto-redirect to test edit page after a short delay
          setTimeout(() => {
            navigate(`/tests/${testId}/edit`);
          }, 1500);
          return;
        }

        toast.success('Question added successfully!');
        fetchTestDetails();
        // Reset form for next question
        setNewQuestion({
          questionText: '',
          questionTypeId: newQuestion.questionTypeId,
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
        setErrors({});
      } else {
        toast.error(response.message || 'Failed to add question');
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Failed to add question');
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
    // Re-label options
    const labels = 'ABCDEFGHIJ';
    newOptions.forEach((opt, i) => {
      opt.optionLabel = labels[i] || `O${i + 1}`;
    });
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  // Edit handlers
  const startEdit = (question) => {
    setEditingQuestionId(question.id);
    setEditFormData({
      questionText: question.questionText,
      answer: question.answer || '',
      options: question.options?.map(o => ({ ...o })) || [],
    });
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setEditFormData(null);
  };

  const handleEditOptionChange = (index, field, value, question) => {
    const newOptions = [...editFormData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // For single choice (MCQ_SINGLE), only one option can be correct
    // For multiple choice (MCQ_MULTI), allow multiple correct answers
    if (field === 'isCorrect' && value && isSingleChoiceQuestion(question)) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setEditFormData({ ...editFormData, options: newOptions });
  };

  const saveEdit = async (question) => {
    setEditSaving(true);
    try {
      const payload = {
        questionText: editFormData.questionText,
      };

      if (isNumericQuestion(question)) {
        payload.answer = editFormData.answer;
      } else {
        payload.options = editFormData.options;
      }

      const response = await updateTestQuestion(testId, question.id, payload);
      if (response.success) {
        toast.success('Question updated successfully!');
        setEditingQuestionId(null);
        setEditFormData(null);
        fetchTestDetails();
      } else {
        toast.error(response.message || 'Failed to update question');
      }
    } catch (error) {
      console.error('Failed to update question:', error);
      toast.error('Failed to update question');
    } finally {
      setEditSaving(false);
    }
  };

  // Delete handlers
  const confirmDelete = (question) => {
    setDeleteModal({ open: true, question });
  };

  const handleDelete = async () => {
    if (!deleteModal.question) return;

    setDeleting(true);
    try {
      const response = await removeQuestionFromTest(testId, deleteModal.question.id);
      if (response.success) {
        toast.success('Question removed successfully!');
        setDeleteModal({ open: false, question: null });
        fetchTestDetails();
      } else {
        toast.error(response.message || 'Failed to remove question');
      }
    } catch (error) {
      console.error('Failed to remove question:', error);
      toast.error('Failed to remove question');
    } finally {
      setDeleting(false);
    }
  };

  const selectedType = questionTypes.find(t => t.id === newQuestion.questionTypeId);
  const isNewQuestionNumeric = selectedType?.code?.startsWith('NUM');
  const questions = section?.questions || [];

  // Check if section is full - handle different API property names
  const maxQuestions = section?.maxQuestionCount || section?.questionCount;
  const currentQuestions = section?.currentQuestionCount ?? questions.length;
  const isSectionFull = maxQuestions && currentQuestions >= maxQuestions;

  const isTestFinalized = test?.isFinal === true;

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!section) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon={<HelpCircle className="w-5 h-5" />}
          title="Section Not Found"
          subtitle="The requested section was not found"
        />
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-12 text-center">
          <p className="text-gray-400">The requested section was not found.</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate(`/tests/${testId}/edit`)}>
            Back to Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        icon={<HelpCircle className="w-5 h-5" />}
        title={`Manage Questions - ${section.sectionName}`}
        subtitle={`${questions.length} questions in this section`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(`/tests/${testId}/edit`)}>
              <ArrowLeft className="w-4 h-4" />
              Back to Quiz
            </Button>
            <Button variant="primary" onClick={() => navigate(`/tests/${testId}/details`)}>
              <FileText className="w-4 h-4" />
              Review & Publish
            </Button>
          </div>
        }
      />

      {/* Section Info Bar */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{section.sectionName}</h3>
              <p className="text-sm text-gray-400">{section.subjectName || 'General'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isTestFinalized && (
              <Badge variant="warning">Test Finalized</Badge>
            )}
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {section.currentQuestionCount || 0} / {section.maxQuestionCount || section.questionCount || '∞'}
              </p>
              <p className="text-sm text-gray-400">Questions Added</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {section.maxQuestionCount && (
          <div className="mt-4">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isSectionFull ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((section.currentQuestionCount / section.maxQuestionCount) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout - Full width when section is full */}
      <div className={`grid grid-cols-1 gap-6 ${!isSectionFull && !isTestFinalized ? 'lg:grid-cols-5' : ''}`}>
        {/* Left Panel - Questions List (full width when section is full, otherwise 60%) */}
        <div className={`space-y-4 ${!isSectionFull && !isTestFinalized ? 'lg:col-span-3' : ''}`}>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Questions in this Section
          </h3>

          {questions.length === 0 ? (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-12 text-center">
              <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No questions in this section yet.</p>
              <p className="text-sm text-gray-500 mt-1">Add questions using the form on the right.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
                >
                  {editingQuestionId === question.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-400">Editing Question {index + 1}</span>
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <textarea
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none min-h-[80px]"
                        value={editFormData.questionText}
                        onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })}
                        placeholder="Question text"
                      />

                      {isNumericQuestion(question) ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-300">Correct Answer</label>
                          <input
                            type="text"
                            className="w-full max-w-xs px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            value={editFormData.answer || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, answer: e.target.value })}
                            placeholder="Enter numeric answer"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(editFormData.options || []).map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${option.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-gray-400'}`}>
                                {option.optionLabel}
                              </span>
                              <input
                                type="text"
                                className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                value={option.optionText}
                                onChange={(e) => handleEditOptionChange(optIndex, 'optionText', e.target.value, question)}
                              />
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type={isSingleChoiceQuestion(question) ? 'radio' : 'checkbox'}
                                  name={`edit-correct-${question.id}`}
                                  checked={option.isCorrect}
                                  onChange={(e) => handleEditOptionChange(optIndex, 'isCorrect', e.target.checked, question)}
                                  className="w-4 h-4 accent-emerald-500"
                                />
                                <span className="text-xs text-gray-400">Correct</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" isLoading={editSaving} onClick={() => saveEdit(question)}>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-semibold text-blue-400">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-white">{question.questionText}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {getQuestionTypeName(question)}
                              </Badge>
                              {question.difficulty && (
                                <Badge variant={question.difficulty === 'hard' ? 'danger' : question.difficulty === 'easy' ? 'success' : 'warning'} className="text-xs">
                                  {question.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isTestFinalized && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(question)}
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Edit question"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(question)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Options Display */}
                      {question.options && question.options.length > 0 && (
                        <div className="ml-11 space-y-1.5">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${option.isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-700/30'
                                }`}
                            >
                              <span className={`font-medium ${option.isCorrect ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {option.optionLabel}.
                              </span>
                              <span className={option.isCorrect ? 'text-emerald-300' : 'text-gray-300'}>
                                {option.optionText}
                              </span>
                              {option.isCorrect && (
                                <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Numeric Answer Display */}
                      {question.answer && (
                        <div className="ml-11 mt-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
                            <span className="text-gray-400">Answer:</span>
                            <span className="text-emerald-300 font-medium">{question.answer}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Add Question Form (40%) - Only show when section not full */}
        {!isSectionFull && !isTestFinalized && (
          <div className="lg:col-span-2">
            <div className="sticky top-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Add New Question
                </h3>

                <form onSubmit={handleCreateNew} className="space-y-4">
                  {/* Question Type */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Question Type</h4>
                    <div className="flex flex-wrap gap-2">
                      {questionTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setNewQuestion({ ...newQuestion, questionTypeId: type.id })}
                          className={`
                            px-3 py-2 rounded-lg border text-sm transition-all
                            ${newQuestion.questionTypeId === type.id
                              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                              : 'border-white/10 hover:border-white/20 bg-slate-800/50 text-gray-400'
                            }
                          `}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Question Text <span className="text-red-400">*</span>
                    </h4>
                    <textarea
                      className={`
                        w-full px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-gray-500
                        focus:outline-none focus:ring-2 transition-all min-h-[100px] resize-none text-sm
                        ${errors.questionText
                          ? 'border-red-500/50 focus:ring-red-500/30'
                          : 'border-white/10 focus:ring-blue-500/30 focus:border-blue-500/50'
                        }
                      `}
                      value={newQuestion.questionText}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                      placeholder="Enter your question here..."
                    />
                    {errors.questionText && <p className="text-xs text-red-400 mt-1">{errors.questionText}</p>}
                  </div>

                  {/* Options or Numeric Answer */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      {isNewQuestionNumeric ? 'Correct Answer' : 'Options'}
                    </h4>

                    {isNewQuestionNumeric ? (
                      <div>
                        <input
                          type="text"
                          className={`
                            w-full px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-gray-500
                            focus:outline-none focus:ring-2 transition-all text-sm
                            ${errors.answer
                              ? 'border-red-500/50 focus:ring-red-500/30'
                              : 'border-white/10 focus:ring-blue-500/30 focus:border-blue-500/50'
                            }
                          `}
                          value={newQuestion.answer}
                          onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                          placeholder="Enter numeric answer"
                        />
                        {errors.answer && <p className="text-xs text-red-400 mt-1">{errors.answer}</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {errors.options && (
                          <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{errors.options}</p>
                        )}
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs ${option.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-gray-400'}`}>
                              {option.optionLabel}
                            </span>
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-sm"
                              value={option.optionText}
                              onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                              placeholder={`Option ${option.optionLabel}`}
                            />
                            <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-slate-700/50">
                              <input
                                type={selectedType?.code === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                                name="correctOption"
                                checked={option.isCorrect}
                                onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                                className="w-4 h-4 accent-emerald-500"
                              />
                            </label>
                            {newQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addOption}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Option
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Additional Details */}
                  <details className="bg-slate-800/50 border border-white/10 rounded-xl">
                    <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:text-white">
                      Additional Details (Optional)
                    </summary>
                    <div className="px-4 pb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Subject</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                            value={newQuestion.subjectName}
                            onChange={(e) => setNewQuestion({ ...newQuestion, subjectName: e.target.value })}
                            placeholder="e.g., Physics"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                          <select
                            className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
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
                        <label className="block text-xs text-gray-400 mb-1">Explanation</label>
                        <textarea
                          className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm min-h-[60px] resize-none"
                          value={newQuestion.explanation}
                          onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                          placeholder="Explain the correct answer..."
                        />
                      </div>
                    </div>
                  </details>

                  {/* Submit Button */}
                  <Button type="submit" variant="success" className="w-full" isLoading={saving}>
                    <Sparkles className="w-4 h-4" />
                    Add Question
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, question: null })}
        title="Remove Question"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white">Are you sure you want to remove this question?</p>
              <p className="text-sm text-gray-400 mt-1">
                This action cannot be undone. The question will be removed from this section.
              </p>
            </div>
          </div>

          {deleteModal.question && (
            <div className="bg-slate-800/50 border border-white/10 rounded-lg p-3">
              <p className="text-sm text-gray-300 line-clamp-2">{deleteModal.question.questionText}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, question: null })}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleting} onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Remove Question
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestQuestions;
