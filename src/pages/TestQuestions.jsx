/**
 * TestQuestions Page
 * Add new questions to a test section
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Modal, Loader, PageHeader } from '../components/common';
import { getTest, addQuestionToTest, listQuestionTypes } from '../api';
import { useToast } from '../context';
import {
  ArrowLeft,
  Plus,
  Trash2,
  HelpCircle,
  Check,
  BookOpen,
  Sparkles
} from 'lucide-react';

const TestQuestions = () => {
  const { testId, sectionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [test, setTest] = useState(null);
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const selectedType = questionTypes.find(t => t.id === newQuestion.questionTypeId);
  const isNumericQuestion = selectedType?.code?.startsWith('NUM');

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

  const isSectionFull = section.maxQuestionCount && section.currentQuestionCount >= section.maxQuestionCount;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        icon={<HelpCircle className="w-5 h-5" />}
        title={`Add Questions - ${section.sectionName}`}
        subtitle={`Add new questions to this section`}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/tests/${testId}/edit`)}>
            <ArrowLeft className="w-4 h-4" />
            Back to Quiz
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Section Info */}
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
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
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {section.currentQuestionCount || 0} / {section.maxQuestionCount || section.questionCount || '∞'}
              </p>
              <p className="text-sm text-gray-400">Questions Added</p>
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

        {/* Section Full Message */}
        {isSectionFull ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
            <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Section Complete!</h3>
            <p className="text-gray-400 mb-4">
              This section has reached its maximum question limit.
            </p>
            <Button variant="primary" onClick={() => navigate(`/tests/${testId}/edit`)}>
              Back to Quiz
            </Button>
          </div>
        ) : (
          /* New Question Form */
          <form onSubmit={handleCreateNew} className="space-y-5">
            {/* Question Type */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Question Type</h4>
              <div className="flex flex-wrap gap-3">
                {questionTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setNewQuestion({ ...newQuestion, questionTypeId: type.id })}
                    className={`
                      px-4 py-3 rounded-xl border-2 transition-all text-left
                      ${newQuestion.questionTypeId === type.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 hover:border-white/20 bg-slate-800/50'
                      }
                    `}
                  >
                    <p className="font-medium text-white text-sm">{type.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Question Text <span className="text-red-400">*</span>
              </h4>
              <textarea
                className={`
                  w-full px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 transition-all min-h-[120px] resize-none
                  ${errors.questionText
                    ? 'border-red-500/50 focus:ring-red-500/30'
                    : 'border-white/10 focus:ring-blue-500/30 focus:border-blue-500/50'
                  }
                `}
                value={newQuestion.questionText}
                onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                placeholder="Enter your question here..."
              />
              {errors.questionText && <p className="text-xs text-red-400 mt-2">{errors.questionText}</p>}
            </div>

            {/* Options or Numeric Answer */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                {isNumericQuestion ? 'Correct Answer' : 'Options'}
              </h4>

              {isNumericQuestion ? (
                <div>
                  <input
                    type="text"
                    className={`
                      w-full max-w-xs px-4 py-3 rounded-xl bg-slate-700/50 border text-white placeholder-gray-500
                      focus:outline-none focus:ring-2 transition-all
                      ${errors.answer
                        ? 'border-red-500/50 focus:ring-red-500/30'
                        : 'border-white/10 focus:ring-blue-500/30 focus:border-blue-500/50'
                      }
                    `}
                    value={newQuestion.answer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                    placeholder="Enter numeric answer"
                  />
                  {errors.answer && <p className="text-xs text-red-400 mt-2">{errors.answer}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.options && (
                    <p className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg">{errors.options}</p>
                  )}
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`
                        w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm
                        ${option.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-gray-400'}
                      `}>
                        {option.optionLabel}
                      </span>
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                        value={option.optionText}
                        onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                        placeholder={`Option ${option.optionLabel}`}
                      />
                      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <input
                          type={selectedType?.code === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                          name="correctOption"
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                          className="w-4 h-4 accent-emerald-500"
                        />
                        <span className="text-sm text-gray-400">Correct</span>
                      </label>
                      {newQuestion.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>
                </div>
              )}
            </div>

            {/* Additional Details (Collapsible) */}
            <details className="bg-slate-800/50 border border-white/10 rounded-xl">
              <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-gray-300 hover:text-white">
                Additional Details (Optional)
              </summary>
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Subject</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      value={newQuestion.subjectName}
                      onChange={(e) => setNewQuestion({ ...newQuestion, subjectName: e.target.value })}
                      placeholder="e.g., Physics"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Difficulty</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
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
                  <label className="block text-xs text-gray-400 mb-1.5">Explanation</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all min-h-[80px] resize-none"
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    placeholder="Explain the correct answer..."
                  />
                </div>
              </div>
            </details>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => navigate(`/tests/${testId}/edit`)}>
                <ArrowLeft className="w-4 h-4" />
                Done Adding
              </Button>
              <Button type="submit" variant="success" isLoading={saving}>
                <Sparkles className="w-4 h-4" />
                Add Question
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TestQuestions;
