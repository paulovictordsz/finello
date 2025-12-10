import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export interface Budget {
    id: string;
    user_id: string;
    amount: number;
    month_year: string;
}

export function useBudgets() {
    const { user } = useAuth();
    const [budget, setBudget] = useState<Budget | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentMonthYear = format(new Date(), 'yyyy-MM');

    const fetchBudget = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', user.id)
                .eq('month_year', currentMonthYear)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.error('Error fetching budget:', error);
            }

            setBudget(data);
        } catch (error) {
            console.error('Error fetching budget:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentMonthYear]);

    const updateBudget = async (amount: number) => {
        if (!user) return;
        try {
            const payload = {
                user_id: user.id,
                amount,
                month_year: currentMonthYear
            };

            // Upsert: update if exists, insert if not
            const { data, error } = await supabase
                .from('budgets')
                .upsert(payload, { onConflict: 'user_id,month_year' })
                .select()
                .single();

            if (error) throw error;
            setBudget(data);
            return data;
        } catch (error) {
            console.error('Error updating budget:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchBudget();
    }, [fetchBudget]);

    return {
        budget,
        isLoading,
        updateBudget,
        refreshBudget: fetchBudget
    };
}
