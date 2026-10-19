import React, { useState } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';
import { subscribeNewsletter } from '../../apis/nonAuth/newsletter';
import { Check, ArrowRight } from 'lucide-react';

const NewsLetter = () => {
  const {
    content: { common },
  } = useTranslationContext();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setLoading(true);
    setStatusMsg('');
    try {
      const res = await subscribeNewsletter({ email: cleanEmail, source: 'footer' });
      if (res?.success) {
        setSuccessCode(res.discountCode || 'WELCOME15');
        setStatusMsg(res.message || 'Subscribed successfully!');
        setEmail('');
      } else {
        setStatusMsg(res?.message || 'Failed to subscribe.');
      }
    } catch (err) {
      setStatusMsg(err?.response?.data?.message || 'Unable to subscribe right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-between bg-stone-900 text-white py-12 md:flex-row md:items-center md:py-16 px-6 md:px-20 border-t border-stone-800">
      {/* Left */}
      <div className="mb-6 max-w-2xl text-center md:mb-0 md:text-left">
        <h2 className="text-2xl font-serif font-medium tracking-wide sm:text-3xl text-white">
          {common.newsLetterHeading || 'EMAIL NEWSLETTER'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          {common.newsLetterDescription ||
            'Receive exclusive content, product launch invitations, and private seasonal announcements from MMMK WODE.'}
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-col items-center md:items-end w-full md:w-auto">
        {!successCode ? (
          <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="flex-1 rounded-xl border border-stone-700 bg-black/50 px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-[#dfba73] focus:outline-none focus:ring-1 focus:ring-[#dfba73] transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e7cb8c] via-[#dfba73] to-[#cba358] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-black shadow-md hover:brightness-105 transition-all disabled:opacity-60"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
              <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-[#dfba73]/10 border border-[#dfba73]/30 px-4 py-2.5 text-xs text-[#dfba73]">
            <Check size={16} />
            <span>
              {statusMsg} Privilege code: <strong className="font-mono">{successCode}</strong>
            </span>
          </div>
        )}

        {statusMsg && !successCode && (
          <p className="mt-2 text-xs text-rose-400">{statusMsg}</p>
        )}
      </div>
    </div>
  );
};

export default NewsLetter;
