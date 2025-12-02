import { useState, useMemo } from 'react';
import { Plus, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccounts } from '../hooks/useAccounts';
import { useRecurrings } from '../hooks/useRecurrings';
import { useCategories } from '../hooks/useCategories';
import { calculateForecast } from '../utils/forecast';
import { formatCurrency } from '../utils/format';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export default function Forecast() {
    const { user } = useAuth();
    const { accounts, isLoading: isLoadingAccounts } = useAccounts();
    const { recurrings, isLoading: isLoadingRecurrings, createRecurring } = useRecurrings();
    const { categories } = useCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        amount: '',
        frequency: 'MONTHLY' as const,
        start_date: new Date().toISOString().split('T')[0],
        description: '',
        category_id: '',
    });

    const forecast = useMemo(() => {
        if (!accounts || !recurrings) return [];
        return calculateForecast(accounts, recurrings);
    }, [accounts, recurrings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createRecurring({
                user_id: user?.id,
                ...formData,
                amount: Number(formData.amount),
            });
            setIsModalOpen(false);
            setFormData({
                type: 'EXPENSE',
                amount: '',
                frequency: 'MONTHLY',
                start_date: new Date().toISOString().split('T')[0],
                description: '',
                category_id: '',
            });
        } catch (error) {
            console.error('Failed to create recurring:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingAccounts || isLoadingRecurrings) {
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
                    <h1 className="text-2xl font-bold text-secondary">Previsão Financeira</h1>
                    <p className="text-gray-500 text-sm mt-1">Projete seu saldo para os próximos 12 meses</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                    <Plus size={20} />
                    Adicionar Item Recorrente
                </button>
            </header>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
                <h3 className="font-bold text-secondary mb-6">Projeção de Saldo</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#639C92" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#639C92" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(value) => `R$ ${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                        />
                        <Area
                            type="monotone"
                            dataKey="endingBalance"
                            stroke="#639C92"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Forecast Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                    <h3 className="font-bold text-secondary">Detalhamento Mensal</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mês</th>
                                <th className="px-6 py-3 font-medium">Inicial</th>
                                <th className="px-6 py-3 font-medium text-green-600">Receita</th>
                                <th className="px-6 py-3 font-medium text-red-600">Despesa</th>
                                <th className="px-6 py-3 font-medium">Saldo Final</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {forecast.map((month) => (
                                <tr key={month.month} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-secondary">{month.label}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatCurrency(month.startingBalance)}</td>
                                    <td className="px-6 py-4 text-green-600">+{formatCurrency(month.income)}</td>
                                    <td className="px-6 py-4 text-red-600">-{formatCurrency(month.expense)}</td>
                                    <td className={clsx(
                                        "px-6 py-4 font-bold",
                                        month.isNegative ? "text-red-500" : "text-secondary"
                                    )}>
                                        {formatCurrency(month.endingBalance)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {month.isNegative ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-600 text-xs font-medium">
                                                <AlertTriangle size={12} /> Crítico
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-600 text-xs font-medium">
                                                <TrendingUp size={12} /> Saudável
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Recurring Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-secondary mb-4">Adicionar Item Recorrente</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
                                {['EXPENSE', 'INCOME'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type as any })}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                            formData.type === type
                                                ? "bg-white text-secondary shadow-sm"
                                                : "text-gray-500 hover:text-secondary"
                                        )}
                                    >
                                        {type === 'EXPENSE' ? 'Despesa' : 'Receita'}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Ex: Aluguel, Salário"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

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
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
