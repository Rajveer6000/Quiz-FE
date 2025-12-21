/**
 * Template Selector Component
 * Select test type and template with section preview
 */

import { useState, useEffect } from 'react';
import { LayoutTemplate, BookOpen, ChevronRight, Users, Clock, HelpCircle } from 'lucide-react';
import { getTestTypes, getTemplatesByType, getTemplateSections } from '../../api/testsApi';

const TemplateSelector = ({ selectedTemplate, onSelect }) => {
    const [testTypes, setTestTypes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);

    // Fetch test types on mount
    useEffect(() => {
        fetchTestTypes();
    }, []);

    // Fetch templates when type is selected
    useEffect(() => {
        if (selectedType) {
            fetchTemplates(selectedType);
        }
    }, [selectedType]);

    // Fetch sections when template is selected
    useEffect(() => {
        if (selectedTemplate) {
            fetchSections(selectedTemplate);
        }
    }, [selectedTemplate]);

    const fetchTestTypes = async () => {
        try {
            const response = await getTestTypes();
            if (response.success) {
                setTestTypes(response.data?.list || []);
            }
        } catch (error) {
            console.error('Failed to fetch test types:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async (typeId) => {
        setLoadingTemplates(true);
        try {
            const response = await getTemplatesByType(typeId);
            if (response.success) {
                setTemplates(response.data?.list || []);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const fetchSections = async (templateId) => {
        setLoadingSections(true);
        try {
            const response = await getTemplateSections(templateId);
            if (response.success) {
                setSections(response.data?.list || []);
            }
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleTypeSelect = (typeId) => {
        setSelectedType(typeId);
        setTemplates([]);
        setSections([]);
        onSelect(null); // Reset template selection
    };

    const handleTemplateSelect = (templateId) => {
        onSelect(templateId);
    };

    const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                    <LayoutTemplate className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Select Template</h2>
                <p className="text-gray-400 mt-2">Choose a test type and template to get started</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Test Types & Templates */}
                    <div className="space-y-4">
                        {/* Test Types */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                1. Select Test Type
                            </label>
                            <div className="space-y-2">
                                {testTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className={`
                      w-full flex items-center justify-between p-4 rounded-xl border transition-all
                      ${selectedType === type.id
                                                ? 'bg-violet-500/20 border-violet-500/50'
                                                : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                                            }
                    `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-violet-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-white">{type.name}</p>
                                                <p className="text-sm text-gray-400">{type.description || type.code}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 transition-transform ${selectedType === type.id ? 'text-violet-400 rotate-90' : 'text-gray-500'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Templates */}
                        {selectedType && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    2. Select Template
                                </label>
                                {loadingTemplates ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : templates.length > 0 ? (
                                    <div className="space-y-2">
                                        {templates.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleTemplateSelect(template.id)}
                                                className={`
                          w-full flex items-center justify-between p-4 rounded-xl border transition-all
                          ${selectedTemplate === template.id
                                                        ? 'bg-blue-500/20 border-blue-500/50'
                                                        : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                                                    }
                        `}
                                            >
                                                <div className="text-left">
                                                    <p className="font-medium text-white">{template.name}</p>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <HelpCircle className="w-4 h-4" />
                                                            {template.totalQuestions} questions
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {template.durationMin} mins
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedTemplate === template.id && (
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No templates available for this type
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Section Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Section Preview
                        </label>
                        <div className="bg-slate-800/30 border border-white/10 rounded-xl p-4 min-h-[300px]">
                            {selectedTemplate && selectedTemplateData ? (
                                <>
                                    <div className="mb-4 pb-4 border-b border-white/10">
                                        <h3 className="font-semibold text-white">{selectedTemplateData.name}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{selectedTemplateData.description}</p>
                                        <div className="flex items-center gap-4 mt-3">
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                                                {selectedTemplateData.totalQuestions} Questions
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-medium">
                                                {selectedTemplateData.totalMarks} Marks
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                                {selectedTemplateData.durationMin} Minutes
                                            </span>
                                        </div>
                                    </div>

                                    {loadingSections ? (
                                        <div className="flex justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : sections.length > 0 ? (
                                        <div className="space-y-3">
                                            {sections.map((section, index) => (
                                                <div
                                                    key={section.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center text-sm font-medium text-white">
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <p className="font-medium text-white text-sm">{section.sectionName}</p>
                                                            <p className="text-xs text-gray-400">{section.subjectName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-white">{section.questionCount} Qs</p>
                                                        <p className="text-xs text-gray-400">
                                                            +{section.marksPerQuestion} / -{section.negativeMarksPerQuestion}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No sections defined
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
                                    <LayoutTemplate className="w-12 h-12 mb-3 opacity-50" />
                                    <p>Select a template to preview sections</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateSelector;
