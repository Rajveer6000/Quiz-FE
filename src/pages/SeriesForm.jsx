
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, PageHeader, Loader } from '../components/common';
import { seriesApi, listTests } from '../api';
import { useToast } from '../context';
import { Search, Plus, X, Check } from 'lucide-react';

const SeriesForm = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        listingPrice: '',
        offerPrice: '',
        testIds: []
    });
    const [errors, setErrors] = useState({});

    // Test Selection State
    const [availableTests, setAvailableTests] = useState([]);
    const [testSearch, setTestSearch] = useState('');
    const [searchingTests, setSearchingTests] = useState(false);
    const [selectedTests, setSelectedTests] = useState([]);

    // Fetch initial tests
    useEffect(() => {
        fetchTests();
    }, []);

    // Search tests with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (testSearch) {
                fetchTests(testSearch);
            } else {
                fetchTests();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [testSearch]);

    const fetchTests = async (search = '') => {
        setSearchingTests(true);
        try {
            const params = {
                pageNo: 0,
                pageSize: 20,
                search: search,
                excludeSeries: true, // As per requirements, though API might not support it yet, it's good intent
                isFinal: false // Assuming we can add non-final tests too? Or only final? Requirement says "isFinal=false" in example
            };
            const response = await listTests(params);
            if (response.success) {
                setAvailableTests(response.data.list || []);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        } finally {
            setSearchingTests(false);
        }
    };

    const handleTestSelect = (test) => {
        if (selectedTests.find(t => t.id === test.id)) return;

        const newSelected = [...selectedTests, test];
        setSelectedTests(newSelected);
        setFormData(prev => ({
            ...prev,
            testIds: newSelected.map(t => t.id)
        }));

        // Clear error if resolved
        if (newSelected.length >= 2 && errors.testIds) {
            setErrors(prev => ({ ...prev, testIds: null }));
        }
    };

    const handleTestRemove = (testId) => {
        const newSelected = selectedTests.filter(t => t.id !== testId);
        setSelectedTests(newSelected);
        setFormData(prev => ({
            ...prev,
            testIds: newSelected.map(t => t.id)
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.listingPrice) newErrors.listingPrice = 'Listing price is required';
        if (!formData.offerPrice) newErrors.offerPrice = 'Offer price is required';
        if (Number(formData.offerPrice) > Number(formData.listingPrice)) {
            newErrors.offerPrice = 'Offer price cannot be greater than listing price';
        }
        if (selectedTests.length < 2) {
            newErrors.testIds = 'At least 2 tests must be selected';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                listingPrice: Number(formData.listingPrice),
                offerPrice: Number(formData.offerPrice),
                testIds: formData.testIds
            };

            await seriesApi.createSeries(payload);
            toast.success('Series created successfully');
            navigate('/series');
        } catch (error) {
            console.error('Failed to create series:', error);
            // Handle specific backend errors if needed
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <PageHeader
                icon={<Plus className="w-5 h-5" />}
                title="Create New Series"
                subtitle="Bundle multiple tests into a series"
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Details */}
                <Card>
                    <Card.Header>
                        <Card.Title>Series Details</Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                        <Input
                            label="Series Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. JEE Mains 2024 Full Series"
                            error={errors.title}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                            <textarea
                                className="input min-h-24 w-full"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what this series contains..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Listing Price (₹)"
                                type="number"
                                min="0"
                                value={formData.listingPrice}
                                onChange={(e) => setFormData({ ...formData, listingPrice: e.target.value })}
                                error={errors.listingPrice}
                                required
                            />
                            <Input
                                label="Offer Price (₹)"
                                type="number"
                                min="0"
                                value={formData.offerPrice}
                                onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                                error={errors.offerPrice}
                                required
                            />
                        </div>
                    </Card.Content>
                </Card>

                {/* Test Selection */}
                <Card>
                    <Card.Header>
                        <Card.Title>Select Tests</Card.Title>
                        <Card.Description>
                            Search and add tests to this series. Minimum 2 tests required.
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        {/* Selected Tests */}
                        {selectedTests.length > 0 && (
                            <div className="mb-6 space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    Selected Tests ({selectedTests.length})
                                </label>
                                <div className="space-y-2">
                                    {selectedTests.map((test) => (
                                        <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-emerald-100 font-medium">{test.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleTestRemove(test.id)}
                                                className="p-1 hover:bg-emerald-500/20 rounded-full transition-colors"
                                            >
                                                <X className="w-4 h-4 text-emerald-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {errors.testIds && (
                            <p className="text-red-400 text-sm mb-4">{errors.testIds}</p>
                        )}

                        {/* Search and List */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="input pl-10 w-full"
                                    placeholder="Search tests by name..."
                                    value={testSearch}
                                    onChange={(e) => setTestSearch(e.target.value)}
                                />
                            </div>

                            <div className="border border-white/10 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                                {searchingTests ? (
                                    <div className="p-8 flex justify-center">
                                        <Loader />
                                    </div>
                                ) : availableTests.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {availableTests.map((test) => {
                                            const isSelected = selectedTests.some(t => t.id === test.id);
                                            return (
                                                <div
                                                    key={test.id}
                                                    className={`p-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors ${isSelected ? 'opacity-50' : ''}`}
                                                >
                                                    <div>
                                                        <p className="font-medium text-white">{test.name}</p>
                                                        <div className="flex gap-2 text-xs text-gray-400 mt-1">
                                                            <span>{test.totalQuestions} Questions</span>
                                                            <span>•</span>
                                                            <span>{test.totalMarks} Marks</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant={isSelected ? "ghost" : "outline"}
                                                        onClick={() => handleTestSelect(test)}
                                                        disabled={isSelected}
                                                    >
                                                        {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                        {isSelected ? 'Added' : 'Add'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        No tests found
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => navigate('/series')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={saving}>
                        Create Series
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SeriesForm;
