import { useCategories } from '../hooks/useCategories';
import { Loader2, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
    const { categories, isLoading } = useCategories();
    const { user, signOut } = useAuth();

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
                <h1 className="text-2xl font-bold text-secondary">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your preferences</p>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-secondary mb-4">Account</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-secondary">{user?.user_metadata.full_name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-secondary mb-4">Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories?.map((category) => (
                        <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg text-primary shadow-sm">
                                <Tag size={16} />
                            </div>
                            <div>
                                <p className="font-medium text-secondary">{category.name}</p>
                                <p className="text-xs text-gray-400">{category.type}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
