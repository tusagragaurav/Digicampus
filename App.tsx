
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Layout } from './components/Layout';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AccountantDashboard } from './components/AccountantDashboard';
import { AISidebar } from './components/AISidebar';
import { ToolsModal } from './components/ToolsModal';
import { storage } from './services/storage';
import { authService } from './services/auth';
import { GraduationCap, Lock, Sparkles, X, ChevronRight, BookOpen, Shield, IndianRupee, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentViewRole, setCurrentViewRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard'); // Navigation State
  const [isAIContextMenuOpen, setIsAIContextMenuOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    storage.init();
    setAvailableUsers(storage.getUsers());

    // Welcome Screen Timer
    const timer = setTimeout(() => {
        setShowWelcome(false);
    }, 2800);

    const handleOpenTools = () => setIsToolsModalOpen(true);
    window.addEventListener('open-tools-modal', handleOpenTools);
    
    const handleOpenAI = () => setIsAIContextMenuOpen(true);
    window.addEventListener('open-ai-sidebar', handleOpenAI);

    const handleStorageUpdate = () => {
        const users = storage.getUsers();
        setAvailableUsers(users);
        if (currentUser) {
            const updated = users.find(u => u.id === currentUser.id);
            if (updated) setCurrentUser(updated);
        }
    };
    window.addEventListener('storage-update', handleStorageUpdate);

    // Auth state listener
    const unsubscribe = authService.onAuthStateChange((user) => {
        setCurrentUser(user);
        setCurrentViewRole(user?.role || null);
        setCurrentPage('dashboard');
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-tools-modal', handleOpenTools);
      window.removeEventListener('open-ai-sidebar', handleOpenAI);
      window.removeEventListener('storage-update', handleStorageUpdate);
      unsubscribe();
    };
  }, [currentUser]);

  const handleRoleSelect = (role: UserRole) => {
      setSelectedRoleFilter(role);
      // Reset form
      setEmail('');
      setPassword('');
      setAuthError('');
      setShowAuthModal(true);
  };

  const handleLogout = async () => {
      try {
        await authService.logout();
        setCurrentPage('dashboard');
        setShowAuthModal(false);
        setSelectedRoleFilter(null);
        setEmail('');
        setPassword('');
      } catch (error) {
        console.error('Logout failed:', error);
      }
  };

  const handleGoogleSignIn = async () => {
      setAuthError('');
      setIsAuthLoading(true);
      try {
        await authService.loginWithGoogle();
      } catch (error) {
        setAuthError('Google sign-in failed. Please try again.');
      }
      setIsAuthLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      setIsAuthLoading(true);

      try {
        const user = await authService.loginWithMock(email, password, selectedRoleFilter!);
        if (user) {
          // Auth state change will be handled by the listener
        } else {
          setAuthError('Invalid credentials. (Hint: use "password")');
        }
      } catch (error) {
        setAuthError('Login failed. Please try again.');
      }
      setIsAuthLoading(false);
  };

  const quickFill = (u: User) => {
      setEmail(u.email);
      setPassword('password');
      setAuthError('');
  };

  const getFilteredUsers = () => {
      if (!selectedRoleFilter) return [];
      return availableUsers.filter(u => u.role === selectedRoleFilter);
  };

  const handleViewRoleSwitch = (role: UserRole) => {
      setCurrentViewRole(role);
      setCurrentPage('dashboard'); // Reset page when switching views
  };

  // --- Welcome Screen ---
  if (showWelcome) {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1120] overflow-hidden">
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-400/20 dark:bg-fuchsia-600/10 rounded-full blur-[100px] animate-blob-delayed"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-8 animate-fade-in scale-in-center">
                    <span className="text-5xl md:text-6xl font-bold text-white">D</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight animate-slide-up text-center" style={{animationDelay: '0.1s'}}>
                    DigiCampus<span className="text-violet-500">.</span>
                </h1>
                
                <div className="flex items-center space-x-3 px-6 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm animate-slide-up" style={{animationDelay: '0.2s'}}>
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">AI-Powered Learning Experience</span>
                </div>
            </div>
        </div>
      );
  }

  // --- Login Screen ---
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex bg-white dark:bg-slate-900 overflow-hidden animate-fade-in">
        <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
            
            <div className="relative z-10 max-w-lg">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                     <span className="text-3xl font-bold text-black">D</span>
                </div>
                <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                    Education Reimagined <br/> with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Gemini AI</span>.
                </h1>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Join the next generation of learning. Experience personalized tutoring, instant document analysis, and seamless course management.
                </p>
            </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-y-auto">
             <div className="w-full max-w-md space-y-8 animate-slide-up py-8">
                 <div className="text-center lg:text-left">
                     <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome back</h2>
                     <p className="text-slate-500 mt-2">Select your role to access the portal.</p>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                     {[UserRole.STUDENT, UserRole.TEACHER, UserRole.ACCOUNTANT, UserRole.ADMIN].map((role) => (
                        <button 
                            key={role}
                            onClick={() => handleRoleSelect(role)}
                            className="group flex items-center p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800 text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors text-slate-600 dark:text-slate-300 mr-4">
                                {role === UserRole.STUDENT && <GraduationCap className="w-6 h-6" />}
                                {role === UserRole.TEACHER && <BookOpen className="w-6 h-6" />}
                                {role === UserRole.ACCOUNTANT && <IndianRupee className="w-6 h-6" />}
                                {role === UserRole.ADMIN && <Shield className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors capitalize">{role.toLowerCase()} Portal</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Access your dashboard</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transform group-hover:translate-x-1 transition-all" />
                        </button>
                     ))}
                 </div>
             </div>
        </div>

        {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Login as {selectedRoleFilter}</h3>
                            <p className="text-xs text-slate-500">Enter your credentials below</p>
                        </div>
                        <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-500"/></button>
                    </div>
                    
                    <div className="p-6">
                        {authError && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                {authError}
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="name@edu.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isAuthLoading}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                            >
                                {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <span>Sign In</span>}
                            </button>
                        </form>

                        <div className="mt-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isAuthLoading}
                                className="w-full mt-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Continue with Google</span>
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 text-center">Available Demo Accounts</p>
                             <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                 {getFilteredUsers().map(u => (
                                     <button 
                                        key={u.id} 
                                        onClick={() => quickFill(u)}
                                        className="text-left text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex items-center justify-between group"
                                     >
                                        <span>{u.email}</span>
                                        <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-violet-500">Autofill</span>
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Layout 
        currentUser={currentUser} 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout} 
        onOpenAI={() => setIsAIContextMenuOpen(true)}
        onOpenTools={() => setIsToolsModalOpen(true)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        currentViewRole={currentViewRole}
        onSwitchViewRole={handleViewRoleSwitch}
      >
        {currentViewRole === UserRole.STUDENT && <StudentDashboard currentUser={currentUser} currentPage={currentPage} />}
        {currentViewRole === UserRole.TEACHER && <TeacherDashboard currentUser={currentUser} currentPage={currentPage} />}
        {currentViewRole === UserRole.ADMIN && <AdminDashboard currentUser={currentUser} currentPage={currentPage} />}
        {currentViewRole === UserRole.ACCOUNTANT && <AccountantDashboard currentUser={currentUser} currentPage={currentPage} />}
      </Layout>

      <AISidebar isOpen={isAIContextMenuOpen} onClose={() => setIsAIContextMenuOpen(false)} currentUser={currentUser} />
      <ToolsModal isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)} />
    </>
  );
};

export default App;
