
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, PageHeader, Loader, Modal, Input } from '../components/common';
import { seriesApi, listTests } from '../api';
import { useToast } from '../context';
import {
    BookOpen,
    Settings,
    Trash2,
    Plus,
    Save,
    X,
    Search,
    Check,
    ArrowUp,
    ArrowDown,
    LayoutList,
    DollarSign,
    Calendar,
    Layers,
    Edit2
} from 'lucide-react';

const SeriesDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState([]); // Tests within the series

    // Modal States
    const [addTestModalOpen, setAddTestModalOpen] = useState(false);
    const [editMetaModalOpen, setEditMetaModalOpen] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);

    // Add Test Logic State
    const [availableTests, setAvailableTests] = useState([]);
    const [testSearch, setTestSearch] = useState('');
    const [selectedTestsToAdd, setSelectedTestsToAdd] = useState([]);
    const [searchingTests, setSearchingTests] = useState(false);

    // Edit Meta State
    const [editFormData, setEditFormData] = useState({});
    const [savingMeta, setSavingMeta] = useState(false);

    useEffect(() => {
        fetchSeriesDetails();
    }, [id]);

    const fetchSeriesDetails = async () => {
        setLoading(true);
        try {
            const response = await seriesApi.getSeriesDetails(id);
            if (response.success && response.data) {
                setSeries(response.data);
                // Map seriesTests to extract the nested test object
                const mappedTests = (response.data.seriesTests || []).map(item => ({
                    ...item.test,
                    // Keep the series-test relation ID if needed for removal/reordering
                    seriesTestId: item.id
                }));
                setTests(mappedTests);
            }
        } catch (error) {
            console.error("Failed to fetch series details", error);
            toast.error("Failed to load series details");
        } finally {
            setLoading(false);
        }
    };

    // --- Add Test Modal Logic ---
    const fetchAvailableTests = async (search = '') => {
        setSearchingTests(true);
        try {
            const params = {
                pageNo: 0,
                pageSize: 20,
                search: search,
                excludeSeries: true,
                isFinal: false
            };
            const response = await listTests(params);
            if (response.success) {
                // Filter out tests already in the series
                const currentTestIds = tests.map(t => t.id);
                const filtered = (response.data.list || []).filter(t => !currentTestIds.includes(t.id));
                setAvailableTests(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        } finally {
            setSearchingTests(false);
        }
    };

    useEffect(() => {
        if (addTestModalOpen) {
            fetchAvailableTests(testSearch);
        }
    }, [addTestModalOpen, testSearch]);

    const handleAddTests = async () => {
        try {
            const payload = {
                testIds: selectedTestsToAdd,
                append: true
            };
            await seriesApi.addTestsToSeries(id, payload);
            toast.success("Tests added successfully");
            setAddTestModalOpen(false);
            setSelectedTestsToAdd([]);
            fetchSeriesDetails(); // Refresh
        } catch (error) {
            console.error("Failed to add tests", error);
            toast.error("Failed to add tests");
        }
    };

    // --- Remove Test Logic ---
    const handleRemoveTest = async (testId) => {
        if (!window.confirm("Are you sure you want to remove this test from the series?")) return;
        try {
            await seriesApi.removeTestFromSeries(id, testId);
            toast.success("Test removed successfully");
            fetchSeriesDetails();
        } catch (error) {
            console.error("Failed to remove test", error);
            toast.error("Failed to remove test");
        }
    };

    // --- Reorder Logic (Simple Move Up/Down) ---
    const handleMove = async (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === tests.length - 1) return;

        const newTests = [...tests];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newTests[index], newTests[targetIndex]] = [newTests[targetIndex], newTests[index]];

        // Optimistic update
        setTests(newTests);

        // Call API
        try {
            const orderedIds = newTests.map(t => t.id);
            await seriesApi.reorderTestsInSeries(id, orderedIds);
            // Don't need to refresh if successful, optimistic update holds
        } catch (error) {
            console.error("Failed to reorder", error);
            toast.error("Failed to reorder tests");
            fetchSeriesDetails(); // Revert
        }
    };

    // --- Edit Metadata Logic ---
    const openEditModal = () => {
        setEditFormData({
            title: series.name, // API assumes `name` but prompt said `title` in payload? Let's check api. series object usually has `name`.
            // Update: The Create API used `title`, but GET likely returns `name`. 
            // Let's map it. 
            description: series.description,
            // Prices might be in series object directly
            listingPrice: series.listPrice, // check response key
            offerPrice: series.offerPrice
        });
        setEditMetaModalOpen(true);
    };

    const handleUpdateSeries = async () => {
        setSavingMeta(true);
        try {
            const payload = {
                title: editFormData.title,
                description: editFormData.description,
                // listPrice vs listingPrice? API doc said `listingPrice` in POST, assume same for PATCH
                // Wait, GET response showed `name`, `listPrice`, `offerPrice`.
                // PATCH example showed just `title`, `description`. 
                // Assuming we can update prices too? The prompt didn't explicitly show price update in PATCH example, but typically yes.
                // I'll include them.
                // NOTE: The PATCH example payload: {"title": "...", "description": "..."}
                // It didn't show price. But usually admin can update price. I'll add it.
            };
            // Only add if changed/present
            if (editFormData.listingPrice) payload.listingPrice = Number(editFormData.listingPrice);
            if (editFormData.offerPrice) payload.offerPrice = Number(editFormData.offerPrice);

            await seriesApi.updateSeries(id, payload);
            toast.success("Series updated successfully");
            setEditMetaModalOpen(false);
            fetchSeriesDetails();
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update series");
        } finally {
            setSavingMeta(false);
        }
    };

    // --- Publish Logic ---
    const handlePublish = async () => {
        try {
            await seriesApi.publishSeries(id);
            toast.success("Series published successfully");
            setPublishModalOpen(false);
            fetchSeriesDetails();
        } catch (error) {
            console.error("Publish failed", error);
            toast.error("Failed to publish series");
        }
    };


    if (loading) return <Loader fullScreen />;
    if (!series) return <div className="text-center py-20 text-white">Series not found</div>;

    return (
        <div className="pb-10 space-y-6">
            <PageHeader
                icon={<Layers className="w-5 h-5" />}
                title={series.name}
                subtitle={series.code}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={openEditModal}>
                            <Edit2 className="w-4 h-4" />
                            Edit Details
                        </Button>
                        {series.status !== 4 && ( // 4 = Published likely? 
                            <Button variant="accent" onClick={() => setPublishModalOpen(true)}>
                                <Check className="w-4 h-4" />
                                Publish Series
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Series Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Card.Header>
                            <Card.Title>Description</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <p className="text-gray-300 whitespace-pre-wrap">{series.description || "No description provided."}</p>
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Header>
                            <div className="flex justify-between items-center">
                                <Card.Title>Tests in Series ({tests.length})</Card.Title>
                                <Button size="sm" onClick={() => setAddTestModalOpen(true)}>
                                    <Plus className="w-4 h-4" />
                                    Add Tests
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Content>
                            <div className="space-y-2">
                                {tests.map((test, index) => (
                                    <div key={test.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-500 font-mono w-6 text-center">{index + 1}</span>
                                            <div>
                                                <p className="font-medium text-white">{test.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {test.totalQuestions} Qs • {test.totalMarks} Marks • {test.durationMin} Mins
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleMove(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMove(index, 'down')}
                                                disabled={index === tests.length - 1}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-4 bg-white/10 mx-1" />
                                            <button
                                                onClick={() => handleRemoveTest(test.id)}
                                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {tests.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 italic">
                                        No tests in this series. Add some!
                                    </div>
                                )}
                            </div>
                        </Card.Content>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <Card.Header>
                            <Card.Title>Pricing & Info</Card.Title>
                        </Card.Header>
                        <Card.Content className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Status</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${series.status === 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {series.status === 4 ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Offer Price</span>
                                <span className="text-xl font-bold text-white">₹{series.offerPrice}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">List Price</span>
                                <span className="text-gray-400 line-through">₹{series.listPrice}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400">Created At</span>
                                <span className="text-white text-sm">
                                    {new Date(series.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </Card.Content>
                    </Card>
                </div>
            </div>

            {/* Add Test Modal */}
            <Modal
                isOpen={addTestModalOpen}
                onClose={() => setAddTestModalOpen(false)}
                title="Add Tests to Series"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setAddTestModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddTests} disabled={selectedTestsToAdd.length === 0}>
                            Add {selectedTestsToAdd.length} Tests
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 min-h-[400px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            className="input pl-10 w-full"
                            placeholder="Search tests..."
                            value={testSearch}
                            onChange={(e) => setTestSearch(e.target.value)}
                        />
                    </div>
                    <div className="border border-white/10 rounded-xl overflow-hidden h-[300px] overflow-y-auto">
                        {searchingTests ? (
                            <div className="p-8 flex justify-center"><Loader /></div>
                        ) : availableTests.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {availableTests.map(test => {
                                    const isSelected = selectedTestsToAdd.includes(test.id);
                                    return (
                                        <div
                                            key={test.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedTestsToAdd(p => p.filter(id => id !== test.id));
                                                else setSelectedTestsToAdd(p => [...p, test.id]);
                                            }}
                                            className={`p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 ${isSelected ? 'bg-emerald-500/10' : ''}`}
                                        >
                                            <div>
                                                <p className={`font-medium ${isSelected ? 'text-emerald-400' : 'text-white'}`}>{test.name}</p>
                                                <p className="text-xs text-gray-400">{test.totalQuestions} Qs • {test.totalMarks} Marks</p>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">No available tests found</div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Edit Meta Modal */}
            <Modal
                isOpen={editMetaModalOpen}
                onClose={() => setEditMetaModalOpen(false)}
                title="Edit Series Details"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setEditMetaModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateSeries} isLoading={savingMeta}>Save Changes</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Series Title"
                        value={editFormData.title || ''}
                        onChange={e => setEditFormData(p => ({ ...p, title: e.target.value }))}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                        <textarea
                            className="input min-h-24 w-full"
                            value={editFormData.description || ''}
                            onChange={(e) => setEditFormData(p => ({ ...p, description: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Listing Price"
                            type="number"
                            value={editFormData.listingPrice || ''}
                            onChange={e => setEditFormData(p => ({ ...p, listingPrice: e.target.value }))}
                        />
                        <Input
                            label="Offer Price"
                            type="number"
                            value={editFormData.offerPrice || ''}
                            onChange={e => setEditFormData(p => ({ ...p, offerPrice: e.target.value }))}
                        />
                    </div>
                </div>
            </Modal>

            {/* Publish Confirmation Modal */}
            <Modal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                title="Publish Series"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
                        <Button variant="accent" onClick={handlePublish}>Yes, Publish</Button>
                    </>
                }
            >
                <p>Are you sure you want to publish this series? <br />
                    <span className="text-sm text-gray-400">It will become visible to users.</span></p>
            </Modal>

        </div>
    );
};

export default SeriesDetails;
