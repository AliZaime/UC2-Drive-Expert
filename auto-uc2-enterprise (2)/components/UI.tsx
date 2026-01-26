
import React from 'react';
import { Loader2, X } from 'lucide-react';

export const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'emerald';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', isLoading, children, className, ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-900 border border-white/5",
    ghost: "bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white",
    outline: "bg-transparent border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white",
    emerald: "bg-[rgba(0,43,31,0.8)] text-white hover:bg-[rgba(0,43,31,1)] border border-emerald-500/20 shadow-xl shadow-emerald-900/20"
  };

  return (
    <button
      className={cn(
        "px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, title, subtitle, noPadding }) => (
  <div className={cn("bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden flex flex-col", className)}>
    {(title || subtitle) && (
      <div className="px-8 py-6 border-b border-white/5 bg-zinc-950/20 shrink-0">
        {title && <h3 className="text-lg font-black text-white leading-tight tracking-tighter uppercase">{title}</h3>}
        {subtitle && <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
      </div>
    )}
    {noPadding ? children : <div className="p-8 flex-1">{children}</div>}
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-zinc-800 text-zinc-400 border-white/5'
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", styles[variant])}>
      {children}
    </span>
  );
};

export const Input: React.FC<any> = ({ label, error, className, icon: Icon, rightElement, ...props }) => (
  <div className="w-full space-y-2">
    {label && <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />}
      <input
        className={cn(
          "w-full px-5 py-3.5 bg-zinc-950/60 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all text-sm text-white placeholder:text-zinc-700",
          Icon && "pl-12",
          error && "border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {rightElement}
        </div>
      )}
    </div>
    {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{error}</p>}
  </div>
);

export const Table: React.FC<any> = ({ headers, children, className }) => (
  <div className={cn("overflow-x-auto", className)}>
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-white/5 text-left bg-zinc-950/20">
          {headers.map((h: string, i: number) => (
            <th key={i} className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">{children}</tbody>
    </table>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/20">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">{title}</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-xl">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-8 py-6 border-t border-white/5 bg-zinc-950/20 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Implementation
import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext<{ addToast: (msg: string, type: 'success' | 'error' | 'info') => void } | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast(message);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          },
        }}
      />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
