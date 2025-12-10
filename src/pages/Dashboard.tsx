import { Bell, Search, TrendingUp, TrendingDown, Wallet, AlertCircle, ThumbsUp, ArrowUpRight } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useBudgets } from '../hooks/useBudgets';
import { calculateSmartBudget } from '../utils/smartBudget';
import { formatCurrency } from '../utils/format';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';
import { clsx } from 'clsx';
import { Tooltip } from '../components/Tooltip';

const Dashboard = () => {
    const { user } = useAuth();
    const { totalBalance, monthlyIncome, monthlyExpense, recentTransactions, expensesToday, isLoading } = useDashboardData();
    const { budget, isLoading: isLoadingBudget } = useBudgets();

    const smartBudget = useMemo(() => {
        if (!budget) return null;
        // We need expenses for TODAY. 
        // For MVP, let's assume monthlyExpense is total expenses for the month, 
        // and we don't have exact "today" expenses easily available without filtering transactions again.
        // Let's filter recentTransactions for today? Or better, useTransactions if available.
        // Since useDashboardData doesn't give us ALL transactions, this is an approximation.
        // Ideally we should fetch today's expenses specifically.
        // For now, let's assume 0 for "today" expenses to calculate the limit, 
        // or just use the monthly data to show "Remaining for Today" based on average?
        // Wait, calculateSmartBudget needs "expensesToday".
        // Let's assume 0 for now to show the POTENTIAL limit, or try to filter from recentTransactions if they are from today.

        return calculateSmartBudget(budget.amount, monthlyExpense, expensesToday);
    }, [budget, monthlyExpense, expensesToday]);

    if (isLoading || isLoadingBudget) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-secondary">
                        Dashboard
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">Visão geral das suas finanças</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white w-full md:w-64 text-sm"
                        />
                    </div>
                    <button className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 relative">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                        {user?.user_metadata.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                    </div>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Balance */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Saldo Total</span>
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-secondary">{formatCurrency(totalBalance)}</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                <ArrowUpRight size={12} /> +2.5%
                            </span>
                            <span className="text-xs text-gray-400">vs mês anterior</span>
                        </div>
                    </div>
                </div>

                {/* Smart Daily Limit */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative">
                    {smartBudget ? (
                        <>
                            <div className="flex items-center justify-between mb-2 relative z-10">
                                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Meta Diária</span>
                                <div className={clsx(
                                    "p-1.5 rounded-lg",
                                    smartBudget.status === 'SAFE' ? "bg-green-50 text-green-600" :
                                        smartBudget.status === 'WARNING' ? "bg-yellow-50 text-yellow-600" :
                                            "bg-red-50 text-red-600"
                                )}>
                                    {smartBudget.status === 'SAFE' ? <ThumbsUp size={16} /> : <AlertCircle size={16} />}
                                </div>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-2xl font-bold text-secondary">
                                        {formatCurrency(Math.max(0, smartBudget.remainingForToday))}
                                    </h2>
                                    <span className="text-xs text-gray-400">disponível hoje</span>
                                </div>
                                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={clsx(
                                            "h-full rounded-full transition-all duration-500",
                                            smartBudget.status === 'SAFE' ? "bg-green-500" :
                                                smartBudget.status === 'WARNING' ? "bg-yellow-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${Math.min(100, (smartBudget.spentToday / smartBudget.dailyLimit) * 100)}%` }}
                                    ></div>
                                </div>
                                <Tooltip content={smartBudget.message} className="w-full">
                                    <p className="text-xs text-gray-400 mt-1.5 truncate cursor-help">{smartBudget.message}</p>
                                </Tooltip>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <p className="text-sm text-gray-500">Defina uma meta mensal</p>
                            <a href="/settings" className="text-xs text-primary font-medium mt-1 hover:underline">Configurar</a>
                        </div>
                    )}
                </div>

                {/* Monthly Income */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Receitas</span>
                        <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-secondary">{formatCurrency(monthlyIncome)}</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-400">Entradas este mês</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Expense */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Despesas</span>
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                            <TrendingDown size={16} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-secondary">{formatCurrency(monthlyExpense)}</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-400">Saídas este mês</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-secondary text-sm">Transações Recentes</h3>
                    <button className="text-xs text-primary font-medium hover:underline">Ver todas</button>
                </div>
                <div className="divide-y divide-gray-50">
                    {recentTransactions.length === 0 ? (
                        <p className="text-gray-400 text-center py-8 text-sm">Nenhuma transação encontrada.</p>
                    ) : (
                        recentTransactions.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${t.type === 'INCOME' ? 'bg-green-50 text-green-600' :
                                        t.type === 'EXPENSE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {t.type === 'INCOME' ? <TrendingUp size={14} /> :
                                            t.type === 'EXPENSE' ? <TrendingDown size={14} /> : <Wallet size={14} />}
                                    </div>
                                    <div>
                                        <Tooltip content={t.description || ''}>
                                            <p className="font-medium text-secondary text-sm truncate max-w-[150px] md:max-w-xs cursor-help">{t.description}</p>
                                        </Tooltip>
                                        <p className="text-xs text-gray-400">
                                            {format(new Date(t.date), "dd 'de' MMM", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-green-600' :
                                    t.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                    {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
