/**
 * QuestionForm Page
 * Create or edit a question
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Badge, Loader, PageHeader } from '../components/common';
import { createQuestion, getQuestion, updateQuestion } from '../api';
import { QUESTION_TYPE_IDS } from '../constants/constants';

const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    questionText: '',
    questionTypeId: QUESTION_TYPE_IDS.MCQ_SINGLE,
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

  useEffect(() => {
    if (isEditing) {
      fetchQuestion();
    }
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const response = await getQuestion(id);
      if (response.success) {
        const q = response.data;
        setFormData({
          questionText: q.questionText || '',
          questionTypeId: QUESTION_TYPE_IDS[q.questionType] || QUESTION_TYPE_IDS.MCQ_SINGLE,
          subjectName: q.subjectName || '',
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          answer: q.answer || '',
          options: q.options?.length > 0 ? q.options : formData.options,
        });
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }
    if (formData.questionTypeId !== QUESTION_TYPE_IDS.NUMERIC) {
      const hasCorrectOption = formData.options.some(o => o.isCorrect);
      if (!hasCorrectOption) {
        newErrors.options = 'At least one correct option is required';
      }
      const hasEmptyOption = formData.options.some(o => !o.optionText.trim());
      if (hasEmptyOption) {
        newErrors.options = 'All options must have text';
      }
    } else if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required for numeric questions';
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
        questionText: formData.questionText,
        questionTypeId: formData.questionTypeId,
        subjectName: formData.subjectName,
        difficulty: formData.difficulty,
        explanation: formData.explanation,
      };

      if (formData.questionTypeId === QUESTION_TYPE_IDS.NUMERIC) {
        payload.answer = formData.answer;
      } else {
        payload.options = formData.options;
      }

      if (isEditing) {
        await updateQuestion(id, payload);
      } else {
        await createQuestion(payload);
      }
      navigate('/questions');
    } catch (error) {
      console.error('Failed to save question:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // For single choice, only one option can be correct
    if (field === 'isCorrect' && value && formData.questionTypeId === QUESTION_TYPE_IDS.MCQ_SINGLE) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    const labels = 'ABCDEFGHIJ';
    const nextLabel = labels[formData.options.length] || `O${formData.options.length + 1}`;
    setFormData({
      ...formData,
      options: [...formData.options, { optionLabel: nextLabel, optionText: '', isCorrect: false }],
    });
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) return;
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div>
      <PageHeader
        icon="Q"
        title={isEditing ? 'Edit Question' : 'Create Question'}
        subtitle={isEditing ? 'Update question details' : 'Add a new question'}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Question Type */}
        <Card>
          <Card.Header>
            <Card.Title>Question Type</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex gap-4">
              {[
                { id: QUESTION_TYPE_IDS.MCQ_SINGLE, label: 'Single Choice', desc: 'Only one correct answer' },
                { id: QUESTION_TYPE_IDS.MCQ_MULTI, label: 'Multiple Choice', desc: 'Multiple correct answers' },
                { id: QUESTION_TYPE_IDS.NUMERIC, label: 'Numeric', desc: 'Enter a number as answer' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, questionTypeId: type.id })}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-left
                    ${formData.questionTypeId === type.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 hover:border-dark-500'
                    }`}
                >
                  <p className="font-medium text-white">{type.label}</p>
                  <p className="text-sm text-gray-400 mt-1">{type.desc}</p>
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
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                placeholder="Enter your question here..."
              />
              {errors.questionText && <p className="text-xs text-danger-400 mt-1">{errors.questionText}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Subject"
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                placeholder="e.g., Physics, Chemistry"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Difficulty</label>
                <select
                  className="input"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
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
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Explain the correct answer..."
              />
            </div>
          </Card.Content>
        </Card>

        {/* Options or Numeric Answer */}
        <Card>
          <Card.Header>
            <Card.Title>
              {formData.questionTypeId === QUESTION_TYPE_IDS.NUMERIC ? 'Answer' : 'Options'}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {formData.questionTypeId === QUESTION_TYPE_IDS.NUMERIC ? (
              <Input
                label="Correct Answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the numeric answer"
                error={errors.answer}
                required
              />
            ) : (
              <div className="space-y-3">
                {errors.options && (
                  <p className="text-sm text-danger-400 bg-danger-500/10 px-4 py-2 rounded-lg">{errors.options}</p>
                )}
                {formData.options.map((option, index) => (
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
                        type={formData.questionTypeId === QUESTION_TYPE_IDS.MCQ_SINGLE ? 'radio' : 'checkbox'}
                        name="correctOption"
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                        className="w-4 h-4 rounded accent-success-500"
                      />
                      <span className="text-sm text-gray-400">Correct</span>
                    </label>
                    {formData.options.length > 2 && (
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
          <Button type="button" variant="ghost" onClick={() => navigate('/questions')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEditing ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
