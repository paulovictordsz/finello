import { useState } from 'react';
import { useCategories, type Category } from '../hooks/useCategories';
import { Loader2, Tag, Plus, Trash2, X, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

export default function Settings() {
    const { categories, isLoading, createCategory, deleteCategory, updateCategory } = useCategories();
    const { user, signOut, updateProfile } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE'
    });

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                type: category.type as 'INCOME' | 'EXPENSE'
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', type: 'EXPENSE' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, formData);
            } else {
                await createCategory({
                    ...formData,
                    user_id: user.id
                });
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            setFormData({ name: '', type: 'EXPENSE' });
        } catch (error) {
            console.error('Failed to save category:', error);
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
                <h2 className="text-lg font-bold text-secondary mb-4">Perfil</h2>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                {user?.user_metadata.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-secondary text-lg">{user?.user_metadata.full_name}</h3>
                                <p className="text-gray-500">{user?.email}</p>
                            </div>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const name = formData.get('name') as string;
                                if (name && name !== user?.user_metadata.full_name) {
                                    try {
                                        await updateProfile({ full_name: name });
                                        alert('Perfil atualizado com sucesso!');
                                    } catch (error) {
                                        console.error('Error updating profile:', error);
                                        alert('Erro ao atualizar perfil.');
                                    }
                                }
                            }}
                            className="flex gap-2 max-w-md"
                        >
                            <input
                                name="name"
                                defaultValue={user?.user_metadata.full_name}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="Seu nome"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
                            >
                                Salvar
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={signOut}
                            className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Sair da Conta
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-secondary">Categorias</h2>
                    <button
                        onClick={() => handleOpenModal()}
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                        title="Editar Categoria"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir Categoria"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-secondary">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                            onClick={() => setFormData({ ...formData, type: type as any })}
                                            className={clsx(
                                                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                                formData.type === type
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
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingCategory ? 'Salvar Alterações' : 'Criar Categoria')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
