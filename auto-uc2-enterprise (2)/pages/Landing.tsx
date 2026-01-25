
import React, { useState, Suspense } from 'react';
import Spline from '@splinetool/react-spline';
import { 
  ArrowUpRight, ChevronDown, ArrowRight, Star, 
  Check, Instagram, Github, Twitter, Globe, Info,
  History, Users, Rocket, Activity, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800/50 py-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="text-lg md:text-xl font-medium text-zinc-200 group-hover:text-white transition-colors">{question}</span>
        <ChevronDown className={`text-zinc-500 transition-transform duration-500 ${isOpen ? 'rotate-180 text-[rgba(0,43,31,0.8)]' : ''}`} size={20} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">{answer}</p>
      </div>
    </div>
  );
};

export const Landing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[rgba(0,43,31,0.3)] font-inter overflow-x-hidden">
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<div className="bg-black w-full h-full" />}>
          <Spline 
            scene="https://prod.spline.design/O38gZ9CslkFPeneV/scene.splinecode" 
            className="w-full h-full opacity-70"
          />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#020202]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-8 py-4 w-[95%] max-w-7xl backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[rgba(0,43,31,0.8)] rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[rgba(0,43,31,0.2)] border border-emerald-500/20">A</div>
          <span className="text-xl font-black tracking-tighter uppercase">AUTO-UC2</span>
        </div>
        
        <div className="hidden md:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white">Home</button>
          <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Services</button>
          <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">Contact us</button>
          <button onClick={() => scrollToSection('impact')} className="hover:text-white transition-colors">About us</button>
        </div>

        <Link to="/login">
          <button className="bg-[rgba(0,43,31,0.8)] hover:bg-[rgba(0,43,31,1)] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[rgba(0,43,31,0.3)] border border-emerald-500/10">
            Login
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Social Proof Pill */}
        <div className="mb-12 bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
              <img key={i} src={`https://i.pravatar.cc/100?u=${i+20}`} className="w-8 h-8 rounded-full border-2 border-[#020202]" alt="client" />
            ))}
          </div>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-1">
            <div className="flex text-emerald-500">
               {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="currentColor" />)}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">115+ happy clients</span>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl xl:text-[120px] font-black leading-[0.85] tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          Automate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgba(0,43,31,0.8)] to-emerald-400">Intelligence</span>.<br />
          Accelerate Growth.
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 animate-in fade-in duration-1000">
          Our AI-powered SaaS platform empowers businesses to streamline operations, automate repetitive tasks, and make smarter, data-driven decisions-all from one intuitive dashboard.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/login" className="bg-[rgba(0,43,31,0.8)] hover:bg-[rgba(0,43,31,1)] text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-[rgba(0,43,31,0.2)] active:scale-95 border border-emerald-500/20 inline-block">
            Get Started
          </Link>
          <button onClick={() => scrollToSection('features')} className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95">
            See Details
          </button>
        </div>
      </section>

      {/* Stats Divider */}
      <section className="relative z-10 px-6 max-w-7xl mx-auto py-20 border-y border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:divide-x divide-white/5">
          <div>
            <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-2">Clients</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">120K+</h2>
          </div>
          <div>
            <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-2">Projects</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">150+</h2>
          </div>
          <div>
            <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-2">5-Star Reviews</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">32K+</h2>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto scroll-mt-24">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
              Designed for Designers.<br />
              Powered by <span className="text-[rgba(0,43,31,0.8)]">AI.</span>
            </h2>
            <p className="text-zinc-500 max-w-md font-medium">
              Unlock the full potential of your creativity with our AI-powered design assistant. Explore new dimensions of design.
            </p>
          </div>
          <div className="w-24 h-24 border border-zinc-800 rounded-3xl flex items-center justify-center rotate-12 bg-white/5">
             <div className="w-12 h-12 border border-zinc-700 rounded-lg flex items-center justify-center animate-spin-slow">
               <div className="w-6 h-6 bg-cyan-400 rounded-sm blur-sm" />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { 
              title: "Instant Ideation", 
              desc: "Skip the blank canvas and spark creativity instantly. Our AI generates high-quality, on-brand design concepts within seconds.",
              gradient: "from-[rgba(0,43,31,0.2)] to-transparent"
            },
            { 
              title: "Smart Adaptability", 
              desc: "No two creators are the same, and neither are their styles. Our AI learns from your inputs, understands your preferences.",
              gradient: "from-zinc-500/10 to-transparent"
            },
            { 
              title: "Multi-Format Export", 
              desc: "Design once, export anywhere. Whether you need high-res graphics for print, responsive visuals for web, or mobile-optimized assets.",
              gradient: "from-zinc-500/10 to-transparent"
            },
            { 
              title: "Seamless Revisions", 
              desc: "Say goodbye to repetitive tweaks and endless back-and-forths. With intuitive prompt-based editing and revision tools.",
              gradient: "from-[rgba(0,43,31,0.2)] to-transparent"
            }
          ].map((item, idx) => (
            <div key={idx} className={`relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-12 group overflow-hidden transition-all hover:border-emerald-500/30`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                  <p className="text-zinc-400 max-w-[280px] text-sm leading-relaxed">{item.desc}</p>
                  <Link to="/login" className="w-12 h-12 bg-[rgba(0,43,31,0.8)] rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                    <ArrowUpRight size={20} />
                  </Link>
                </div>
                <h3 className="text-4xl font-black tracking-tight group-hover:text-white transition-colors">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ASYMMETRIC BENTO STATS SECTION */}
      <section id="impact" className="relative z-10 py-32 px-6 max-w-7xl mx-auto overflow-hidden scroll-mt-24">
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-baseline">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
            Our <span className="text-[rgba(0,43,31,0.8)]">Impact</span>.
          </h2>
          <p className="text-zinc-500 font-medium max-w-sm">
            Turning metrics into milestones. We don't just track data; we fuel transformation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Heritage - Vertical Tall */}
          <div className="md:col-span-4 bg-zinc-900/50 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] group-hover:bg-emerald-500/10 transition-all" />
            <div className="space-y-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <History size={28} />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Heritage</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                A decade of excellence in pioneering automotive intelligence and digital automation.
              </p>
            </div>
            <div className="relative z-10">
              <span className="text-[120px] font-black leading-none tracking-tighter block text-transparent bg-clip-text bg-gradient-to-b from-emerald-500 to-emerald-200">2014</span>
              <p className="text-zinc-300 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Year of establishment</p>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 2: Satisfied Clients - Wide/Tall */}
            <div className="md:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between group hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="space-y-4 relative z-10 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                  <Users size={24} />
                </div>
                <h3 className="text-3xl font-black tracking-tight">Trust Beyond Scale</h3>
                <p className="text-zinc-500 text-sm">Our enterprise partners enjoy bespoke AI solutions that redefine their growth trajectories.</p>
                <div className="flex -space-x-3 pt-4">
                  {[1,2,3,4,5,6].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i+100}`} className="w-10 h-10 rounded-full border-4 border-[#020202] group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i*50}ms` }} alt="client" />)}
                </div>
              </div>
              <div className="relative z-10 mt-8 md:mt-0 text-right">
                 <span className="text-[140px] font-black leading-none tracking-tighter block opacity-80 group-hover:opacity-100 transition-opacity">189</span>
                 <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs">Global Partners</p>
              </div>
            </div>

            {/* Card 3: Projects Launched */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden">
               <div className="space-y-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Rocket size={20} />
                </div>
                <h4 className="text-lg font-bold">Launched</h4>
              </div>
              <div className="relative z-10">
                <span className="text-8xl font-black leading-none tracking-tighter block group-hover:scale-110 transition-transform duration-500">304</span>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4">Enterprise Projects</p>
              </div>
            </div>

            {/* Card 4: Active Stream */}
            <div className="bg-zinc-950 border border-emerald-500/20 rounded-[3rem] p-10 flex flex-col justify-between group hover:bg-[rgba(0,43,31,0.8)] transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-4 right-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping group-hover:bg-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white">Active</span>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,43,31,0.8)] flex items-center justify-center text-white border border-white/20 group-hover:bg-white group-hover:text-[rgba(0,43,31,0.8)]">
                  <Zap size={20} />
                </div>
                <h4 className="text-lg font-bold group-hover:text-white">In Queue</h4>
              </div>
              <div className="relative z-10">
                <span className="text-8xl font-black leading-none tracking-tighter block group-hover:text-white">12</span>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4 group-hover:text-white/70">Ongoing Initiatives</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-6">
          <Link to="/login" className="bg-[rgba(0,43,31,0.8)] hover:bg-[rgba(0,43,31,1)] text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 border border-emerald-500/10">
            Join the Ecosystem <ArrowRight size={20} />
          </Link>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Activity size={12} className="text-emerald-500" /> Real-time tracking enabled
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 max-w-7xl mx-auto text-center scroll-mt-24">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
           Choose the Plan<br />That's Right for You
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-16 font-medium">
           Giving you access to essential features and over 1,000 creative tools. Upgrade to the Pro Plan to unlock powerful AI capabilities, cloud syncing, and more.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-20">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
          >
            Yearly
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Free Plan */}
          <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] text-left flex flex-col">
            <h4 className="text-xl font-bold mb-4">Free</h4>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Everything you need to supercharge your productivity.</p>
            <div className="mb-8">
              <span className="text-5xl font-black tracking-tighter">$0</span>
              <span className="text-zinc-500 text-sm"> / month</span>
            </div>
            <div className="space-y-4 mb-12 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">What's included</p>
              {[
                "20 design generations/month",
                "Low-res downloads",
                "Basic style presets",
                "Limited customization options"
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500"><Check size={12} /></div>
                  {f}
                </div>
              ))}
            </div>
            <Link to="/login" className="w-full py-4 border border-zinc-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 group">
              Subscribe <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-zinc-900/80 border-2 border-[rgba(0,43,31,0.8)] p-10 rounded-[3rem] text-left relative transform lg:scale-105 shadow-2xl shadow-[rgba(0,43,31,0.1)] flex flex-col">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[rgba(0,43,31,0.8)] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-emerald-500/20">Recommended</div>
            <h4 className="text-xl font-bold mb-4 text-emerald-400">Pro</h4>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">Unlock a new level of your personal productivity.</p>
            <div className="mb-8 flex items-end gap-3">
              <span className="text-5xl font-black tracking-tighter">${billingCycle === 'monthly' ? '17' : '150'}</span>
              <div className="mb-1">
                <p className="text-zinc-500 text-sm leading-none"> / month</p>
                <p className="text-emerald-500 text-[10px] font-black uppercase mt-1">-20%</p>
              </div>
            </div>
            <div className="space-y-4 mb-12 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">What's included</p>
              {[
                "Everything in Free",
                "Enigma AI access",
                "Unlimited design generations",
                "Custom Themes",
                "High-resolution exports",
                "Developer Tools"
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white">
                  <div className="w-5 h-5 rounded-full bg-[rgba(0,43,31,0.2)] border border-[rgba(0,43,31,0.4)] flex items-center justify-center text-emerald-500"><Check size={12} strokeWidth={4} /></div>
                  {f}
                </div>
              ))}
            </div>
            <Link to="/login" className="w-full py-4 bg-[rgba(0,43,31,0.8)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[rgba(0,43,31,1)] transition-all shadow-xl shadow-[rgba(0,43,31,0.2)] flex items-center justify-center gap-2 group border border-emerald-500/20">
              Subscribe <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Team Plan */}
          <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] text-left flex flex-col">
            <h4 className="text-xl font-bold mb-4">Team</h4>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Everything you need to supercharge your productivity.</p>
            <div className="mb-8 flex items-end gap-3">
              <span className="text-5xl font-black tracking-tighter">$37</span>
              <div className="mb-1">
                <p className="text-zinc-500 text-sm leading-none"> / month</p>
                <p className="text-emerald-500 text-[10px] font-black uppercase mt-1">-20%</p>
              </div>
            </div>
            <div className="space-y-4 mb-12 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">What's included</p>
              {[
                "Everything in Pro",
                "Unlimited Shared Commands",
                "Unlimited Shared Quicklinks",
                "Priority support"
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500"><Check size={12} /></div>
                  {f}
                </div>
              ))}
            </div>
            <Link to="/login" className="w-full py-4 border border-zinc-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 group">
              Subscribe <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-32 px-6 max-w-4xl mx-auto text-center scroll-mt-24">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
           Frequently Asked<br />Questions
        </h2>
        <p className="text-zinc-400 mb-20 font-medium">
           Got questions? We've got answers. Find everything you need to know about using our platform, plans, and features.
        </p>

        <div className="text-left">
          {[
            { q: "What is this platform used for?", a: "It is an AI-powered design assistant that helps you generate, customize, and export creative assets in seconds-whether for personal projects, brand work, or commercial use." },
            { q: "What happens if I hit my free generation limit?", a: "Once you hit the limit, you can either wait for the next month or upgrade to a Pro plan for unlimited generations and advanced features." },
            { q: "Do I need design experience to use it?", a: "Not at all! Our intuitive interface and AI-driven workflows make it accessible for everyone, from beginners to expert designers." },
            { q: "Can I collaborate with my team?", a: "Yes, the Team plan allows you to share projects, assets, and custom AI instructions across your entire organization." },
            { q: "Is it really free to use?", a: "Absolutely. Our Free tier provides plenty of functionality to get you started without ever needing a credit card." }
          ].map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-20 rounded-[4rem] text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-white/5 mask-radial-faded" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(0,43,31,0.8)] to-transparent opacity-50" />
          
          <h2 className="relative z-10 text-5xl md:text-7xl font-black tracking-tighter mb-8 group-hover:scale-105 transition-transform duration-700">
             Ready to Design Smarter?
          </h2>
          <p className="relative z-10 text-zinc-400 max-w-2xl mx-auto mb-12 text-lg">
             Whether you are a freelancer, a team, or a growing agency-our tools adapt to your workflow. Design faster. Deliver better.
          </p>
          <Link to="/login" className="relative z-10 bg-[rgba(0,43,31,0.8)] hover:bg-[rgba(0,43,31,1)] text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 mx-auto transition-all shadow-2xl shadow-[rgba(0,43,31,0.4)] active:scale-95 border border-emerald-500/20 inline-flex">
            Get Started <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/50 border-t border-white/5 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-6">
            <h4 className="text-2xl font-black tracking-tight uppercase">About Us</h4>
            <p className="text-zinc-500 leading-relaxed">
               We are a team of designers, engineers, and innovators building AI tools that empower anyone to turn imagination into stunning visuals-faster, smarter, and effortlessly.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Useful Links</h4>
            <div className="flex flex-col gap-4 text-zinc-400 font-medium text-sm">
              <button onClick={() => scrollToSection('impact')} className="hover:text-white transition-colors text-left">About</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors text-left">Services</button>
              <button onClick={() => scrollToSection('impact')} className="hover:text-white transition-colors text-left">Team</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors text-left">Prices</button>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Help</h4>
            <div className="flex flex-col gap-4 text-zinc-400 font-medium text-sm">
              <a href="#" className="hover:text-white transition-colors">Customer Support</a>
              <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors text-left">Contact Us</button>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Connect With Us</h4>
            <div className="space-y-4 text-sm text-zinc-400 leading-loose">
              <p>27 Division St, New York, NY 10002, USA</p>
              <p>+123 324 2653</p>
              <p>username@mail.com</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
           <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">(c) 2024 All Right Reserved.</p>
           <div className="flex items-center gap-6">
              <a href="#" className="w-10 h-10 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500 transition-all"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500 transition-all"><Github size={18} /></a>
              <a href="#" className="w-10 h-10 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500 transition-all"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500 transition-all"><Globe size={18} /></a>
           </div>
        </div>
      </footer>
    </div>
  );
};
