import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Trash2, Loader2, Filter, Pencil } from 'lucide-react';
import { useTransactions, type Transaction } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export default function Transactions() {
    const { user } = useAuth();
    const { transactions, isLoading, createTransaction, deleteTransaction, updateTransaction } = useTransactions();
    const { accounts } = useAccounts();
    const { categories } = useCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const [formData, setFormData] = useState({
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        account_id: '',
        category_id: '',
        to_account_id: '', // For Transfer
    });

    const handleOpenModal = (transaction?: Transaction) => {
        if (transaction) {
            setEditingTransaction(transaction);
            setFormData({
                type: transaction.type,
                amount: transaction.amount.toString(),
                date: transaction.date.split('T')[0],
                description: transaction.description || '',
                account_id: transaction.account_id || transaction.from_account_id || '',
                category_id: transaction.category_id || '',
                to_account_id: transaction.to_account_id || '',
            });
        } else {
            setEditingTransaction(null);
            setFormData({
                type: 'EXPENSE',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                account_id: '',
                category_id: '',
                to_account_id: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload: any = {
                user_id: user?.id,
                type: formData.type,
                amount: Number(formData.amount),
                date: formData.date,
                description: formData.description,
            };

            if (formData.type === 'TRANSFER') {
                payload.from_account_id = formData.account_id;
                payload.to_account_id = formData.to_account_id;
                payload.account_id = null;
                payload.category_id = null;
            } else {
                payload.account_id = formData.account_id;
                payload.category_id = formData.category_id;
                payload.from_account_id = null;
                payload.to_account_id = null;
            }

            if (editingTransaction) {
                await updateTransaction(editingTransaction.id, payload);
            } else {
                await createTransaction(payload);
            }

            setIsModalOpen(false);
            setEditingTransaction(null);
            setFormData({
                type: 'EXPENSE',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                account_id: '',
                category_id: '',
                to_account_id: '',
            });
        } catch (error) {
            console.error('Failed to save transaction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this transaction?')) {
            await deleteTransaction(id);
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
                    <h1 className="text-2xl font-bold text-secondary">Transactions</h1>
                    <p className="text-gray-500 text-sm mt-1">Track your income and expenses</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                    <Plus size={20} />
                    Add Transaction
                </button>
            </header>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-secondary">Recent Activity</h3>
                    <button className="text-gray-400 hover:text-primary">
                        <Filter size={20} />
                    </button>
                </div>

                <div className="divide-y divide-gray-50">
                    {transactions?.map((t) => (
                        <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    t.type === 'INCOME' && "bg-green-100 text-green-600",
                                    t.type === 'EXPENSE' && "bg-red-100 text-red-600",
                                    t.type === 'TRANSFER' && "bg-blue-100 text-blue-600",
                                )}>
                                    {t.type === 'INCOME' && <ArrowUpRight size={20} />}
                                    {t.type === 'EXPENSE' && <ArrowDownLeft size={20} />}
                                    {t.type === 'TRANSFER' && <ArrowRightLeft size={20} />}
                                </div>
                                <div>
                                    <p className="font-medium text-secondary">
                                        {t.description || t.category?.name || 'Transfer'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {format(new Date(t.date), 'MMM dd, yyyy')} • {t.account?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={clsx(
                                    "font-bold",
                                    t.type === 'INCOME' ? "text-green-600" : "text-secondary"
                                )}>
                                    {t.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(t.amount)}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(t)}
                                        className="text-gray-300 hover:text-primary"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="text-gray-300 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {transactions?.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            No transactions found.
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-secondary mb-4">
                            {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                        </h2>

                        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                            {['EXPENSE', 'INCOME', 'TRANSFER'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFormData({ ...formData, type: type as any })}
                                    className={clsx(
                                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                        formData.type === type
                                            ? "bg-white text-secondary shadow-sm"
                                            : "text-gray-500 hover:text-secondary"
                                    )}
                                >
                                    {type.charAt(0) + type.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-lg font-bold"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="e.g., Grocery shopping"
                                />
                            </div>

                            {/* Account Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'TRANSFER' ? 'From Account' : 'Account'}
                                </label>
                                <select
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {accounts?.map((acc) => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Transfer Destination */}
                            {formData.type === 'TRANSFER' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                                    <select
                                        value={formData.to_account_id}
                                        onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                        required
                                    >
                                        <option value="">Select Destination</option>
                                        {accounts?.filter(a => a.id !== formData.account_id).map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Category Selection (Not for Transfer) */}
                            {formData.type !== 'TRANSFER' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories
                                            ?.filter(c => c.type === formData.type)
                                            .map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                    </select>
                                </div>
                            )}

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
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingTransaction ? 'Save Changes' : 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
