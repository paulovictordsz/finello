import { addMonths, startOfMonth, format, isBefore, isAfter, parseISO } from 'date-fns';
import type { Account } from '../hooks/useAccounts';
import type { Recurring } from '../hooks/useRecurrings';

export interface MonthlyForecast {
    month: string; // YYYY-MM
    label: string; // Oct 2025
    startingBalance: number;
    income: number;
    expense: number;
    endingBalance: number;
    isNegative: boolean;
}

export function calculateForecast(
    accounts: Account[],
    recurrings: Recurring[],
    monthsToProject: number = 12
): MonthlyForecast[] {
    const currentTotalBalance = accounts.reduce((sum, acc) => sum + acc.initial_balance, 0);

    let runningBalance = currentTotalBalance;
    const forecast: MonthlyForecast[] = [];
    const today = new Date();

    for (let i = 0; i < monthsToProject; i++) {
        const currentMonthDate = addMonths(today, i);
        const monthKey = format(currentMonthDate, 'yyyy-MM');
        const monthLabel = format(currentMonthDate, 'MMM yyyy');

        let monthlyIncome = 0;
        let monthlyExpense = 0;

        // Calculate recurring transactions for this month
        recurrings.forEach(rec => {
            const startDate = parseISO(rec.start_date);
            const endDate = rec.end_date ? parseISO(rec.end_date) : null;

            // Check if active in this month
            // Simplified logic: if start_date is before or in this month, and end_date is null or after this month
            // AND frequency matches (assuming MONTHLY for MVP simplicity for now, or checking day match)

            // For MVP, assuming all recurrings are MONTHLY and happen once per month if active
            if (isBefore(startOfMonth(startDate), addMonths(currentMonthDate, 1)) &&
                (!endDate || isAfter(endDate, startOfMonth(currentMonthDate)))) {

                if (rec.type === 'INCOME') {
                    monthlyIncome += rec.amount;
                } else {
                    monthlyExpense += rec.amount;
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
