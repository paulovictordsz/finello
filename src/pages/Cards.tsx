import { useState } from 'react';
import { Plus, CreditCard, Trash2, Loader2, Calendar, Pencil, Receipt } from 'lucide-react';
import { useCards, type Card } from '../hooks/useCards';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import DateInput from '../components/DateInput';
import { addMonths } from 'date-fns';
import Modal from '../components/Modal';

export default function Cards() {
    const { user } = useAuth();
    const { cards, isLoading, createCard, deleteCard, updateCard } = useCards();
    const { createTransaction } = useTransactions();
    const { categories } = useCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [selectedCardForExpense, setSelectedCardForExpense] = useState<Card | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        limit_amount: '',
        closing_day: '',
        due_day: '',
    });

    const [expenseFormData, setExpenseFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category_id: '',
        installments: '1',
    });

    const handleOpenModal = (card?: Card) => {
        if (card) {
            setEditingCard(card);
            setFormData({
                name: card.name,
                limit_amount: card.limit_amount.toString(),
                closing_day: card.closing_day.toString(),
                due_day: card.due_day.toString(),
            });
        } else {
            setEditingCard(null);
            setFormData({ name: '', limit_amount: '', closing_day: '', due_day: '' });
        }
        setIsModalOpen(true);
    };

    const handleOpenExpenseModal = (card: Card) => {
        setSelectedCardForExpense(card);
        setExpenseFormData({
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            category_id: '',
            installments: '1',
        });
        setIsExpenseModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            const payload = {
                name: formData.name,
                limit_amount: Number(formData.limit_amount),
                closing_day: Number(formData.closing_day),
                due_day: Number(formData.due_day),
            };

            if (editingCard) {
                await updateCard(editingCard.id, payload);
            } else {
                await createCard({
                    ...payload,
                    user_id: user.id,
                });
            }

            setIsModalOpen(false);
            setEditingCard(null);
            setFormData({ name: '', limit_amount: '', closing_day: '', due_day: '' });
        } catch (error) {
            console.error('Failed to save card:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedCardForExpense) return;

        setIsSubmitting(true);

        try {
            const installments = parseInt(expenseFormData.installments);
            const amount = Number(expenseFormData.amount);
            // This treats date as UTC if string is YYYY-MM-DD, careful. 
            // Better to use split and construct local date or just use the string if backend expects YYYY-MM-DD.
            // But addMonths needs a Date object.
            // Let's fix timezone issue by creating date from parts.
            const [y, m, d] = expenseFormData.date.split('-').map(Number);
            const localBaseDate = new Date(y, m - 1, d);

            const promises = [];

            for (let i = 0; i < installments; i++) {
                const date = addMonths(localBaseDate, i);
                const description = installments > 1
                    ? `${expenseFormData.description} (${i + 1}/${installments})`
                    : expenseFormData.description;

                const payload = {
                    user_id: user.id,
                    type: 'EXPENSE',
                    amount: amount / installments,
                    date: date.toISOString().split('T')[0],
                    description: description,
                    category_id: expenseFormData.category_id || null,
                    card_id: selectedCardForExpense.id,
                    installment_number: i + 1,
                    total_installments: installments,
                    account_id: null,
                };
                promises.push(createTransaction(payload));
            }

            await Promise.all(promises);

            setIsExpenseModalOpen(false);
            setSelectedCardForExpense(null);
        } catch (error) {
            console.error('Failed to save expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cartão?')) {
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
                    <h1 className="text-2xl font-bold text-secondary">Cartões de Crédito</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie seus cartões e limites</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                    <Plus size={20} />
                    Novo Cartão
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards?.map((card) => (
                    <div key={card.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                                <CreditCard size={24} />
                            </div>
                            <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(card)}
                                    className="text-gray-400 hover:text-primary"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(card.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-secondary mb-1">{card.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">Limite: {formatCurrency(card.limit_amount)}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span>Fecha: dia {card.closing_day}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span>Vence: dia {card.due_day}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleOpenExpenseModal(card)}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-purple-100 text-purple-600 hover:bg-purple-50 transition-colors font-medium text-sm"
                        >
                            <Receipt size={16} />
                            Lançar Gasto
                        </button>
                    </div>
                ))}

                {cards?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                        <CreditCard size={48} className="mb-4 opacity-50" />
                        <p>Nenhum cartão encontrado.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Card Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cartão</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="Ex: Nubank"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
                        <CurrencyInput
                            value={formData.limit_amount}
                            onChange={(val) => setFormData({ ...formData, limit_amount: val.toString() })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dia Fechamento</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
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
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingCard ? 'Salvar Alterações' : 'Salvar Cartão')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Launch Expense Modal */}
            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Lançar Gasto"
            >
                {selectedCardForExpense && (
                    <div className="mb-4 -mt-4">
                        <p className="text-sm text-gray-500">{selectedCardForExpense.name}</p>
                    </div>
                )}
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                        <CurrencyInput
                            value={expenseFormData.amount}
                            onChange={(val) => setExpenseFormData({ ...expenseFormData, amount: val.toString() })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-lg font-bold"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data da Compra</label>
                        <DateInput
                            value={expenseFormData.date}
                            onChange={(val) => setExpenseFormData({ ...expenseFormData, date: val })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input
                            type="text"
                            value={expenseFormData.description}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="Ex: Compras Supermercado"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select
                                value={expenseFormData.category_id}
                                onChange={(e) => setExpenseFormData({ ...expenseFormData, category_id: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                required
                            >
                                <option value="">Selecione</option>
                                {categories
                                    ?.filter(c => c.type === 'EXPENSE')
                                    .map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                            <select
                                value={expenseFormData.installments}
                                onChange={(e) => setExpenseFormData({ ...expenseFormData, installments: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                            >
                                {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}x</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsExpenseModalOpen(false)}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Lançar Gasto'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
