import { useState } from 'react';
import { Plus, Wallet as WalletIcon, Trash2, Loader2 } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency } from '../utils/format';


export default function Wallet() {
    const { accounts, isLoading, createAccount, deleteAccount } = useAccounts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'CHECKING' as const,
        initial_balance: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createAccount({
                name: newAccount.name,
                type: newAccount.type,
                initial_balance: Number(newAccount.initial_balance),
            });
            setIsModalOpen(false);
            setNewAccount({ name: '', type: 'CHECKING', initial_balance: 0 });
        } catch (error) {
            console.error('Failed to create account:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this account?')) {
            try {
                await deleteAccount(id);
            } catch (error) {
                console.error('Failed to delete account:', error);
            }
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
                    <h1 className="text-2xl font-bold text-secondary">My Wallet</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your accounts and balances</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                    <Plus size={20} />
                    Add Account
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts?.map((account) => (
                    <div key={account.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <WalletIcon size={24} />
                            </div>
                            <button
                                onClick={() => handleDelete(account.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-500 mb-1">{account.name}</h3>
                            <p className="text-2xl font-bold text-secondary">
                                {formatCurrency(account.initial_balance)}
                            </p>
                            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 font-medium">
                                {account.type}
                            </span>
                        </div>
                    </div>
                ))}

                {accounts?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                        <WalletIcon size={48} className="mb-4 opacity-50" />
                        <p>No accounts found. Create one to get started!</p>
                    </div>
                )}
            </div>

            {/* Add Account Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-secondary mb-4">Add New Account</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                <input
                                    type="text"
                                    value={newAccount.name}
                                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="e.g., Main Checking"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={newAccount.type}
                                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as any })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="CHECKING">Checking</option>
                                    <option value="SAVINGS">Savings</option>
                                    <option value="CASH">Cash</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newAccount.initial_balance}
                                    onChange={(e) => setNewAccount({ ...newAccount, initial_balance: Number(e.target.value) })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
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
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
