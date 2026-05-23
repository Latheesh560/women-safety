import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) navigate('/home');
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    const success = await login(email, password);
    if (success) navigate('/home');
  };

  return (
    <div className="min-h-screen text-slate-800 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative">
      {/* Immersive brand background graphic with custom high-end glassmorphism overlay */}
      <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat -z-20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/75 via-[#FFF5F6]/70 to-[#FFF0F2]/60 backdrop-blur-[1.5px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
      <Link to="/" className="flex items-center gap-2.5 mb-8 group relative z-10">
        <img 
          src="/logo.jpg" 
          alt="SheShield Logo" 
          className="w-12 h-12 rounded-2xl object-cover border border-pink-100/50 shadow-md group-hover:scale-105 transition-transform" 
        />
        <span className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
          SheShield <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 bg-primary/20 rounded-full text-accent-dark">Secured</span>
        </span>
      </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md card p-8 backdrop-blur-md bg-white/75 border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl"></div>

        <h2 className="text-xl font-bold text-center text-slate-800 mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-xs text-center text-slate-500 mb-6 font-semibold">
          Sign in to secure your journey and connect with community support.
        </p>

        {(localError || error) && (
          <div className="mb-5 p-3.5 bg-danger/10 border border-danger/25 text-danger text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
            <span className="font-semibold">{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="jane.doe@example.com" className="input-field pl-11 border-slate-200/80 bg-white/90 focus:bg-white" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="input-label mb-0">Password</label>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Demo: password123</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="input-field pl-11 pr-10 border-slate-200/80 bg-white/90 focus:bg-white" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-pink flex justify-center items-center py-3 bg-gradient-to-tr from-primary to-accent text-white border-0 font-bold shadow-md shadow-pink-100 hover:opacity-95 transition-all">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </span>
            ) : 'Unlock Home'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-500 font-semibold">
          New to the Shield Initiative?{' '}
          <Link to="/signup" className="font-bold text-primary-dark hover:text-accent transition-colors">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
