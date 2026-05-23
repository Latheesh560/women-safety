import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { LogOut, User, Bell, Menu } from 'lucide-react';

const TopHeader = ({ title, onMenuToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/45 backdrop-blur-lg border-b border-pink-100/40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/40 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/40 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-dark rounded-full"></span>
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-pink-100/40">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center border border-primary/25 shadow-sm">
            <User className="w-4 h-4 text-primary-dark" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Verified Guard</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-500 hover:text-danger hover:bg-danger/10 transition-all"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
