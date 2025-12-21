/**
 * Quiz Basic Info Step Component
 * Form for quiz name, description, duration, and price
 */

import { BookOpen, Clock, IndianRupee, FileText } from 'lucide-react';

const QuizBasicInfoStep = ({ data, onChange, errors }) => {
    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                <p className="text-gray-400 mt-2">Enter the essential details for your quiz</p>
            </div>

            <div className="max-w-xl mx-auto space-y-5">
                {/* Quiz Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quiz Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="e.g., JEE Main Mock Test 1"
                        className={`
              w-full px-4 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-gray-500
              focus:outline-none focus:ring-2 transition-all
              ${errors?.name
                                ? 'border-red-500/50 focus:ring-red-500/30'
                                : 'border-white/10 focus:ring-blue-500/30 focus:border-blue-500/50'
                            }
            `}
                    />
                    {errors?.name && (
                        <p className="text-red-400 text-sm mt-1.5">{errors.name}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        value={data.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Brief description of the quiz..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
                    />
                </div>

                {/* Duration & Price Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Clock className="w-4 h-4 inline mr-1.5" />
                            Duration (minutes)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={data.durationMin}
                            onChange={(e) => handleChange('durationMin', parseInt(e.target.value) || 0)}
                            placeholder="60"
                            className={`
                w-full px-4 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-gray-500
                focus:outline-none focus:ring-2 transition-all
                ${errors?.durationMin
                                    ? 'border-red-500/50 focus:ring-red-500/30'
                                    : 'border-white/10 focus:ring-blue-500/30 focus:border-blue-500/50'
                                }
              `}
                        />
                        {errors?.durationMin && (
                            <p className="text-red-400 text-sm mt-1.5">{errors.durationMin}</p>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <IndianRupee className="w-4 h-4 inline mr-1.5" />
                            Price (₹)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={data.price}
                            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                        />
                        <p className="text-gray-500 text-xs mt-1">Set to 0 for free quiz</p>
                    </div>
                </div>

                {/* Test Window */}
                <div className="pt-4 border-t border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        <FileText className="w-4 h-4 inline mr-1.5" />
                        Test Window (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Start Time</label>
                            <input
                                type="datetime-local"
                                value={data.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5">End Time</label>
                            <input
                                type="datetime-local"
                                value={data.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizBasicInfoStep;
