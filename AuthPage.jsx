import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Sparkles, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agentee'
  });
  const { signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.email || !formData.password || (isSignup && !formData.name)) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignup) {
      const { error } = await signUp(formData.email, formData.password, {
        data: {
          name: formData.name,
          role: formData.role
        }
      });
      if(!error) {
          setIsSignup(false);
      }
    } else {
      await signIn(formData.email, formData.password);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Linquic</h1>
            <p className="text-[#bfdbfe]">{isSignup ? 'Create your account' : 'Welcome back'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {isSignup && (
              <div>
                <Label className="text-white mb-2 block">I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({...formData, role: 'agentee'})}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'agentee'
                        ? 'border-purple-400 bg-purple-400/20'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <Zap className="w-6 h-6 mx-auto mb-2 text-white" />
                    <div className="text-sm font-medium text-white">Agentee</div>
                    <div className="text-xs text-white/70">Buyer</div>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({...formData, role: 'agentor'})}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.role === 'agentor'
                        ? 'border-purple-400 bg-purple-400/20'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-white" />
                    <div className="text-sm font-medium text-white">Agentor</div>
                    <div className="text-xs text-white/70">Seller</div>
                  </motion.button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white font-semibold py-3 rounded-xl"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-[#bfdbfe] hover:text-white transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;