import useSWR, { mutate } from 'swr';
import { supabase } from '../lib/supabase';

export interface Category {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    icon?: string;
    user_id?: string | null;
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

    const createCategory = async (category: Omit<Category, 'id'>) => {
        const { data: newCategory, error } = await supabase
            .from('categories')
            .insert(category)
            .select()
            .single();

        if (error) throw error;
        mutate('categories');
        return newCategory;
    };

    const deleteCategory = async (id: string) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        mutate('categories');
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        mutate('categories');
    };

    return {
        categories: data,
        isLoading,
        isError: error,
        createCategory,
        deleteCategory,
        updateCategory
    };
}
