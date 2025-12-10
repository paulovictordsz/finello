import { Bell, Search, TrendingUp, TrendingDown, Wallet, AlertCircle, PiggyBank, ThumbsUp } from 'lucide-react';
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

const Dashboard = () => {
    const { user } = useAuth();
    const { totalBalance, monthlyIncome, monthlyExpense, recentTransactions, isLoading } = useDashboardData();
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

        const todayStr = new Date().toISOString().split('T')[0];
        const expensesToday = recentTransactions
            .filter(t => t.type === 'EXPENSE' && t.date === todayStr)
            .reduce((sum, t) => sum + t.amount, 0);

        return calculateSmartBudget(budget.amount, monthlyExpense, expensesToday);
    }, [budget, monthlyExpense, recentTransactions]);

    if (isLoading || isLoadingBudget) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">
                        Bom dia, {user?.user_metadata.full_name?.split(' ')[0] || 'Usuário'}! 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Aqui está o resumo das suas finanças hoje.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white w-full md:w-64"
                        />
                    </div>
                    <button className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {user?.user_metadata.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                    </div>
                </div>
            </header>

            {/* Smart Budget Widget */}
            {smartBudget && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-medium opacity-90 mb-1">Meta Diária Inteligente</h2>
                                <p className="text-sm opacity-75">{smartBudget.message}</p>
                            </div>
                            <div className={clsx(
                                "p-2 rounded-lg bg-white/20 backdrop-blur-sm",
                                smartBudget.status === 'SAFE' && "text-white",
                                smartBudget.status === 'WARNING' && "text-yellow-200",
                                smartBudget.status === 'SAVING' && "text-green-200",
                                smartBudget.status === 'EXCEEDED' && "text-red-200",
                            )}>
                                {smartBudget.status === 'SAFE' && <ThumbsUp size={24} />}
                                {smartBudget.status === 'WARNING' && <AlertCircle size={24} />}
                                {smartBudget.status === 'SAVING' && <PiggyBank size={24} />}
                                {smartBudget.status === 'EXCEEDED' && <AlertCircle size={24} />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm opacity-75 mb-1">Pode gastar hoje</p>
                                <p className="text-3xl font-bold">{formatCurrency(Math.max(0, smartBudget.remainingForToday))}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm opacity-75 mb-1">Gasto hoje</p>
                                <p className="text-2xl font-semibold">{formatCurrency(smartBudget.spentToday)}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between text-xs opacity-75 mb-2">
                                <span>Progresso do Mês ({Math.round(smartBudget.monthProgress)}%)</span>
                                <span>Orçamento Usado ({Math.round(smartBudget.budgetProgress)}%)</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-white/50"
                                    style={{ width: `${smartBudget.monthProgress}%` }}
                                    title="Progresso do Mês"
                                ></div>
                                <div
                                    className={clsx(
                                        "h-full transition-all duration-500",
                                        smartBudget.budgetProgress > 100 ? "bg-red-400" : "bg-white"
                                    )}
                                    style={{ width: `${smartBudget.budgetProgress}%`, marginLeft: `-${smartBudget.monthProgress}%` }}
                                    title="Orçamento Usado"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary text-white p-6 rounded-2xl shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-3 mb-4 opacity-80">
                        <Wallet size={20} />
                        <span className="font-medium">Saldo Total</span>
                    </div>
                    <h2 className="text-3xl font-bold">{formatCurrency(totalBalance)}</h2>
                    <p className="text-sm mt-2 opacity-80">Em todas as contas</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4 text-green-500">
                        <TrendingUp size={20} />
                        <span className="font-medium">Receita Mensal</span>
                    </div>
                    <h2 className="text-3xl font-bold text-secondary">{formatCurrency(monthlyIncome)}</h2>
                    <p className="text-sm text-gray-400 mt-2">Este mês</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <TrendingDown size={20} />
                        <span className="font-medium">Despesa Mensal</span>
                    </div>
                    <h2 className="text-3xl font-bold text-secondary">{formatCurrency(monthlyExpense)}</h2>
                    <p className="text-sm text-gray-400 mt-2">Este mês</p>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-secondary mb-6">Transações Recentes</h3>
                <div className="space-y-4">
                    {recentTransactions.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Nenhuma transação encontrada.</p>
                    ) : (
                        recentTransactions.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' :
                                        t.type === 'EXPENSE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {t.type === 'INCOME' ? <TrendingUp size={18} /> :
                                            t.type === 'EXPENSE' ? <TrendingDown size={18} /> : <Wallet size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-secondary">{t.description}</p>
                                        <p className="text-sm text-gray-400">
                                            {format(new Date(t.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' :
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
