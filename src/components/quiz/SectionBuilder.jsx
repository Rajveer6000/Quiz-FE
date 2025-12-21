/**
 * Section Builder Component
 * Create and manage custom sections for a quiz
 */

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Layers, BookOpen } from 'lucide-react';

const defaultSection = {
    sectionName: '',
    subjectName: '',
    questionCount: 10,
    marksPerQuestion: 4,
    negativeMarksPerQuestion: 1,
};

const SectionBuilder = ({ sections, onChange, errors }) => {
    const addSection = () => {
        onChange([...sections, { ...defaultSection, id: Date.now() }]);
    };

    const updateSection = (index, field, value) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const removeSection = (index) => {
        if (sections.length > 1) {
            const updated = sections.filter((_, i) => i !== index);
            onChange(updated);
        }
    };

    const moveSection = (from, to) => {
        if (to < 0 || to >= sections.length) return;
        const updated = [...sections];
        const [removed] = updated.splice(from, 1);
        updated.splice(to, 0, removed);
        onChange(updated);
    };

    // Calculate totals
    const totalQuestions = sections.reduce((sum, s) => sum + (parseInt(s.questionCount) || 0), 0);
    const totalMarks = sections.reduce((sum, s) => {
        const qs = parseInt(s.questionCount) || 0;
        const marks = parseFloat(s.marksPerQuestion) || 0;
        return sum + (qs * marks);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Layers className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Build Sections</h2>
                <p className="text-gray-400 mt-2">Define your quiz sections and their structure</p>
            </div>

            {/* Summary Stats */}
            <div className="flex justify-center gap-6 mb-6">
                <div className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium">
                    {sections.length} Section{sections.length !== 1 ? 's' : ''}
                </div>
                <div className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 text-sm font-medium">
                    {totalQuestions} Questions
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                    {totalMarks} Total Marks
                </div>
            </div>

            {/* Error Message */}
            {errors?.sections && (
                <p className="text-red-400 text-sm text-center mb-4">{errors.sections}</p>
            )}

            {/* Sections List */}
            <div className="max-w-3xl mx-auto space-y-4">
                {sections.map((section, index) => (
                    <div
                        key={section.id || index}
                        className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="cursor-grab text-gray-500 hover:text-gray-300"
                                    onMouseDown={() => { }}
                                >
                                    <GripVertical className="w-5 h-5" />
                                </button>
                                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    {index + 1}
                                </span>
                                <span className="text-white font-medium">
                                    {section.sectionName || `Section ${index + 1}`}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSection(index)}
                                disabled={sections.length <= 1}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Section Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Section Name */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5">Section Name *</label>
                                <input
                                    type="text"
                                    value={section.sectionName}
                                    onChange={(e) => updateSection(index, 'sectionName', e.target.value)}
                                    placeholder="e.g., Mechanics"
                                    className="w-full px-3 py-2.5 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm"
                                />
                            </div>

                            {/* Subject Name */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5">Subject</label>
                                <input
                                    type="text"
                                    value={section.subjectName}
                                    onChange={(e) => updateSection(index, 'subjectName', e.target.value)}
                                    placeholder="e.g., Physics"
                                    className="w-full px-3 py-2.5 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm"
                                />
                            </div>

                            {/* Question Count */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5">No. of Questions</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={section.questionCount}
                                    onChange={(e) => updateSection(index, 'questionCount', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2.5 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm"
                                />
                            </div>

                            {/* Marks Per Question */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">+Marks</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.25"
                                        value={section.marksPerQuestion}
                                        onChange={(e) => updateSection(index, 'marksPerQuestion', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">-Marks</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.25"
                                        value={section.negativeMarksPerQuestion}
                                        onChange={(e) => updateSection(index, 'negativeMarksPerQuestion', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-slate-700/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Section Button */}
                <button
                    type="button"
                    onClick={addSection}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Section
                </button>
            </div>
        </div>
    );
};

export default SectionBuilder;
