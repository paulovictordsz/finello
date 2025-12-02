import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Loader2, Tag, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

export default function Settings() {
    const { categories, isLoading, createCategory, deleteCategory } = useCategories();
    const { user, signOut } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE'
    });

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSubmitting(true);
        try {
            await createCategory({
                ...newCategory,
                user_id: user.id
            });
            setIsModalOpen(false);
            setNewCategory({ name: '', type: 'EXPENSE' });
        } catch (error) {
            console.error('Failed to create category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
            try {
                await deleteCategory(id);
            } catch (error) {
                console.error('Failed to delete category:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-secondary">Configurações</h1>
                <p className="text-gray-500 text-sm mt-1">Gerencie suas preferências</p>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-secondary mb-4">Conta</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-secondary">{user?.user_metadata.full_name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-secondary">Categorias</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Nova Categoria
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories?.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-primary shadow-sm">
                                    <Tag size={16} />
                                </div>
                                <div>
                                    <p className="font-medium text-secondary">{category.name}</p>
                                    <p className="text-xs text-gray-400">{category.type === 'INCOME' ? 'Receita' : 'Despesa'}</p>
                                </div>
                            </div>
                            {category.user_id === user?.id && (
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Excluir Categoria"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-secondary">Nova Categoria</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Ex: Viagem, Freelance"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                    {['EXPENSE', 'INCOME'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewCategory({ ...newCategory, type: type as any })}
                                            className={clsx(
                                                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                                newCategory.type === type
                                                    ? "bg-white text-secondary shadow-sm"
                                                    : "text-gray-500 hover:text-secondary"
                                            )}
                                        >
                                            {type === 'EXPENSE' ? 'Despesa' : 'Receita'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Criar Categoria'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
