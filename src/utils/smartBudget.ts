import { getDaysInMonth, getDate, endOfMonth, differenceInCalendarDays } from 'date-fns';

interface SmartBudgetResult {
    dailyLimit: number;
    spentToday: number;
    remainingForToday: number;
    status: 'EXCEEDED' | 'WARNING' | 'SAFE' | 'SAVING';
    message: string;
    monthProgress: number; // 0-100
    budgetProgress: number; // 0-100
}

export function calculateSmartBudget(
    monthlyBudget: number,
    totalMonthlyExpenses: number,
    expensesToday: number,
    currentDate: Date = new Date()
): SmartBudgetResult {
    const daysInMonth = getDaysInMonth(currentDate);
    const currentDay = getDate(currentDate);
    const daysRemaining = differenceInCalendarDays(endOfMonth(currentDate), currentDate) + 1; // Include today

    // Calculate how much budget is left for the rest of the month (including today)
    // We subtract expenses from previous days (Total - Today) to get what's left for [Today...End]
    const expensesPriorToToday = totalMonthlyExpenses - expensesToday;
    const remainingBudget = monthlyBudget - expensesPriorToToday;

    // If already over budget
    if (remainingBudget <= 0) {
        return {
            dailyLimit: 0,
            spentToday: expensesToday,
            remainingForToday: -expensesToday,
            status: 'EXCEEDED',
            message: 'Você já excedeu seu orçamento mensal. Evite novos gastos.',
            monthProgress: (currentDay / daysInMonth) * 100,
            budgetProgress: 100
        };
    }

    // Smart Daily Limit: Distribute remaining budget evenly across remaining days
    const dailyLimit = remainingBudget / daysRemaining;
    const remainingForToday = dailyLimit - expensesToday;

    let status: SmartBudgetResult['status'] = 'SAFE';
    let message = 'Você está dentro da meta.';

    if (remainingForToday < 0) {
        status = 'WARNING';
        message = 'Você gastou mais do que o recomendado para hoje. O limite dos próximos dias será reduzido.';
    } else if (remainingForToday > dailyLimit * 0.5) {
        status = 'SAVING';
        message = 'Ótimo! Você está economizando hoje. Isso aumentará seu limite futuro.';
    }

    return {
        dailyLimit,
        spentToday: expensesToday,
        remainingForToday,
        status,
        message,
        monthProgress: (currentDay / daysInMonth) * 100,
        budgetProgress: (totalMonthlyExpenses / monthlyBudget) * 100
    };
}
