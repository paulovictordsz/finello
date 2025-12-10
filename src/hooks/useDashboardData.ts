import { useMemo } from 'react';
import { useAccounts } from './useAccounts';
import { useTransactions } from './useTransactions';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function useDashboardData() {
    const { accounts, isLoading: isLoadingAccounts } = useAccounts();
    const { transactions, isLoading: isLoadingTransactions } = useTransactions();

    const dashboardData = useMemo(() => {
        if (!accounts || !transactions) {
            return {
                totalBalance: 0,
                monthlyIncome: 0,
                monthlyExpense: 0,
                recentTransactions: [],
                expensesToday: 0,
            };
        }

        // 1. Total Balance (Sum of all accounts)
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.initial_balance, 0);

        // 2. Monthly Income & Expense
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        let monthlyIncome = 0;
        let monthlyExpense = 0;

        transactions.forEach((t) => {
            const date = parseISO(t.date);
            if (isWithinInterval(date, { start: monthStart, end: monthEnd })) {
                if (t.type === 'INCOME') {
                    monthlyIncome += t.amount;
                } else if (t.type === 'EXPENSE') {
                    monthlyExpense += t.amount;
                }
            }
        });

        // 3. Recent Transactions (Limit 5)
        const recentTransactions = transactions.slice(0, 5);

        // 4. Expenses Today
        const todayStr = new Date().toISOString().split('T')[0];
        const expensesToday = transactions
            .filter(t => t.type === 'EXPENSE' && t.date === todayStr)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalBalance,
            monthlyIncome,
            monthlyExpense,
            recentTransactions,
            expensesToday,
        };
    }, [accounts, transactions]);

    return {
        ...dashboardData,
        isLoading: isLoadingAccounts || isLoadingTransactions,
    };
}
