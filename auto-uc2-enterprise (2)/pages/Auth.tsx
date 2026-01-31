
import React, { useState, Suspense } from 'react';
import Spline from '@splinetool/react-spline';
import { ShieldCheck, Lock, Mail, ChevronRight, Sparkles, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import { api } from '../api';

export const Auth = ({ onLogin }: { onLogin: (u: any) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas');
        }
        const response = await api.post<any>('/auth/register', {
          name,
          email,
          password,
          confirmPassword
        });
        handleAuthSuccess(response);
      } else {
        const response = await api.post<any>('/auth/login', { email, password });
        handleAuthSuccess(response);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Échec de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (response: any) => {
    if (response.status === 'success') {
      const user = response.data.user;
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        avatar: user.photo || user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      };

      localStorage.setItem('auto_uc2_token', response.token);
      onLogin(normalizedUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col md:flex-row overflow-hidden font-inter">

      {/* Left Side: Interactive 3D Scene */}
      <div className="hidden md:block w-1/2 relative h-screen bg-black overflow-hidden">
        <Suspense fallback={<div className="w-full h-full bg-zinc-900 animate-pulse" />}>
          <Spline
            scene="https://prod.spline.design/uodAc4grI6Q0ABnm/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#020202] pointer-events-none" />

        <div className="absolute bottom-12 left-12 max-w-sm space-y-4 pointer-events-none">
          <div className="flex items-center gap-2 text-emerald-500">
            <Sparkles size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Next-Gen Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Automotive Excellence <br />Redefined by AI.
          </h1>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed">
            Experience the future of car management through interactive neural interfaces and automated decision systems.
          </p>
        </div>
      </div>

      {/* Right Side: Authentication Form */}
      <div className="w-full md:w-1/2 h-screen flex items-center justify-center p-6 relative z-10 bg-[#020202]">

        <div className="md:hidden absolute inset-0 opacity-20 pointer-events-none">
          <Suspense fallback={null}>
            <Spline scene="https://prod.spline.design/uodAc4grI6Q0ABnm/scene.splinecode" className="w-full h-full" />
          </Suspense>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-1000">

          {/* Auth Card */}
          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[rgba(0,43,31,0.8)] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-emerald-900/20 border border-emerald-500/20">A</div>
                <span className="text-white text-2xl font-black tracking-tighter uppercase">Auto-UC2</span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">{isRegister ? 'Create Account' : 'Intelligence Portal'}</h2>
              <p className="text-zinc-500 text-sm mt-2 font-medium italic">
                {isRegister ? 'Join the automotive revolution' : 'Please sign in to continue'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-xs text-center font-bold animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                {isRegister && (
                  <div className="relative group/input">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all shadow-inner"
                      required
                    />
                  </div>
                )}
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors" size={18} />
                  <input
                    type="email"
                    placeholder="Professional Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all shadow-inner"
                    required
                  />
                </div>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder={isRegister ? "Password (min 8 chars)" : "Access Code"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all shadow-inner"
                    required
                  />
                </div>
                {isRegister && (
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-emerald-500 transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all shadow-inner"
                      required
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!!loading}
                className="w-full bg-[rgba(0,43,31,0.8)] hover:bg-[rgba(0,43,31,1)] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 border border-emerald-500/20 group/btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegister ? 'Create Account' : 'Initialize Connection'}
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-zinc-500 hover:text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 flex flex-col items-center gap-6">
              <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" />
                Quantum-Safe Encryption Active
              </div>

              <Link to="/" className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                Return to Public Site
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            v2.4.0 Secure Access - <a href="#" className="text-emerald-500 hover:underline">Help Center</a>
          </p>
        </div>
      </div>
    </div>
  );
};
