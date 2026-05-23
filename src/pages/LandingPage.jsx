import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Navigation, ShieldAlert, Users, ArrowRight, PhoneCall, Lock, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Navigation,
      title: 'Safe Routes Optimization',
      description: 'Navigate safely with real-time route analysis scoring. Our intelligent system analyzes historical and crowdsourced crime indicators to map lit, crowded, and verified safe walkways.',
      color: 'from-primary/20 to-accent/20',
      iconColor: 'text-primary-dark',
    },
    {
      icon: ShieldAlert,
      title: 'Emergency SOS Center',
      description: 'Instantly trigger emergency protocol with one click. Send live tracking coordinates to emergency hubs and chosen guardians, and simulate real-time fake phone calls for instant deterrence.',
      color: 'from-accent/20 to-primary/20',
      iconColor: 'text-danger',
    },
    {
      icon: Users,
      title: 'Community Forums & Chat',
      description: 'Engage with a supportive, location-aware peer network. Share real-time local environment reports, coordinate safety walks, and receive crowdsourced security advice in absolute privacy.',
      color: 'from-secondary/30 to-primary/20',
      iconColor: 'text-[#CC9D3F]',
    },
  ];

  return (
    <div className="min-h-screen text-slate-800 selection:bg-primary/30 flex flex-col justify-between overflow-hidden relative">
      {/* Immersive brand background graphic with custom high-end glassmorphism overlay */}
      <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat -z-20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/75 via-[#FFF5F6]/70 to-[#FFF0F2]/60 backdrop-blur-[1.5px] -z-10" />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 py-3.5 md:px-12 md:py-5 flex items-center justify-between border-b border-pink-100/50 bg-white/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.jpg" 
            alt="SheShield Logo" 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-pink-100/50 shadow-sm" 
          />
          <span className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            SheShield <span className="hidden sm:inline-flex text-[10px] uppercase font-black tracking-widest px-2 py-0.5 bg-primary/20 rounded-full text-accent-dark">Secured</span>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-tr from-primary to-accent hover:opacity-95 text-white shadow-sm rounded-xl text-xs sm:text-sm font-bold transition-all duration-200">
            Get Started
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mb-16 md:mb-24 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/15 border border-primary/25 rounded-full text-accent-dark text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            24/7 Shield & Safe Spaces
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-800 leading-[1.1] mb-6">
            Your Safety, <br />
            <span className="bg-gradient-to-r from-primary-dark via-danger to-primary-dark bg-clip-text text-transparent">
              Our Utmost Priority
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mb-8 font-medium">
            Embark on any journey with peace of mind. Empowering safety with optimized safe route recommendations, instant emergency response hubs, and crowdsourced community coordination.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-tr from-primary to-accent hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-pink-100 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white/70 backdrop-blur-md border border-slate-200 hover:border-primary/30 hover:text-slate-800 text-slate-600 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] shadow-sm">
              Access Home <Lock className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Dynamic Metric Display Panels */}
        <div className="w-full mb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { value: '10,000+', label: 'Safe Routes Generated' },
            { value: '5,000+', label: 'SOS Alerts Responded' },
            { value: '20,000+', label: 'Verified Users' },
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="card p-6 text-center backdrop-blur-md bg-white/70 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] cursor-default"
            >
              <div className="text-3xl font-extrabold text-slate-800 mb-1">{metric.value}</div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Feature Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">
              Comprehensive Safety Ecosystem
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base font-medium">
              Harness cutting-edge safety features built to shield, inform, and support you at all times.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 + idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  className="card card-hover p-6 sm:p-8 flex flex-col justify-between group backdrop-blur-md bg-white/70 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center mb-6 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${feat.iconColor}`} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 tracking-tight">{feat.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">{feat.description}</p>
                  </div>
                  <Link to="/signup" className="text-sm font-bold text-primary-dark hover:text-accent flex items-center gap-1.5 transition-colors group/link mt-auto">
                    Learn more <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="w-full mb-16 text-center">
          <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Trusted by Safety Networks</h3>
          <div className="flex flex-wrap justify-center gap-8 opacity-75">
            <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
              <Shield className="w-5 h-5 text-primary-dark" />
              <span>Government Verified</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
              <Lock className="w-5 h-5 text-[#CC9D3F]" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
              <CheckCircle className="w-5 h-5 text-success-dark" />
              <span>24/7 Dispatch Control</span>
            </div>
          </div>
        </motion.div>

        {/* Emergency Fast Links */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="w-full card border border-danger/25 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-white/90 to-[#FFF5F6]/90 backdrop-blur-md shadow-[0_8px_30px_rgba(255,71,119,0.04)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
              <PhoneCall className="w-5 h-5 text-danger animate-pulse" /> Emergency Helpline Network
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
              If you are in immediate danger, call local authorities or tap our Emergency SOS.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
            <a href="tel:1091" className="px-4 py-2 bg-danger/10 text-danger hover:bg-danger/15 text-xs sm:text-sm font-extrabold rounded-xl border border-danger/20 transition-colors shadow-sm">
              Women Helpline (1091)
            </a>
            <a href="tel:100" className="px-4 py-2 bg-white/80 hover:bg-white text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 transition-colors shadow-sm">
              Police (100)
            </a>
          </div>
        </motion.div>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="w-full bg-slate-50/70 backdrop-blur-md py-8 border-t border-pink-100/40 px-6 md:px-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-dark" />
            <span className="font-bold text-slate-600">SheShield Safety Shield Initiative</span>
          </div>
          <div>&copy; {new Date().getFullYear()} SheShield Inc. Safeguarding journeys everywhere.</div>
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage;
