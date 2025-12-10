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
    cardRisk: boolean; // New: Risk alert if card expenses > X% of income
}

export function calculateForecast(
    accounts: Account[],
    recurrings: Recurring[],
    transactions: any[] = [],
    simulatedItems: any[] = [], // New: Simulated items (recurrings or one-time)
    monthsToProject: number = 12
): MonthlyForecast[] {
    const currentTotalBalance = accounts.reduce((sum, acc) => sum + acc.initial_balance, 0);

    let runningBalance = currentTotalBalance;
    const forecast: MonthlyForecast[] = [];
    const today = new Date();

    // Combine real recurrings with simulated recurrings
    const allRecurrings = [...recurrings, ...simulatedItems.filter(i => i.frequency)];
    // Simulated one-time transactions could be handled too if we had a structure for them
    // For now assuming simulated items are recurrings or simple one-time adjustments treated as transactions
    const simulatedTransactions = simulatedItems.filter(i => !i.frequency);

    for (let i = 0; i < monthsToProject; i++) {
        const currentMonthDate = addMonths(today, i);
        const monthKey = format(currentMonthDate, 'yyyy-MM');
        const monthLabel = format(currentMonthDate, 'MMM yyyy', { locale: ptBR });

        let monthlyIncome = 0;
        let monthlyExpense = 0;
        let monthlyCardExpense = 0; // Track card expenses for risk calculation

        // 1. Calculate recurring transactions for this month
        allRecurrings.forEach(rec => {
            const startDate = parseISO(rec.start_date);
            const endDate = rec.end_date ? parseISO(rec.end_date) : null;

            // Check if active in this month
            if (isBefore(startOfMonth(startDate), addMonths(currentMonthDate, 1)) &&
                (!endDate || isAfter(endDate, startOfMonth(currentMonthDate)))) {

                if (rec.type === 'INCOME') {
                    monthlyIncome += rec.amount;
                } else {
                    monthlyExpense += rec.amount;
                    // If we had a way to know if a recurring is a card expense, we'd add to monthlyCardExpense
                    // For now, let's assume recurrings are usually fixed bills or subscriptions, 
                    // unless explicitly marked (which we don't have).
                }
            }
        });

        // 2. Calculate scheduled transactions for this month
        const monthStart = startOfMonth(currentMonthDate);
        const monthEnd = addMonths(monthStart, 1);

        [...transactions, ...simulatedTransactions].forEach(t => {
            const tDate = parseISO(t.date);
            if (!isBefore(tDate, monthStart) && isBefore(tDate, monthEnd)) {
                if (t.type === 'INCOME') {
                    monthlyIncome += t.amount;
                } else if (t.type === 'EXPENSE') {
                    monthlyExpense += t.amount;
                    if (t.card_id) {
                        monthlyCardExpense += t.amount;
                    }
                }
            }
        });

        const startingBalance = runningBalance;
        const endingBalance = startingBalance + monthlyIncome - monthlyExpense;

        // Risk Alert Logic: Card Invoice > 40% of Income
        // Note: monthlyIncome might be 0 if user has no income registered, avoiding division by zero
        const cardRisk = monthlyIncome > 0 && (monthlyCardExpense / monthlyIncome) > 0.4;

        forecast.push({
            month: monthKey,
            label: monthLabel,
            startingBalance,
            income: monthlyIncome,
            expense: monthlyExpense,
            endingBalance,
            isNegative: endingBalance < 0,
            cardRisk,
        });

        runningBalance = endingBalance;
    }

    return forecast;
}
