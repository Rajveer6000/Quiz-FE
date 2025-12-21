/**
 * Quiz Review Step Component
 * Summary of quiz configuration before creation
 */

import { Check, BookOpen, Clock, IndianRupee, LayoutTemplate, Calendar, HelpCircle } from 'lucide-react';

const QuizReviewStep = ({ data, quizType, templateData, sections }) => {
    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    // Calculate totals for custom sections
    const totalQuestions = sections?.reduce((sum, s) => sum + (parseInt(s.questionCount) || 0), 0) || 0;
    const totalMarks = sections?.reduce((sum, s) => {
        const qs = parseInt(s.questionCount) || 0;
        const marks = parseFloat(s.marksPerQuestion) || 0;
        return sum + (qs * marks);
    }, 0) || 0;

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Review & Create</h2>
                <p className="text-gray-400 mt-2">Review your quiz configuration before creating</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {/* Basic Info Card */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        Quiz Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-400">Name</p>
                            <p className="text-white font-medium mt-1">{data.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Description</p>
                            <p className="text-white font-medium mt-1 truncate">{data.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-violet-400" />
                            <div>
                                <p className="text-sm text-gray-400">Duration</p>
                                <p className="text-white font-medium">{data.durationMin} minutes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-emerald-400" />
                            <div>
                                <p className="text-sm text-gray-400">Price</p>
                                <p className="text-white font-medium">{data.price > 0 ? `₹${data.price}` : 'Free'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Window Card */}
                {(data.startTime || data.endTime) && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <Calendar className="w-5 h-5 text-amber-400" />
                            Test Window
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Start Time</p>
                                <p className="text-white font-medium mt-1">{formatDateTime(data.startTime)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">End Time</p>
                                <p className="text-white font-medium mt-1">{formatDateTime(data.endTime)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quiz Type Card */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <LayoutTemplate className="w-5 h-5 text-violet-400" />
                        Quiz Type
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className={`
              px-3 py-1.5 rounded-lg text-sm font-medium
              ${quizType === 'template' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'}
            `}>
                            {quizType === 'template' ? 'Template-Based' : 'Custom Sections'}
                        </span>
                        {templateData && (
                            <span className="text-gray-300">
                                {templateData.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Sections Preview */}
                {sections && sections.length > 0 && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <HelpCircle className="w-5 h-5 text-blue-400" />
                            Sections ({sections.length})
                        </h3>
                        <div className="space-y-2">
                            {sections.map((section, index) => (
                                <div
                                    key={section.id || index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center text-xs font-medium text-white">
                                            {index + 1}
                                        </span>
                                        <span className="text-white">{section.sectionName}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-400">{section.questionCount} questions</span>
                                        <span className="text-emerald-400">+{section.marksPerQuestion}</span>
                                        <span className="text-red-400">-{section.negativeMarksPerQuestion}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Stats */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                                {templateData?.totalQuestions || totalQuestions} Total Questions
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-medium">
                                {templateData?.totalMarks || totalMarks} Total Marks
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizReviewStep;
