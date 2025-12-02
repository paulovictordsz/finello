import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Trash2, Loader2, Filter, Pencil, CreditCard, Wallet } from 'lucide-react';
import { useTransactions, type Transaction } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useCards } from '../hooks/useCards';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CurrencyInput from '../components/CurrencyInput';
import DateInput from '../components/DateInput';
import Modal from '../components/Modal';

export default function Transactions() {
    const { user } = useAuth();
    const { transactions, isLoading, createTransaction, deleteTransaction, updateTransaction } = useTransactions();
    const { accounts } = useAccounts();
    const { categories } = useCategories();
    const { cards } = useCards();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const [transactionSource, setTransactionSource] = useState<'ACCOUNT' | 'CARD'>('ACCOUNT');

    const [formData, setFormData] = useState({
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        account_id: '',
        category_id: '',
        to_account_id: '', // For Transfer
        card_id: '',
        installments: '1',
    });

    const handleOpenModal = (transaction?: Transaction) => {
        if (transaction) {
            setEditingTransaction(transaction);
            const isCard = !!transaction.card_id;
            setTransactionSource(isCard ? 'CARD' : 'ACCOUNT');

            setFormData({
                type: transaction.type,
                amount: transaction.amount.toString(),
                date: transaction.date.split('T')[0],
                description: transaction.description || '',
                account_id: transaction.account_id || transaction.from_account_id || '',
                category_id: transaction.category_id || '',
                to_account_id: transaction.to_account_id || '',
                card_id: transaction.card_id || '',
                installments: transaction.total_installments?.toString() || '1',
            });
        } else {
            setEditingTransaction(null);
            setTransactionSource('ACCOUNT');
            setFormData({
                type: 'EXPENSE',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                account_id: '',
                category_id: '',
                to_account_id: '',
                card_id: '',
                installments: '1',
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

            if (transactionSource === 'CARD') {
                payload.card_id = formData.card_id;
                payload.account_id = null;
                payload.category_id = formData.category_id || null;
                payload.from_account_id = null;
                payload.to_account_id = null;
                // For card expenses, we usually default to EXPENSE type
                payload.type = 'EXPENSE';

                if (Number(formData.installments) > 1) {
                    // Logic for installments is handled by the backend or a specific service
                    // But here we are just creating a single transaction record or passing the info
                    // Based on previous implementation, we might need to handle this differently
                    // For now, passing the fields as expected by the updated schema/logic
                    payload.installments = Number(formData.installments); // This might need to be 'total_installments' based on schema
                    payload.total_installments = Number(formData.installments);
                    payload.installment_number = 1;
                }
            } else {
                // Account Transaction
                if (formData.type === 'TRANSFER') {
                    payload.from_account_id = formData.account_id || null;
                    payload.to_account_id = formData.to_account_id || null;
                    payload.account_id = null;
                    payload.category_id = null;
                    payload.card_id = null;
                } else {
                    payload.account_id = formData.account_id || null;
                    payload.category_id = formData.category_id || null;
                    payload.from_account_id = null;
                    payload.to_account_id = null;
                    payload.card_id = null;
                }
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
                card_id: '',
                installments: '1',
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
                                        {t.total_installments && t.total_installments > 1 && (
                                            <span className="text-xs text-gray-400 ml-2">
                                                ({t.installment_number}/{t.total_installments})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {format(new Date(t.date), "dd 'de' MMM, yyyy", { locale: ptBR })} • {t.account?.name || (t.card_id ? 'Cartão de Crédito' : 'Conta')}
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
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            >
                {/* Source Switch */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button
                        type="button"
                        onClick={() => setTransactionSource('ACCOUNT')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                            transactionSource === 'ACCOUNT'
                                ? "bg-white text-secondary shadow-sm"
                                : "text-gray-500 hover:text-secondary"
                        )}
                    >
                        <Wallet size={16} />
                        Conta
                    </button>
                    <button
                        type="button"
                        onClick={() => setTransactionSource('CARD')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                            transactionSource === 'CARD'
                                ? "bg-white text-secondary shadow-sm"
                                : "text-gray-500 hover:text-secondary"
                        )}
                    >
                        <CreditCard size={16} />
                        Cartão
                    </button>
                </div>

                {transactionSource === 'ACCOUNT' && (
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
                )}

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
                        <DateInput
                            value={formData.date}
                            onChange={(val) => setFormData({ ...formData, date: val })}
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
                    {transactionSource === 'ACCOUNT' && (
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
                    )}

                    {/* Card Selection */}
                    {transactionSource === 'CARD' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cartão</label>
                                <select
                                    value={formData.card_id}
                                    onChange={(e) => setFormData({ ...formData, card_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                    required
                                >
                                    <option value="">Selecione</option>
                                    {cards?.map((card) => (
                                        <option key={card.id} value={card.id}>{card.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                                <select
                                    value={formData.installments}
                                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                                        <option key={num} value={num}>{num}x</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Transfer Destination */}
                    {transactionSource === 'ACCOUNT' && formData.type === 'TRANSFER' && (
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
                    {(transactionSource === 'CARD' || (transactionSource === 'ACCOUNT' && formData.type !== 'TRANSFER')) && (
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
                                    ?.filter(c => c.type === (transactionSource === 'CARD' ? 'EXPENSE' : formData.type))
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
            </Modal>
        </div>
    );
}
