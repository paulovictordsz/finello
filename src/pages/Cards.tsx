import { useState } from 'react';
import { Plus, CreditCard, Trash2, Loader2, Calendar } from 'lucide-react';
import { useCards } from '../hooks/useCards';
import { formatCurrency } from '../utils/format';


export default function Cards() {
    const { cards, isLoading, createCard, deleteCard } = useCards();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        limit_amount: '',
        closing_day: '',
        due_day: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createCard({
                name: formData.name,
                limit_amount: Number(formData.limit_amount),
                closing_day: Number(formData.closing_day),
                due_day: Number(formData.due_day),
            });
            setIsModalOpen(false);
            setFormData({ name: '', limit_amount: '', closing_day: '', due_day: '' });
        } catch (error) {
            console.error('Failed to create card:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this card?')) {
            await deleteCard(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Credit Cards</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your credit cards and limits</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                    <Plus size={20} />
                    Add Card
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards?.map((card) => (
                    <div key={card.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                                <CreditCard size={24} />
                            </div>
                            <button
                                onClick={() => handleDelete(card.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <h3 className="font-bold text-lg text-secondary mb-1">{card.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">Limit: {formatCurrency(card.limit_amount)}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span>Closes: {card.closing_day}th</span>
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span>Due: {card.due_day}th</span>
                            </div>
                        </div>
                    </div>
                ))}

                {cards?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                        <CreditCard size={48} className="mb-4 opacity-50" />
                        <p>No credit cards found.</p>
                    </div>
                )}
            </div>

            {/* Add Card Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-secondary mb-4">Add New Card</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="e.g., Nubank"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Limit Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.limit_amount}
                                    onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Day</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.closing_day}
                                        onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Day</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.due_day}
                                        onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Card'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
