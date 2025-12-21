/**
 * Quiz Wizard Page
 * Multi-step wizard for creating quizzes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, PageHeader } from '../components/common';
import {
    StepIndicator,
    QuizBasicInfoStep,
    QuizTypeSelector,
    TemplateSelector,
    SectionBuilder,
    QuizReviewStep,
} from '../components/quiz';
import { createTest, getTemplateSections } from '../api/testsApi';
import { useToast } from '../context';
import { BookOpen, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const ALL_STEPS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'type', label: 'Quiz Type' },
    { id: 'template', label: 'Template' },
    { id: 'sections', label: 'Sections' },
    { id: 'review', label: 'Review' },
];

const QuizWizard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [creating, setCreating] = useState(false);
    const [errors, setErrors] = useState({});

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        durationMin: 60,
        price: 0,
        startTime: '',
        endTime: '',
    });

    // Quiz type: 'template' | 'custom'
    const [quizType, setQuizType] = useState('template');

    // Template selection
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateData, setTemplateData] = useState(null);
    const [templateSections, setTemplateSections] = useState([]);

    // Custom sections
    const [customSections, setCustomSections] = useState([
        {
            id: Date.now(),
            sectionName: '',
            subjectName: '',
            questionCount: 10,
            marksPerQuestion: 4,
            negativeMarksPerQuestion: 1,
        },
    ]);

    // Fetch template sections when template is selected
    useEffect(() => {
        if (selectedTemplate) {
            fetchTemplateSections(selectedTemplate);
        }
    }, [selectedTemplate]);

    const fetchTemplateSections = async (templateId) => {
        try {
            const response = await getTemplateSections(templateId);
            if (response.success) {
                setTemplateSections(response.data?.list || []);
            }
        } catch (error) {
            console.error('Failed to fetch template sections:', error);
        }
    };

    // Get visible steps based on quiz type
    const getVisibleSteps = () => {
        if (quizType === 'template') {
            // Template: Basic -> Type -> Template -> Review
            return ALL_STEPS.filter(s => s.id !== 'sections');
        } else {
            // Custom: Basic -> Type -> Sections -> Review
            return ALL_STEPS.filter(s => s.id !== 'template');
        }
    };

    const visibleSteps = getVisibleSteps();
    const isLastStep = currentStep === visibleSteps.length - 1;

    // Validation
    const validateStep = (step) => {
        const stepId = visibleSteps[step]?.id;
        const newErrors = {};

        if (stepId === 'basic') {
            if (!formData.name.trim()) {
                newErrors.name = 'Quiz name is required';
            }
            if (formData.durationMin < 1) {
                newErrors.durationMin = 'Duration must be at least 1 minute';
            }
        }

        if (stepId === 'template' && quizType === 'template') {
            if (!selectedTemplate) {
                toast.error('Please select a template');
                return false;
            }
        }

        if (stepId === 'sections' && quizType === 'custom') {
            const hasEmptyName = customSections.some(s => !s.sectionName.trim());
            if (hasEmptyName) {
                newErrors.sections = 'All sections must have a name';
            }
            if (customSections.length === 0) {
                newErrors.sections = 'Add at least one section';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navigation
    const goNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, visibleSteps.length - 1));
        }
    };

    const goBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const goToStep = (index) => {
        if (index < currentStep) {
            setCurrentStep(index);
        }
    };

    // Handle quiz type change
    const handleQuizTypeChange = (type) => {
        setQuizType(type);
        setSelectedTemplate(null);
        setTemplateData(null);
        setTemplateSections([]);
        // Reset custom sections when switching types
        if (type === 'custom') {
            setCustomSections([
                {
                    id: Date.now(),
                    sectionName: '',
                    subjectName: '',
                    questionCount: 10,
                    marksPerQuestion: 4,
                    negativeMarksPerQuestion: 1,
                },
            ]);
        }
    };

    // Create quiz
    const handleCreate = async () => {
        if (!validateStep(currentStep)) return;

        setCreating(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                durationMin: formData.durationMin,
                price: formData.price,
            };

            if (formData.startTime) {
                payload.startTime = new Date(formData.startTime).toISOString();
            }
            if (formData.endTime) {
                payload.endTime = new Date(formData.endTime).toISOString();
            }

            if (quizType === 'template' && selectedTemplate) {
                payload.templateId = selectedTemplate;
            }

            if (quizType === 'custom' && customSections.length > 0) {
                payload.sections = customSections.map((section, index) => ({
                    sectionName: section.sectionName,
                    subjectName: section.subjectName || section.sectionName,
                    questionCount: section.questionCount,
                    marksPerQuestion: section.marksPerQuestion,
                    negativeMarksPerQuestion: section.negativeMarksPerQuestion,
                    sectionOrder: index + 1,
                }));
            }

            const response = await createTest(payload);

            if (response.success) {
                toast.success('Quiz created successfully!');
                navigate(`/tests/${response.data.id}/edit`);
            } else {
                toast.error(response.message || 'Failed to create quiz');
            }
        } catch (error) {
            console.error('Failed to create quiz:', error);
            toast.error('Failed to create quiz');
        } finally {
            setCreating(false);
        }
    };

    // Get sections for review
    const getReviewSections = () => {
        if (quizType === 'template') {
            return templateSections;
        } else if (quizType === 'custom') {
            return customSections;
        }
        return [];
    };

    // Render current step content
    const renderStepContent = () => {
        const stepId = visibleSteps[currentStep]?.id;

        switch (stepId) {
            case 'basic':
                return (
                    <QuizBasicInfoStep
                        data={formData}
                        onChange={setFormData}
                        errors={errors}
                    />
                );

            case 'type':
                return (
                    <QuizTypeSelector
                        selectedType={quizType}
                        onSelect={handleQuizTypeChange}
                    />
                );

            case 'template':
                return (
                    <TemplateSelector
                        selectedTemplate={selectedTemplate}
                        onSelect={(templateId) => {
                            setSelectedTemplate(templateId);
                        }}
                    />
                );

            case 'sections':
                return (
                    <SectionBuilder
                        sections={customSections}
                        onChange={setCustomSections}
                        errors={errors}
                    />
                );

            case 'review':
                return (
                    <QuizReviewStep
                        data={formData}
                        quizType={quizType}
                        templateData={templateData}
                        sections={getReviewSections()}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div>
            <PageHeader
                icon={<BookOpen className="w-5 h-5" />}
                title="Create Quiz"
                subtitle="Set up your quiz in a few simple steps"
            />

            <div className="max-w-5xl mx-auto">
                {/* Step Indicator */}
                <StepIndicator
                    steps={visibleSteps}
                    currentStep={currentStep}
                    onStepClick={goToStep}
                />

                {/* Step Content */}
                <div className="bg-slate-800/30 border border-white/10 rounded-2xl p-6 lg:p-8 min-h-[400px]">
                    {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6">
                    <Button
                        variant="ghost"
                        onClick={currentStep === 0 ? () => navigate('/tests') : goBack}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </Button>

                    <div className="flex items-center gap-3">
                        {!isLastStep ? (
                            <Button variant="primary" onClick={goNext}>
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="success"
                                onClick={handleCreate}
                                isLoading={creating}
                            >
                                <Sparkles className="w-4 h-4" />
                                Create Quiz
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizWizard;
