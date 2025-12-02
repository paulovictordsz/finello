import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Trash2, Loader2, Filter, Pencil } from 'lucide-react';
import { useTransactions, type Transaction } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CurrencyInput from '../components/CurrencyInput';

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
        if (!user) return;

        setIsSubmitting(true);

        try {
            const payload: any = {
                user_id: user.id,
                type: formData.type,
                amount: Number(formData.amount),
                date: formData.date,
                description: formData.description,
            };

            if (formData.type === 'TRANSFER') {
                payload.from_account_id = formData.account_id || null;
                payload.to_account_id = formData.to_account_id || null;
                payload.account_id = null;
                payload.category_id = null;
            } else {
                payload.account_id = formData.account_id || null;
                payload.category_id = formData.category_id || null;
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
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
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
                    <h1 className="text-2xl font-bold text-secondary">Transações</h1>
                    <p className="text-gray-500 text-sm mt-1">Acompanhe suas receitas e despesas</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                    <Plus size={20} />
                    Nova Transação
                </button>
            </header>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-secondary">Atividade Recente</h3>
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
                                        {t.description || t.category?.name || 'Transferência'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {format(new Date(t.date), "dd 'de' MMM, yyyy", { locale: ptBR })} • {t.account?.name}
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
                                <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                            Nenhuma transação encontrada.
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-secondary mb-4">
                            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                        </h2>

                        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                            {[
                                { id: 'EXPENSE', label: 'Despesa' },
                                { id: 'INCOME', label: 'Receita' },
                                { id: 'TRANSFER', label: 'Transferência' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setFormData({ ...formData, type: type.id as any })}
                                    className={clsx(
                                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                        formData.type === type.id
                                            ? "bg-white text-secondary shadow-sm"
                                            : "text-gray-500 hover:text-secondary"
                                    )}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                                <CurrencyInput
                                    value={formData.amount}
                                    onChange={(val) => setFormData({ ...formData, amount: val.toString() })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-lg font-bold"
                                    placeholder="R$ 0,00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Ex: Compras no mercado"
                                />
                            </div>

                            {/* Account Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'TRANSFER' ? 'Conta de Origem' : 'Conta'}
                                </label>
                                <select
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                    required
                                >
                                    <option value="">Selecione a Conta</option>
                                    {accounts?.map((acc) => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Transfer Destination */}
                            {formData.type === 'TRANSFER' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Conta de Destino</label>
                                    <select
                                        value={formData.to_account_id}
                                        onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                        required
                                    >
                                        <option value="">Selecione o Destino</option>
                                        {accounts?.filter(a => a.id !== formData.account_id).map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Category Selection (Not for Transfer) */}
                            {formData.type !== 'TRANSFER' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                        required
                                    >
                                        <option value="">Selecione a Categoria</option>
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
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingTransaction ? 'Salvar Alterações' : 'Salvar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
