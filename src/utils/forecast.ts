import { addMonths, startOfMonth, format, isBefore, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Account } from '../hooks/useAccounts';
import type { Recurring } from '../hooks/useRecurrings';

export interface MonthlyForecast {
    month: string; // YYYY-MM
    label: string; // Out 2025
    startingBalance: number;
    income: number;
    expense: number;
    endingBalance: number;
    isNegative: boolean;
}

export function calculateForecast(
    accounts: Account[],
    recurrings: Recurring[],
    transactions: any[] = [], // Using any for now to avoid circular dependency or complex type import if not needed
    monthsToProject: number = 12
): MonthlyForecast[] {
    const currentTotalBalance = accounts.reduce((sum, acc) => sum + acc.initial_balance, 0);

    let runningBalance = currentTotalBalance;
    const forecast: MonthlyForecast[] = [];
    const today = new Date();

    for (let i = 0; i < monthsToProject; i++) {
        const currentMonthDate = addMonths(today, i);
        const monthKey = format(currentMonthDate, 'yyyy-MM');
        const monthLabel = format(currentMonthDate, 'MMM yyyy', { locale: ptBR });

        let monthlyIncome = 0;
        let monthlyExpense = 0;

        // 1. Calculate recurring transactions for this month
        recurrings.forEach(rec => {
            const startDate = parseISO(rec.start_date);
            const endDate = rec.end_date ? parseISO(rec.end_date) : null;

            // Check if active in this month
            if (isBefore(startOfMonth(startDate), addMonths(currentMonthDate, 1)) &&
                (!endDate || isAfter(endDate, startOfMonth(currentMonthDate)))) {

                if (rec.type === 'INCOME') {
                    monthlyIncome += rec.amount;
                } else {
                    monthlyExpense += rec.amount;
                }
            }
        });

        // 2. Calculate scheduled transactions for this month
        // Filter transactions that happen in this month
        const monthStart = startOfMonth(currentMonthDate);
        const monthEnd = addMonths(monthStart, 1);

        transactions.forEach(t => {
            const tDate = parseISO(t.date);
            // Check if transaction is within the month [start, end)
            // isAfter is strict (>), isBefore is strict (<)
            // We want tDate >= monthStart && tDate < monthEnd
            // equivalent to: !isBefore(tDate, monthStart) && isBefore(tDate, monthEnd)
            if (!isBefore(tDate, monthStart) && isBefore(tDate, monthEnd)) {
                if (t.type === 'INCOME') {
                    monthlyIncome += t.amount;
                } else if (t.type === 'EXPENSE') {
                    monthlyExpense += t.amount;
                }
            }
        });

        const startingBalance = runningBalance;
        const endingBalance = startingBalance + monthlyIncome - monthlyExpense;

        forecast.push({
            month: monthKey,
            label: monthLabel,
            startingBalance,
            income: monthlyIncome,
            expense: monthlyExpense,
            endingBalance,
            isNegative: endingBalance < 0,
        });

        runningBalance = endingBalance;
    }

    return forecast;
}
