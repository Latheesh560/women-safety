import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { useNotificationStore } from '../context/notificationStore';
import { LogOut, User, Bell, Menu, AlertTriangle, MessageSquare, Check } from 'lucide-react';

const TopHeader = ({ title, onMenuToggle }) => {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/40 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary-dark rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-pink-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-3 border-b border-pink-50 flex justify-between items-center bg-slate-50/50">
                <span className="font-bold text-sm text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary-dark hover:text-primary font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        setDropdownOpen(false);
                        if(notif.link) navigate(notif.link);
                      }}
                      className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read ? 'bg-pink-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-full ${notif.type === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary-dark'}`}>
                          {notif.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 bg-primary-dark rounded-full mt-1.5 shrink-0" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
