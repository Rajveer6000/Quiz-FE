/**
 * Quiz Type Selector Component
 * Choose between Empty, Template-based, or Custom quiz creation
 */

import { FileText, LayoutTemplate, Settings } from 'lucide-react';

const quizTypes = [
    {
        id: 'template',
        icon: LayoutTemplate,
        title: 'Use Template',
        description: 'Use JEE/NEET template with pre-defined sections',
        color: 'violet',
        recommended: true,
    },
    {
        id: 'custom',
        icon: Settings,
        title: 'Custom Sections',
        description: 'Define your own sections and structure',
        color: 'emerald',
        recommended: false,
    },
];

const colorClasses = {
    blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/50',
        ring: 'ring-blue-500/30',
        icon: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-400',
    },
    violet: {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/50',
        ring: 'ring-violet-500/30',
        icon: 'text-violet-400',
        badge: 'bg-violet-500/20 text-violet-400',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/50',
        ring: 'ring-emerald-500/30',
        icon: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-400',
    },
};

const QuizTypeSelector = ({ selectedType, onSelect }) => {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                    <LayoutTemplate className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Choose Quiz Type</h2>
                <p className="text-gray-400 mt-2">Select how you want to create your quiz</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {quizTypes.map((type) => {
                    const IconComp = type.icon;
                    const colors = colorClasses[type.color];
                    const isSelected = selectedType === type.id;

                    return (
                        <button
                            key={type.id}
                            onClick={() => !type.disabled && onSelect(type.id)}
                            disabled={type.disabled}
                            className={`
                relative p-6 rounded-2xl border-2 text-left transition-all duration-300
                ${type.disabled
                                    ? 'opacity-50 cursor-not-allowed bg-slate-800/30 border-white/5'
                                    : isSelected
                                        ? `${colors.bg} ${colors.border} ring-4 ${colors.ring}`
                                        : 'bg-slate-800/50 border-white/10 hover:border-white/20 hover:bg-slate-800/70'
                                }
              `}
                        >
                            {/* Recommended Badge */}
                            {type.recommended && !type.disabled && (
                                <span className={`absolute -top-2 right-4 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                                    Recommended
                                </span>
                            )}

                            {/* Coming Soon Badge */}
                            {type.disabled && (
                                <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                                    Coming Soon
                                </span>
                            )}

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                                <IconComp className={`w-6 h-6 ${colors.icon}`} />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-semibold text-white mb-1">{type.title}</h3>
                            <p className="text-sm text-gray-400">{type.description}</p>

                            {/* Selected Indicator */}
                            {isSelected && (
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center`}>
                                    <div className={`w-3 h-3 rounded-full bg-${type.color}-500`} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizTypeSelector;
