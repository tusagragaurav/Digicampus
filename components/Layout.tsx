import React, { ReactNode } from 'react';
import { User, UserRole } from '../types';
import { LayoutDashboard, Users, BookOpen, FileText, CreditCard, Server, LogOut, Sun, Moon, Bell, Menu, GraduationCap, X, Bot, PenTool } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentUser: User | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onOpenAI: () => void;
  onOpenTools: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentViewRole: UserRole | null;
  onSwitchViewRole: (role: UserRole) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentUser,
  currentPage,
  onNavigate,
  onLogout,
  onOpenAI,
  onOpenTools,
  isDarkMode,
  toggleDarkMode,
  currentViewRole
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const getMenuItems = () => {
    switch (currentViewRole) {
      case UserRole.ADMIN:
        return [
          { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
          { id: 'users', icon: Users, label: 'User Management' },
          { id: 'courses', icon: BookOpen, label: 'Courses' },
          { id: 'reports', icon: FileText, label: 'Reports' },
          { id: 'finances', icon: CreditCard, label: 'Finance' },
        ];
      case UserRole.TEACHER:
        return [
           { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
           { id: 'classes', icon: BookOpen, label: 'My Classes' },
           { id: 'students', icon: Users, label: 'Students' },
           { id: 'notices', icon: FileText, label: 'Notice Board' },
           { id: 'profile', icon: Users, label: 'Profile' }
        ];
      case UserRole.ACCOUNTANT:
         return [
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'fees', icon: CreditCard, label: 'Fees & Invoices' },
         ];
      case UserRole.STUDENT:
      default:
         return [
             { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
             { id: 'courses', icon: BookOpen, label: 'My Courses' },
             { id: 'assignments', icon: FileText, label: 'Assignments' },
             { id: 'exams', icon: FileText, label: 'Exams' },
             { id: 'fees', icon: CreditCard, label: 'Fee Status' },
             { id: 'profile', icon: Users, label: 'Profile' },
         ];
    }
  };

  if (!currentUser) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap className="w-6 h-6 text-white" />
             </div>
             <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
               DigiCampus
             </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
             <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
                {getMenuItems().map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            onNavigate(item.id);
                            setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group font-medium ${
                            currentPage === item.id 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400'}`} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            {/* AI Tools Section */}
            <div>
                 <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Tools</p>
                 <button 
                    onClick={onOpenAI}
                    className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-fuchsia-500/10 hover:to-purple-500/10 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-all group"
                 >
                     <div className="p-1.5 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg text-fuchsia-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform">
                         <Bot className="w-4 h-4" />
                     </div>
                     <span className="font-bold">AI Assistant</span>
                 </button>
                 <button 
                    onClick={onOpenTools}
                    className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all group mt-1"
                 >
                     <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                         <PenTool className="w-4 h-4" />
                     </div>
                     <span className="font-bold">Smart Tools</span>
                 </button>
            </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
             <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex items-center space-x-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition" onClick={onLogout}>
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {currentUser.avatar ? (
                          <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                      parent.innerHTML = currentUser.name.charAt(0);
                                  }
                              }}
                          />
                      ) : (
                          currentUser.name.charAt(0)
                      )}
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.role}</p>
                  </div>
                  <LogOut className="w-5 h-5 text-slate-400 hover:text-red-500 transition" />
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30">
             <div className="flex items-center space-x-4">
                 <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                     <Menu className="w-6 h-6" />
                 </button>
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">
                     {currentViewRole ? `${currentViewRole.charAt(0).toUpperCase() + currentViewRole.slice(1).toLowerCase()} Portal` : 'Dashboard'}
                 </h2>
             </div>

             <div className="flex items-center space-x-4">
                 <button 
                    onClick={toggleDarkMode}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                 >
                     {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </button>
                 <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition relative">
                     <Bell className="w-5 h-5" />
                     <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800"></span>
                 </button>
             </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
             <div className="max-w-7xl mx-auto pb-20">
                 {children}
             </div>
        </div>
      </main>
    </div>
  );
};