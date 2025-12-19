/**
 * QuestionCard Component
 * Displays a question with its options
 */

import { QUESTION_TYPES } from '../../constants/constants';

const QuestionCard = ({
  question,
  selectedOptionId,
  selectedOptionIds = [],
  numericAnswer,
  onSelectOption,
  onNumericChange,
  isReviewed,
  questionNumber,
}) => {
  const { questionText, questionType, options = [] } = question;

  const handleOptionClick = (optionId) => {
    if (questionType === QUESTION_TYPES.MCQ_SINGLE) {
      onSelectOption(optionId);
    } else if (questionType === QUESTION_TYPES.MCQ_MULTI) {
      const newSelection = selectedOptionIds.includes(optionId)
        ? selectedOptionIds.filter(id => id !== optionId)
        : [...selectedOptionIds, optionId];
      onSelectOption(newSelection);
    }
  };

  const isOptionSelected = (optionId) => {
    if (questionType === QUESTION_TYPES.MCQ_SINGLE) {
      return selectedOptionId === optionId;
    }
    return selectedOptionIds.includes(optionId);
  };

  return (
    <div className="glass-card p-6">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold">
            {questionNumber}
          </span>
          <span className="badge-primary text-xs uppercase">
            {questionType === QUESTION_TYPES.MCQ_SINGLE ? 'Single Choice' :
             questionType === QUESTION_TYPES.MCQ_MULTI ? 'Multiple Choice' : 'Numeric'}
          </span>
        </div>
        {isReviewed && (
          <span className="badge-accent">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Marked for Review
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <p className="text-lg text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: questionText }} />
      </div>

      {/* Options or Numeric Input */}
      {questionType === QUESTION_TYPES.NUMERIC ? (
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Enter your answer
          </label>
          <input
            type="text"
            value={numericAnswer || ''}
            onChange={(e) => onNumericChange(e.target.value)}
            className="input font-mono text-lg"
            placeholder="0.00"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isOptionSelected(option.id)
                  ? 'bg-primary-500/15 border-primary-500 text-white'
                  : 'bg-dark-800/50 border-dark-600 hover:border-dark-500 text-gray-300 hover:text-white'
                }`}
            >
              {/* Option indicator */}
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm
                ${isOptionSelected(option.id)
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-gray-400'
                }`}>
                {option.optionLabel}
              </span>

              {/* Option text */}
              <span className="flex-1" dangerouslySetInnerHTML={{ __html: option.optionText }} />

              {/* Checkbox/Radio indicator */}
              {questionType === QUESTION_TYPES.MCQ_MULTI ? (
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center
                  ${isOptionSelected(option.id)
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-dark-500'
                  }`}>
                  {isOptionSelected(option.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              ) : (
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isOptionSelected(option.id)
                    ? 'border-primary-500'
                    : 'border-dark-500'
                  }`}>
                  {isOptionSelected(option.id) && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
