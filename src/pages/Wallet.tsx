import { useState } from 'react';
import { Plus, Wallet as WalletIcon, Trash2, Loader2, Pencil, AlertTriangle } from 'lucide-react';
import { useAccounts, type Account } from '../hooks/useAccounts';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';

export default function Wallet() {
    const { user } = useAuth();
    const { accounts, isLoading, createAccount, deleteAccount, updateAccount } = useAccounts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'OTHER';
        initial_balance: number;
    }>({
        name: '',
        type: 'CHECKING',
        initial_balance: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenModal = (account?: Account) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                name: account.name,
                type: account.type,
                initial_balance: account.initial_balance,
            });
        } else {
            setEditingAccount(null);
            setFormData({ name: '', type: 'CHECKING', initial_balance: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            if (editingAccount) {
                await updateAccount(editingAccount.id, {
                    name: formData.name,
                    type: formData.type,
                    initial_balance: Number(formData.initial_balance),
                });
            } else {
                await createAccount({
                    user_id: user.id,
                    name: formData.name,
                    type: formData.type,
                    initial_balance: Number(formData.initial_balance),
                });
            }
            setIsModalOpen(false);
            setEditingAccount(null);
            setFormData({ name: '', type: 'CHECKING', initial_balance: 0 });
        } catch (error) {
            console.error('Failed to save account:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (account: Account) => {
        setAccountToDelete(account);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;

        try {
            await deleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    const getAccountTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            CHECKING: 'Conta Corrente',
            SAVINGS: 'Poupança',
            CASH: 'Dinheiro',
            OTHER: 'Outro'
        };
        return types[type] || type;
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
                    <h1 className="text-2xl font-bold text-secondary">Minha Carteira</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie suas contas e saldos</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                    <Plus size={20} />
                    Nova Conta
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts?.map((account) => (
                    <div key={account.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <WalletIcon size={24} />
                            </div>

                            {/* Desktop Actions (Hover) */}
                            <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(account)}
                                    className="text-gray-400 hover:text-primary"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(account)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Mobile Actions (Always Visible) */}
                            <div className="md:hidden flex gap-3">
                                <button
                                    onClick={() => handleOpenModal(account)}
                                    className="text-gray-400"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(account)}
                                    className="text-gray-400"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-500 mb-1">{account.name}</h3>
                            <p className="text-2xl font-bold text-secondary">
                                {formatCurrency(account.initial_balance)}
                            </p>
                            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 font-medium">
                                {getAccountTypeLabel(account.type)}
                            </span>
                        </div>
                    </div>
                ))}

                {accounts?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                        <WalletIcon size={48} className="mb-4 opacity-50" />
                        <p>Nenhuma conta encontrada. Crie uma para começar!</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Account Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="Ex: Conta Principal"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                        >
                            <option value="CHECKING">Conta Corrente</option>
                            <option value="SAVINGS">Poupança</option>
                            <option value="CASH">Dinheiro</option>
                            <option value="OTHER">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.initial_balance}
                            onChange={(e) => setFormData({ ...formData, initial_balance: Number(e.target.value) })}
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
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingAccount ? 'Salvar Alterações' : 'Criar Conta')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!accountToDelete}
                onClose={() => setAccountToDelete(null)}
                title="Excluir Conta"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-red-50 text-red-700 rounded-xl">
                        <AlertTriangle size={24} className="shrink-0" />
                        <p className="text-sm">
                            Tem certeza que deseja excluir a conta <strong>{accountToDelete?.name}</strong>? Esta ação não pode ser desfeita.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setAccountToDelete(null)}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-medium"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
