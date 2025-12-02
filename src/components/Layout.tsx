import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-cream flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-30">
                <img src="/Logo_Horizontal.svg" alt="Finello" className="h-8" />
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            <Sidebar
                isMobileOpen={isMobileOpen}
                onMobileClose={() => setIsMobileOpen(false)}
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
        </div>
    );
};

export default Layout;
