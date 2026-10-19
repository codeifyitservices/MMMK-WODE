import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';
import Banner from '../../components/global/Banner';
import bg from '../../assets/bg.png';

const InfluencerLoginPage = () => {
  const { login, isAuthenticated } = useInfluencerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/influencer/dashboard';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your username/email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(identifier.trim(), password);
      const destination = location.state?.from?.pathname || '/influencer/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to log in. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Banner bg={bg} blurOverlay={true} minHeight={100} className="w-full text-white font-['Poppins',sans-serif] selection:bg-[#dfba73] selection:text-black">
      <div className="min-h-[100vh] flex flex-col justify-between relative z-10">
        {/* Top Navbar */}
        <header className="px-6 sm:px-12 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#dfba73] to-[#8c6d2d] flex items-center justify-center text-black font-extrabold text-base shadow-lg shadow-[#dfba73]/25">
              M
            </div>
            <div>
              <span className="text-base font-bold tracking-wider text-white font-['Belleza']">
                MMMK WODE
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-widest text-[#dfba73] font-semibold border-l border-white/20 pl-2">
                Influencer Portal
              </span>
            </div>
          </Link>

          <a
            href="/"
            className="text-xs text-neutral-300 hover:text-[#dfba73] flex items-center gap-1.5 transition-colors font-medium"
          >
            <span>Storefront</span>
            <ExternalLink size={12} />
          </a>
        </header>

        {/* Main Login Card */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-black/55 backdrop-blur-2xl border border-white/15 rounded-3xl p-7 sm:p-10 shadow-2xl shadow-black/90 relative overflow-hidden">
            {/* Top gold shimmer bar */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfba73] to-transparent" />

            {/* Card Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#dfba73]/15 border border-[#dfba73]/40 text-[#dfba73] text-[11px] font-semibold tracking-widest uppercase mb-3 shadow-sm shadow-[#dfba73]/10">
                <Sparkles size={12} />
                <span>Exclusive Partner Access</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Influencer Sign In
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 mt-2 font-light">
                Access your real-time analytics, trackable links & wallet earnings
              </p>
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Field */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1.5">
                  Username or Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#dfba73]">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. jatin_style or jatin@gmail.com"
                    autoComplete="username"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/15 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#dfba73]">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-11 py-3 bg-black/60 border border-white/15 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-black/60 border-white/20 text-[#dfba73] focus:ring-[#dfba73] focus:ring-offset-0"
                  />
                  <span>Remember session for 30 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#dfba73] via-[#cca154] to-[#8d6f30] text-black font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#dfba73]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-black/80 px-3 text-[10px] uppercase tracking-wider text-neutral-400">
                New to MMMK Influencer Program?
              </span>
            </div>

            {/* Join Call to Action */}
            <div className="text-center">
              <Link
                to="/influencer/apply"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#dfba73] hover:text-[#f3d28f] hover:underline"
              >
                <ShieldCheck size={14} />
                <span>Apply to Become an Official Influencer &rarr;</span>
              </Link>
              <p className="text-[11px] text-neutral-400 mt-1 font-light">
                Earn 10% commission on every customer order you refer
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center text-[11px] text-neutral-400 border-t border-white/10">
          &copy; {new Date().getFullYear()} MMMK WODE LLC. Exclusive Influencer & Affiliate Network.
        </footer>
      </div>
    </Banner>
  );
};

export default InfluencerLoginPage;
