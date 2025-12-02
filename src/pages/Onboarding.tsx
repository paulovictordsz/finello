import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowRight, Check, Target, Banknote } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const { createAccount } = useAccounts();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [accountData, setAccountData] = useState({
        name: '',
        initial_balance: '',
        type: 'CHECKING'
    });

    const [goal, setGoal] = useState('');

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleFinish = async () => {
        setIsLoading(true);
        try {
            if (!user?.id) return;

            // Create the account
            await createAccount({
                user_id: user.id,
                name: accountData.name,
                initial_balance: Number(accountData.initial_balance),
                type: accountData.type as any
            });

            // Save goal to localStorage for now
            if (goal) {
                localStorage.setItem('monthly_goal', goal);
            }

            navigate('/');
        } catch (error) {
            console.error('Failed to complete onboarding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8">
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={clsx(
                                    "h-1 flex-1 rounded-full transition-colors duration-300",
                                    s <= step ? "bg-primary" : "bg-gray-100"
                                )}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                        <Banknote size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-secondary">Bem-vindo ao Finello!</h2>
                                    <p className="text-gray-500 mt-2">Vamos configurar sua conta para começar. Primeiro, confirmamos sua moeda.</p>
                                </div>

                                <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🇧🇷</span>
                                        <div>
                                            <p className="font-bold text-secondary">Real Brasileiro (BRL)</p>
                                            <p className="text-xs text-gray-500">Moeda Padrão</p>
                                        </div>
                                    </div>
                                    <Check className="text-primary" size={20} />
                                </div>

                                <button
                                    onClick={handleNext}
                                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    Continuar <ArrowRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                        <Wallet size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-secondary">Sua Primeira Conta</h2>
                                    <p className="text-gray-500 mt-2">Adicione uma conta para começar a rastrear suas finanças.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                                        <input
                                            type="text"
                                            value={accountData.name}
                                            onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="Ex: Nubank, Itaú, Carteira"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                                        <input
                                            type="number"
                                            value={accountData.initial_balance}
                                            onChange={(e) => setAccountData({ ...accountData, initial_balance: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                        <select
                                            value={accountData.type}
                                            onChange={(e) => setAccountData({ ...accountData, type: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                        >
                                            <option value="CHECKING">Conta Corrente</option>
                                            <option value="SAVINGS">Poupança</option>
                                            <option value="CASH">Dinheiro</option>
                                            <option value="OTHER">Outro</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={!accountData.name || !accountData.initial_balance}
                                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continuar <ArrowRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                        <Target size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-secondary">Meta Mensal</h2>
                                    <p className="text-gray-500 mt-2">Defina uma meta de gastos mensal para manter o controle (Opcional).</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta de Gastos (R$)</label>
                                    <input
                                        type="number"
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-lg font-bold"
                                        placeholder="Ex: 2000.00"
                                    />
                                </div>

                                <button
                                    onClick={handleFinish}
                                    disabled={isLoading}
                                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Configurando...' : 'Começar a Usar'} <Check size={20} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
