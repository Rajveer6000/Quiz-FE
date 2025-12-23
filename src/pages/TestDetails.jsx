/**
 * TestDetails Page
 * View comprehensive test details including sections and questions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Loader, PageHeader, Modal } from '../components/common';
import { getTest, finalizeTest } from '../api';
import { useToast } from '../context';
import {
    Clock,
    Award,
    BookOpen,
    CheckCircle,
    HelpCircle,
    AlertTriangle,
    ChevronRight,
    Eye,
    FileText
} from 'lucide-react';

const TestDetails = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        fetchTestDetails();
    }, [testId]);

    const fetchTestDetails = async () => {
        try {
            const response = await getTest(testId);
            if (response.success) {
                setTest(response.data);
            } else {
                toast.error(response.message || 'Failed to fetch test details');
            }
        } catch (error) {
            console.error('Failed to fetch test:', error);
            toast.error('Failed to load test details');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const response = await finalizeTest(testId);
            if (response.success) {
                toast.success('Test published successfully!');
                setPublishModalOpen(false);
                fetchTestDetails(); // Refresh to show updated status
            } else {
                toast.error(response.message || 'Failed to publish test');
            }
        } catch (error) {
            console.error('Failed to publish test:', error);
            toast.error('Failed to publish test');
        } finally {
            setPublishing(false);
        }
    };

    if (loading) return <Loader fullScreen />;
    if (!test) return <div className="p-8 text-center text-gray-400">Test not found</div>;

    const activeSection = test.sections?.[activeTab];
    const isPublished = test.status === 'PUBLISHED' || test.isFinal; // Adjust based on API response

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <PageHeader
                        icon="T"
                        title={test.name}
                        subtitle={test.description || 'No description provided'}
                    />
                    <div className="flex items-center gap-4 mt-2 px-1">
                        <Badge variant={isPublished ? 'success' : 'warning'}>
                            {isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{test.durationMin} mins</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <Award className="w-4 h-4" />
                            <span>{test.totalMarks || 0} marks</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <HelpCircle className="w-4 h-4" />
                            <span>{test.totalQuestions || 0} questions</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate('/tests')}>
                        Back to List
                    </Button>
                    {!isPublished && (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/tests/${testId}/edit`)}>
                                Edit Settings
                            </Button>
                            <Button variant="success" onClick={() => setPublishModalOpen(true)}>
                                Publish Test
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800/50 border-white/5">
                    <Card.Content className="flex items-center gap-4 p-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-medium">Sections</p>
                            <p className="text-xl font-bold text-white">{test.sections?.length || 0}</p>
                        </div>
                    </Card.Content>
                </Card>
                <Card className="bg-slate-800/50 border-white/5">
                    <Card.Content className="flex items-center gap-4 p-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-medium">Published</p>
                            <p className="text-xl font-bold text-white">{isPublished ? 'Yes' : 'No'}</p>
                        </div>
                    </Card.Content>
                </Card>
                {/* Add more stats if available */}
            </div>

            {/* Sections & Questions */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Section Tabs Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <h3 className="text-sm font-medium text-gray-400 uppercase px-1 mb-2">Sections</h3>
                    {test.sections?.map((section, index) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveTab(index)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${activeTab === index
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                    : 'bg-slate-800/50 border-white/5 text-gray-400 hover:bg-slate-700/50 hover:text-gray-200'
                                }`}
                        >
                            <div className="truncate">
                                <span className="block font-medium truncate">{section.sectionName}</span>
                                <span className="text-xs opacity-70">{section.currentQuestionCount || 0} questions</span>
                            </div>
                            {activeTab === index && <ChevronRight className="w-4 h-4" />}
                        </button>
                    ))}
                </div>

                {/* Questions List */}
                <div className="lg:col-span-3">
                    {activeSection ? (
                        <Card>
                            <Card.Header className="flex flex-row items-center justify-between">
                                <div>
                                    <Card.Title>{activeSection.sectionName}</Card.Title>
                                    <Card.Description>
                                        {activeSection.subjectName} • {activeSection.questionType?.name || 'Mixed Types'} • {activeSection.marksPerQuestion} marks each
                                    </Card.Description>
                                </div>
                                {!isPublished && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(`/tests/${testId}/sections/${activeSection.id}/questions`)}
                                    >
                                        Manage Questions
                                    </Button>
                                )}
                            </Card.Header>
                            <Card.Content className="space-y-4">
                                {activeSection.questions && activeSection.questions.length > 0 ? (
                                    activeSection.questions.map((question, qIndex) => (
                                        <div key={question.id} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-gray-300">
                                                        {qIndex + 1}
                                                    </span>
                                                    <Badge variant="outline" size="sm">
                                                        {/* Attempt to get type name politely */}
                                                        {question.questionType?.name || (question.options?.length > 0 ? 'MCQ' : 'Numeric')}
                                                    </Badge>
                                                </div>
                                                <span className="text-xs font-mono text-gray-500">ID: {question.id}</span>
                                            </div>

                                            <p className="text-gray-200 whitespace-pre-wrap pl-9 text-sm">{question.questionText}</p>

                                            {/* Options or Answer */}
                                            <div className="pl-9 space-y-2">
                                                {question.options && question.options.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {question.options.map((opt, oIndex) => (
                                                            <div
                                                                key={oIndex}
                                                                className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${opt.isCorrect
                                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                                        : 'bg-slate-800/30 border-white/5 text-gray-400'
                                                                    }`}
                                                            >
                                                                <span className="font-semibold opacity-70">{opt.optionLabel}.</span>
                                                                <span>{opt.optionText}</span>
                                                                {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm inline-block">
                                                        <span className="font-medium text-emerald-500">Correct Answer:</span> {question.answer}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No questions added to this section yet.</p>
                                    </div>
                                )}
                            </Card.Content>
                        </Card>
                    ) : (
                        <Card>
                            <Card.Content className="text-center py-12">
                                <p className="text-gray-400">Select a section to view questions</p>
                            </Card.Content>
                        </Card>
                    )}
                </div>
            </div>

            {/* Publish Confirmation Modal */}
            <Modal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                title="Publish Test"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                            <Eye className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Ready to publish?</h4>
                            <p className="text-sm text-gray-400 mt-1">
                                Once published, this test will be available for examinees to take.
                                You won't be able to edit questions or settings after publishing unless you unpublish it.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
                        <Button variant="success" isLoading={publishing} onClick={handlePublish}>
                            Confirm & Publish
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TestDetails;
