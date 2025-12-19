/**
 * QuestionPalette Component
 * Grid of question buttons showing status and navigation
 */

import { QUESTION_STATUS } from '../../constants/constants';

const QuestionPalette = ({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
}) => {
  const getStatusClass = (question) => {
    const { isAnswered, isReviewed, status } = question;

    if (isAnswered && isReviewed) {
      return 'status-answered-marked';
    }
    if (isReviewed) {
      return 'status-marked';
    }
    if (isAnswered) {
      return 'status-answered';
    }
    if (status === QUESTION_STATUS.VIEWED) {
      return 'status-not-answered';
    }
    return 'status-not-visited';
  };

  return (
    <div className="glass-card p-4">
      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Question Palette
      </h4>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded status-not-visited border" />
          <span className="text-gray-400">Not Visited</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded status-not-answered border" />
          <span className="text-gray-400">Not Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded status-answered border" />
          <span className="text-gray-400">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded status-marked border" />
          <span className="text-gray-400">Marked</span>
        </div>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => (
          <button
            key={question.questionLogId || index}
            onClick={() => onQuestionSelect(index)}
            className={`question-palette-item ${getStatusClass(question)} ${
              currentQuestionIndex === index ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-glass-border grid grid-cols-2 gap-2 text-xs">
        <div className="text-gray-400">
          Answered: <span className="text-success-400 font-medium">
            {questions.filter(q => q.isAnswered).length}
          </span>
        </div>
        <div className="text-gray-400">
          Marked: <span className="text-accent-400 font-medium">
            {questions.filter(q => q.isReviewed).length}
          </span>
        </div>
        <div className="text-gray-400">
          Skipped: <span className="text-danger-400 font-medium">
            {questions.filter(q => !q.isAnswered && q.status === QUESTION_STATUS.VIEWED).length}
          </span>
        </div>
        <div className="text-gray-400">
          Total: <span className="text-white font-medium">{questions.length}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
