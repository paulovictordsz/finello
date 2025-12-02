import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNavbar from './MobileNavbar';
import { Settings, LogOut, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAccounts } from '../hooks/useAccounts';
import { useEffect } from 'react';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const { signOut } = useAuth();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const { accounts, isLoading } = useAccounts();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && accounts && accounts.length === 0) {
            navigate('/onboarding');
        }
    }, [accounts, isLoading, navigate]);

    return (
        <div className="min-h-screen bg-cream flex flex-col md:flex-row pb-20 md:pb-0">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-30">
                <Link to="/settings" className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
                    <Settings size={24} />
                </Link>

                <img src="/Ico.svg" alt="Finello" className="h-8" />

                <div className="relative">
                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20"
                    >
                        <User size={20} />
                    </button>

                    {isProfileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsProfileMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                                <Link
                                    to="/settings"
                                    className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <Settings size={18} />
                                    Configurações
                                </Link>
                                <button
                                    onClick={signOut}
                                    className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 w-full text-left"
                                >
                                    <LogOut size={18} />
                                    Sair
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Sidebar
                isDesktopCollapsed={isDesktopCollapsed}
                onDesktopToggle={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            />

            <main
                className={clsx(
                    "flex-1 transition-all duration-300 p-4 md:p-8",
                    isDesktopCollapsed ? "md:ml-20" : "md:ml-60"
                )}
            >
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            <MobileNavbar />
        </div>
    );
};

export default Layout;
