import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { Logo } from './Logo';

interface AuthFormProps {
  onSuccess: () => void;
  mode: 'LOGIN' | 'SIGNUP';
  onSwitchMode: (mode: 'LOGIN' | 'SIGNUP') => void;
}

const CAROUSEL_DATA = [
  { fact: "Fungi are genetically more similar to animals than they are to plants.", image: "https://images.unsplash.com/photo-1575487426366-079595af2247?q=80&w=1000&auto=format&fit=crop" },
  { fact: "A single oak tree can support over 2,300 different species.", image: "https://images.unsplash.com/photo-1440557653017-4f6c449c2356?q=80&w=1000&auto=format&fit=crop" },
  { fact: "Octopuses have three hearts and blue blood.", image: "https://images.unsplash.com/photo-1544552866-d3ed42536cfd?q=80&w=1000&auto=format&fit=crop" },
];

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, mode, onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % CAROUSEL_DATA.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'SIGNUP') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created! Please check email.");
        onSwitchMode('LOGIN');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex overflow-hidden bg-[#f9f8f6]">
        {/* Left Section: Form */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center px-6 md:px-24 bg-white/50 backdrop-blur-xl relative z-10 overflow-y-auto scrollbar-hide">
            <div className="w-full max-w-sm mx-auto py-10">
                <div className="mb-10 text-center lg:text-left">
                    <div className="inline-block mb-6 shadow-xl shadow-moss-900/20 rounded-full">
                        <Logo className="w-16 h-16" />
                    </div>
                    <h1 className="font-serif text-4xl font-bold text-stone-900 mb-2">Verdant</h1>
                    <p className="text-stone-500 font-serif italic text-lg">The quiet encyclopedia.</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-stone-200/50 border border-white mb-6">
                    <h2 className="font-serif text-2xl font-bold text-stone-800 mb-6 text-center lg:text-left">
                        {mode === 'LOGIN' ? 'Welcome Back' : 'Begin Journey'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <input 
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                                className="w-full px-5 py-3.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500/20 focus:bg-white transition-all text-stone-800 font-medium placeholder:text-stone-400"
                                placeholder="Email address"
                            />
                        </div>
                        <div className="space-y-1">
                            <input 
                                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                                className="w-full px-5 py-3.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500/20 focus:bg-white transition-all text-stone-800 font-medium placeholder:text-stone-400"
                                placeholder="Password"
                            />
                        </div>
                        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                        <button disabled={loading} className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 active:scale-[0.98] transition-all shadow-lg shadow-stone-900/10 disabled:opacity-50 disabled:scale-100 mt-2">
                            {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Enter' : 'Join')}
                        </button>
                    </form>
                </div>
                
                <div className="text-center">
                    <button 
                        className="text-stone-400 text-sm font-medium hover:text-moss-700 transition-colors px-4 py-2 rounded-lg hover:bg-stone-100" 
                        onClick={() => onSwitchMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                    >
                        {mode === 'LOGIN' ? "Need an account? Sign up" : "Have an account? Log in"}
                    </button>
                </div>
            </div>
        </div>

        {/* Right Section: Carousel (Hidden on Mobile) */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-stone-900 h-full">
             {CAROUSEL_DATA.map((item, i) => (
                 <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
                     <img src={item.image} className="w-full h-full object-cover opacity-60" />
                     <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent"></div>
                 </div>
             ))}
             <div className="absolute bottom-0 left-0 right-0 p-20 z-10">
                 <div className="max-w-xl">
                    <h2 className="font-serif text-4xl md:text-5xl text-white font-bold leading-tight drop-shadow-lg transition-all duration-500 animate-slide-up">
                        "{CAROUSEL_DATA[index].fact}"
                    </h2>
                    <div className="mt-8 flex gap-2">
                        {CAROUSEL_DATA.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                        ))}
                    </div>
                 </div>
             </div>
        </div>
    </div>
  );
};