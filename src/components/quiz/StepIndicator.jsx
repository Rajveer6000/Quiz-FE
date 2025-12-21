/**
 * Step Indicator Component
 * Visual progress indicator for multi-step wizards
 */

import { Check } from 'lucide-react';

const StepIndicator = ({ steps, currentStep, onStepClick }) => {
    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isClickable = index < currentStep && onStepClick;

                return (
                    <div key={step.id} className="flex items-center">
                        {/* Step Circle */}
                        <button
                            onClick={() => isClickable && onStepClick(index)}
                            disabled={!isClickable}
                            className={`
                relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300
                ${isCompleted
                                    ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-400'
                                    : isCurrent
                                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                                        : 'bg-slate-700 text-gray-400'
                                }
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
              `}
                        >
                            {isCompleted ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </button>

                        {/* Step Label */}
                        <span
                            className={`
                hidden sm:block ml-3 text-sm font-medium transition-colors
                ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}
              `}
                        >
                            {step.label}
                        </span>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={`
                  w-12 sm:w-20 h-0.5 mx-3 transition-colors duration-300
                  ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}
                `}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;
