import useSWR from 'swr';
import { supabase } from '../lib/supabase';

export interface Category {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    icon?: string;
}

const fetcher = async () => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

    if (error) throw error;
    return data as Category[];
};

export function useCategories() {
    const { data, error, isLoading } = useSWR('categories', fetcher);

    return {
        categories: data,
        isLoading,
        isError: error,
    };
}
