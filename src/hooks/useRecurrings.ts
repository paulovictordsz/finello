import useSWR from 'swr';
import { supabase } from '../lib/supabase';

export interface Recurring {
    id: string;
    user_id: string;
    account_id?: string;
    category_id?: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    start_date: string;
    end_date?: string;
    description?: string;
    category?: { name: string; icon?: string };
}

const fetcher = async () => {
    const { data, error } = await supabase
        .from('recurrings')
        .select(`
      *,
      category:categories(name, icon)
    `)
        .order('start_date');

    if (error) throw error;
    return data as Recurring[];
};

export function useRecurrings() {
    const { data, error, isLoading, mutate } = useSWR('recurrings', fetcher);

    const createRecurring = async (recurring: any) => {
        const { error } = await supabase.from('recurrings').insert([recurring]);
        if (error) throw error;
        mutate();
    };

    const deleteRecurring = async (id: string) => {
        const { error } = await supabase.from('recurrings').delete().eq('id', id);
        if (error) throw error;
        mutate();
    };

    return {
        recurrings: data,
        isLoading,
        isError: error,
        createRecurring,
        deleteRecurring,
    };
}
