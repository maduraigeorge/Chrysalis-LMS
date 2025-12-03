import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Bell,
  LayoutDashboard,
  FileText,
  Wrench,
  User as UserIcon,
  Check,
  LogOut,
  Settings,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderProps {
  user: User;
  activeModule: string;
  setActiveModule: (id: string) => void;
  onRoleChange: (role: UserRole) => void;
}

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: FileText, badge: 'AI' },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  activeModule,
  setActiveModule,
  onRoleChange
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-[900] w-full bg-gradient-to-r from-indigo-950 to-indigo-900 border-b border-indigo-800/50 shadow-md h-14 backdrop-blur-md bg-opacity-95">
        <div className="max-w-[1920px] mx-auto h-full flex items-center justify-between px-4 sm:px-6 relative gap-4">
          
          {/* LEFT SECTION: Static Brand Logo & Name */}
          <div className="flex items-center flex-shrink-0">
             <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl border border-transparent select-none">
                 {/* Logo Image with White Tint Filter */}
                <img 
                  src="https://play-lh.googleusercontent.com/A1K_hY4ECF4DIN6fzmKTShVGyiDsMyhUPUD5AoGEqHPOblf96bHjgIqmyTHLrpHRHA=w240-h480-rw" 
                  alt="Chrysalis Logo" 
                  className="h-8 w-auto brightness-0 invert opacity-100 filter drop-shadow-md" 
                />
                <span className="text-xl font-bold tracking-tight text-white hidden md:block font-roboto drop-shadow-sm">
                  Chrysalis
                </span>
             </div>
          </div>

          {/* CENTER SECTION: Navigation Modules */}
          <div className="flex-1 flex items-center justify-center min-w-0">
             <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide px-2">
                {MODULES.map((module) => {
                    const Icon = module.icon;
                    const isActive = activeModule === module.id;
                    return (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap outline-none
                          ${isActive 
                            ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20' 
                            : 'text-indigo-200 hover:bg-white/5 hover:text-white'}
                        `}
                        title={module.label}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.5} />
                        <span className="hidden lg:inline">{module.label}</span>
                        {module.badge && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wide hidden xl:inline-block">
                            {module.badge}
                          </span>
                        )}
                      </button>
                    );
                })}
             </nav>
          </div>

          {/* RIGHT SECTION: Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 relative z-[60]">
            <button className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 relative" title="Notifications">
              <Bell className="w-5 h-5" strokeWidth={2.5} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-indigo-900"></span>
            </button>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 group focus:outline-none transition-all active:scale-95 pl-2"
                title="User Profile"
              >
                {/* Name & Role Badge (Visible on Laptop/Tablet) */}
                <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
                  <span className="font-extrabold text-white text-base tracking-wide font-roboto shadow-black drop-shadow-sm">
                    {user.name}
                  </span>
                  <span className="px-2.5 py-0.5 bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md mt-0.5 border border-pink-400/50">
                    {user.role}
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-600 p-0.5 border-2 border-indigo-400/30 group-hover:border-white/50 transition-colors shadow-lg relative">
                  <div className="w-full h-full rounded-full overflow-hidden bg-indigo-500">
                     <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  {/* Online Status Dot */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-900 rounded-full"></div>
                </div>
              </button>

              {/* Profile Menu */}
              <div className={`
                absolute top-full right-0 mt-3 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 p-3
                transition-all duration-300 origin-top-right z-[1000]
                ${isProfileMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
              `}>
                <div className="p-4 bg-slate-50 rounded-2xl mb-3 flex items-center gap-3 border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm overflow-hidden">
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                      <p className="text-xs font-bold text-pink-500 uppercase px-2 py-0.5 bg-pink-50 rounded-full inline-block mt-1">{user.role}</p>
                    </div>
                </div>

                <div className="space-y-1">
                  {[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all
                        ${user.role === role 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                          {role === UserRole.STUDENT && <UserIcon className="w-4 h-4" strokeWidth={2.5} />}
                          {role === UserRole.TEACHER && <BookOpen className="w-4 h-4" strokeWidth={2.5} />}
                          {role === UserRole.ADMIN && <Settings className="w-4 h-4" strokeWidth={2.5} />}
                          {role}
                      </div>
                      {user.role === role && <Check className="w-4 h-4" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
                
                <div className="border-t border-slate-100 mt-3 pt-3">
                  <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Menu Backdrop */}
      {isProfileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[800] animate-fade-in" aria-hidden="true" onClick={() => setIsProfileMenuOpen(false)} />
      )}
    </>
  );
};
