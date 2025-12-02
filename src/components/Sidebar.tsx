import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    PieChart,
    CreditCard,
    ArrowLeftRight,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    isMobileOpen: boolean;
    onMobileClose: () => void;
    isDesktopCollapsed: boolean;
    onDesktopToggle: () => void;
}

const Sidebar = ({ isMobileOpen, onMobileClose, isDesktopCollapsed, onDesktopToggle }: SidebarProps) => {
    const { signOut } = useAuth();
    const location = useLocation();

    // Close mobile sidebar on route change
    useEffect(() => {
        onMobileClose();
    }, [location.pathname]);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: PieChart, label: 'Analytics', path: '/analytics' },
        { icon: CreditCard, label: 'Cards', path: '/cards' },
        { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white border-r border-gray-100">
            <div className="p-6 flex items-center justify-between h-20">
                {!isDesktopCollapsed && (
                    <img src="/Logo_Horizontal.svg" alt="Finello" className="h-8" />
                )}
                {isDesktopCollapsed && (
                    <img src="/Ico.svg" alt="Finello" className="h-8 mx-auto" />
                )}

                {/* Desktop Collapse Button */}
                <button
                    onClick={onDesktopToggle}
                    className="hidden md:block absolute -right-3 top-8 bg-white border border-gray-100 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-500"
                >
                    {isDesktopCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Mobile Close Button */}
                <button
                    onClick={onMobileClose}
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200",
                            isActive
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                        )}
                    >
                        <item.icon size={20} />
                        {(!isDesktopCollapsed || isMobileOpen) && (
                            <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
                                {item.label}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-50">
                <button
                    onClick={signOut}
                    className={clsx(
                        "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors duration-200",
                        isDesktopCollapsed && !isMobileOpen && "justify-center"
                    )}
                >
                    <LogOut size={20} />
                    {(!isDesktopCollapsed || isMobileOpen) && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ width: 240 }}
                animate={{ width: isDesktopCollapsed ? 80 : 240 }}
                className="hidden md:flex h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-50 flex-col transition-all duration-300 shadow-sm"
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onMobileClose}
                            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
