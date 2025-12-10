import { useState, useMemo } from 'react';
import { Plus, CreditCard, Trash2, Loader2, Calendar, Pencil, Receipt, FileText, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCards, type Card } from '../hooks/useCards';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import DateInput from '../components/DateInput';
import { addMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Modal from '../components/Modal';
import { calculateInvoices } from '../utils/invoice';
import { clsx } from 'clsx';

export default function Cards() {
    const { user } = useAuth();
    const { cards, isLoading, createCard, deleteCard, updateCard } = useCards();
    const { transactions, createTransaction, isLoading: isLoadingTransactions } = useTransactions();
    const { categories } = useCategories();
    const { accounts } = useAccounts();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [selectedCardForExpense, setSelectedCardForExpense] = useState<Card | null>(null);
    const [selectedCardForInvoice, setSelectedCardForInvoice] = useState<Card | null>(null);
    const [selectedInvoiceIndex, setSelectedInvoiceIndex] = useState(0); // 0 = Current, -1 = Previous, 1 = Next, etc.
    const [selectedAccountForPayment, setSelectedAccountForPayment] = useState('');

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

    // Calculate Invoices for selected card
    const cardInvoices = useMemo(() => {
        if (!selectedCardForInvoice || !transactions) return [];
        return calculateInvoices(selectedCardForInvoice, transactions);
    }, [selectedCardForInvoice, transactions]);

    const currentInvoice = useMemo(() => {
        if (cardInvoices.length === 0) return null;
        // Find the invoice that is "OPEN" or the first one if all closed/future
        // Actually calculateInvoices returns a list. Let's sort by date.
        const sorted = [...cardInvoices].sort((a, b) => a.month.localeCompare(b.month));

        // We want to default to the "current" month invoice (OPEN)
        const openIndex = sorted.findIndex(inv => inv.status === 'OPEN');
        if (openIndex !== -1) return { invoice: sorted[openIndex], index: openIndex };

        // If no OPEN, maybe the last CLOSED?
        return { invoice: sorted[sorted.length - 1], index: sorted.length - 1 };
    }, [cardInvoices]);

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

    const handleOpenInvoiceModal = (card: Card) => {
        setSelectedCardForInvoice(card);
        // Reset index will be handled by useEffect or memo if needed, 
        // but here we want to set the index to the current invoice index
        // We can't do it here easily because cardInvoices depends on state update.
        // We'll let the useEffect below handle setting the initial index.
        setIsInvoiceModalOpen(true);
    };

    // Effect to set initial selected invoice index when opening modal
    useMemo(() => {
        if (isInvoiceModalOpen && currentInvoice) {
            setSelectedInvoiceIndex(currentInvoice.index);
        }
    }, [isInvoiceModalOpen, currentInvoice?.index]); // Only run when modal opens or current invoice changes

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

    const handlePayInvoice = async () => {
        if (!user || !selectedCardForInvoice || !selectedAccountForPayment) return;

        const invoice = cardInvoices[selectedInvoiceIndex];
        if (!invoice) return;

        setIsSubmitting(true);
        try {
            // Create a transaction to pay the invoice
            await createTransaction({
                user_id: user.id,
                type: 'EXPENSE',
                amount: invoice.amount,
                date: new Date().toISOString().split('T')[0],
                description: `Pagamento Fatura ${invoice.label} - ${selectedCardForInvoice.name}`,
                account_id: selectedAccountForPayment,
                category_id: null, // Or a specific category for "Credit Card Payment"
                card_id: null, // It's an expense from the account, not ON the card
            });

            // Ideally we would mark invoice as paid in DB, but for MVP we just record the expense.
            // We could add a "Payment" transaction type or link it, but let's keep it simple.

            setIsPayInvoiceModalOpen(false);
            setIsInvoiceModalOpen(false);
            setSelectedAccountForPayment('');
        } catch (error) {
            console.error('Failed to pay invoice:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cartão?')) {
            await deleteCard(id);
        }
    };

    if (isLoading || isLoadingTransactions) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const selectedInvoice = cardInvoices[selectedInvoiceIndex];

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

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleOpenExpenseModal(card)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-purple-100 text-purple-600 hover:bg-purple-50 transition-colors font-medium text-sm"
                            >
                                <Receipt size={16} />
                                Lançar Gasto
                            </button>
                            <button
                                onClick={() => handleOpenInvoiceModal(card)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-medium text-sm"
                            >
                                <FileText size={16} />
                                Ver Faturas
                            </button>
                        </div>
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

            {/* Invoice Modal */}
            <Modal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                title={`Faturas - ${selectedCardForInvoice?.name}`}
            >
                {selectedInvoice ? (
                    <div className="space-y-6">
                        {/* Invoice Navigation */}
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                            <button
                                onClick={() => setSelectedInvoiceIndex(prev => Math.max(0, prev - 1))}
                                disabled={selectedInvoiceIndex === 0}
                                className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-center">
                                <p className="font-bold text-secondary">{selectedInvoice.label}</p>
                                <p className={clsx(
                                    "text-xs font-medium",
                                    selectedInvoice.status === 'OPEN' && "text-blue-600",
                                    selectedInvoice.status === 'CLOSED' && "text-red-600",
                                    selectedInvoice.status === 'PAID' && "text-green-600",
                                    selectedInvoice.status === 'FUTURE' && "text-gray-500",
                                )}>
                                    {selectedInvoice.status === 'OPEN' && 'Aberta'}
                                    {selectedInvoice.status === 'CLOSED' && 'Fechada'}
                                    {selectedInvoice.status === 'PAID' && 'Paga'}
                                    {selectedInvoice.status === 'FUTURE' && 'Futura'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoiceIndex(prev => Math.min(cardInvoices.length - 1, prev + 1))}
                                disabled={selectedInvoiceIndex === cardInvoices.length - 1}
                                className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Invoice Summary */}
                        <div className="text-center py-4">
                            <p className="text-gray-500 text-sm mb-1">Valor Total</p>
                            <p className="text-3xl font-bold text-secondary">{formatCurrency(selectedInvoice.amount)}</p>
                            <p className="text-sm text-gray-400 mt-2">
                                Vence em {format(parseISO(selectedInvoice.dueDate), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                        </div>

                        {/* Pay Button */}
                        {selectedInvoice.amount > 0 && selectedInvoice.status !== 'PAID' && (
                            <button
                                onClick={() => setIsPayInvoiceModalOpen(true)}
                                className="w-full py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={20} />
                                Pagar Fatura
                            </button>
                        )}

                        {/* Transactions List */}
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Transações</h4>
                            {selectedInvoice.transactions.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">Nenhuma transação nesta fatura.</p>
                            ) : (
                                selectedInvoice.transactions.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-secondary text-sm">
                                                {t.description}
                                                {t.total_installments && t.total_installments > 1 && (
                                                    <span className="text-xs text-gray-400 ml-1">
                                                        ({t.installment_number}/{t.total_installments})
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {format(parseISO(t.date), "dd/MM")} • {t.category?.name || 'Sem categoria'}
                                            </p>
                                        </div>
                                        <span className="font-bold text-secondary text-sm">
                                            {formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        Nenhuma fatura encontrada.
                    </div>
                )}
            </Modal>

            {/* Pay Invoice Confirmation Modal */}
            <Modal
                isOpen={isPayInvoiceModalOpen}
                onClose={() => setIsPayInvoiceModalOpen(false)}
                title="Pagar Fatura"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Selecione a conta para debitar o valor de <strong>{selectedInvoice && formatCurrency(selectedInvoice.amount)}</strong>.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conta de Pagamento</label>
                        <select
                            value={selectedAccountForPayment}
                            onChange={(e) => setSelectedAccountForPayment(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                        >
                            <option value="">Selecione a Conta</option>
                            {accounts?.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.initial_balance)})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsPayInvoiceModalOpen(false)}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handlePayInvoice}
                            disabled={!selectedAccountForPayment || isSubmitting}
                            className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Pagamento'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
