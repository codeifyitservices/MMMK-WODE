import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuSparkles,
  LuTrendingUp,
  LuWallet,
  LuGift,
  LuCheckCircle2,
  LuArrowRight,
  LuInstagram,
  LuGlobe,
} from 'react-icons/lu';
import { FaTiktok, FaYoutube } from 'react-icons/fa';
import { message } from 'antd';
import { useTranslationContext } from '../context/TranslationContext';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function InfluencerApplyPage() {
  const { translateLanguage } = useTranslationContext();
  const isRTL = translateLanguage === 'ar';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    niche: 'Luxury Lifestyle & Fashion',
    followerCount: '10K - 50K',
    bio: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    other: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      message.error(isRTL ? 'الرجاء إدخال الاسم الكامل' : 'Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      message.error(isRTL ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email address');
      return;
    }

    if (!formData.instagram && !formData.tiktok && !formData.youtube && !formData.other) {
      message.error(
        isRTL
          ? 'الرجاء تقديم رابط واحد على الأقل لحساب التواصل الاجتماعي'
          : 'Please provide at least one social media link or handle'
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/influencer/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          niche: formData.niche,
          followerCount: formData.followerCount,
          bio: formData.bio,
          socialMedia: {
            instagram: formData.instagram,
            tiktok: formData.tiktok,
            youtube: formData.youtube,
            other: formData.other,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSubmittedEmail(formData.email);
      setSubmitted(true);
      message.success(data.message || 'Application submitted successfully!');
    } catch (err) {
      message.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-neutral-950 text-white selection:bg-[#dfba73] selection:text-black pt-24 pb-20 px-4 sm:px-6 lg:px-8 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center gap-2 text-xs text-neutral-400">
          <Link to="/" className="hover:text-white transition-colors">
            {isRTL ? 'الرئيسية' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#dfba73]">
            {isRTL ? 'برنامج المؤثرين' : 'Influencer Partnership'}
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfba73]/10 border border-[#dfba73]/30 text-[#dfba73] text-xs font-semibold tracking-widest uppercase mb-4">
            <LuSparkles className="w-3.5 h-3.5" />
            <span>{isRTL ? 'مجتمع شركاء MMMK WODE' : 'MMMK WODE Partner Community'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-white mb-4">
            {isRTL
              ? 'انضم إلى مجتمع المؤثرين والشركاء'
              : 'Empower Your Audience in Luxury'}
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-400 leading-relaxed">
            {isRTL
              ? 'شارك منتجاتنا الفاخرة مع متابعيك، وقدم لهم خصمًا حصريًا بنسبة 20٪، واحصل على عمولة بنسبة 10٪ على كل عملية بيع مع سحب شهري مباشر.'
              : 'Collaborate with Dubai’s premier luxury brand. Give your community an exclusive 20% discount on their purchases and earn 10% monthly commissions on every completed order.'}
          </p>
        </div>

        {/* 3 Pillar Value Prop Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <div className="p-5 sm:p-6 rounded-lg bg-neutral-900/60 border border-white/10 hover:border-[#dfba73]/50 transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#dfba73]/10 border border-[#dfba73]/30 flex items-center justify-center text-[#dfba73] mb-4 group-hover:scale-110 transition-transform">
              <LuGift className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1.5">
              {isRTL ? 'خصم 20% لمتابعيك' : '20% Follower Discount'}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {isRTL
                ? 'يحصل عملاؤك تلقائيًا على خصم 20% عند استخدام رابطك الفريد أو رمز الإحالة الخاص بك.'
                : 'Every visitor arriving through your personal link or code automatically unlocks 20% off all catalog items.'}
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-lg bg-neutral-900/60 border border-white/10 hover:border-[#dfba73]/50 transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#dfba73]/10 border border-[#dfba73]/30 flex items-center justify-center text-[#dfba73] mb-4 group-hover:scale-110 transition-transform">
              <LuTrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1.5">
              {isRTL ? 'عمولة 10% على كل طلب' : '10% Sales Commission'}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {isRTL
                ? 'اربح عمولة بنسبة 10٪ تضاف فورًا إلى محفظتك على كل عملية شراء ناجحة من قبل جمهورك.'
                : 'Receive a verified 10% commission credited directly to your partner wallet upon every attributed purchase.'}
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-lg bg-neutral-900/60 border border-white/10 hover:border-[#dfba73]/50 transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#dfba73]/10 border border-[#dfba73]/30 flex items-center justify-center text-[#dfba73] mb-4 group-hover:scale-110 transition-transform">
              <LuWallet className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1.5">
              {isRTL ? 'لوحة تحكم وسحب شهري' : 'Dedicated Portal & Payouts'}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {isRTL
                ? 'تابع النقرات والمبيعات مباشرة عبر لوحة تحكم مخصصة واطلب سحب أرباحك إلى حسابك البنكي شهريًا.'
                : 'Access real-time analytics, generate 1-click product links, and request monthly withdrawals to your bank.'}
            </p>
          </div>
        </div>

        {/* Application Card / Success Card */}
        {submitted ? (
          <div className="p-8 sm:p-12 rounded-xl bg-neutral-900/90 border border-[#dfba73]/40 shadow-2xl text-center max-w-xl mx-auto backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-[#dfba73]/20 border border-[#dfba73] text-[#dfba73] flex items-center justify-center mx-auto mb-6">
              <LuCheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isRTL ? 'تم استلام طلبك بنجاح!' : 'Application Submitted!'}
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed mb-6">
              {isRTL
                ? `شكراً لاهتمامك بالانضمام إلى MMMK WODE. يقوم فريق الشراكات بمراجعة حساباتك وتفاصيل ملفك الشخصي. عند الموافقة، سنرسل بيانات الدخول ورمز الخصم الخاص بك إلى بريدك الإلكتروني:`
                : `Thank you for your interest in joining MMMK WODE. Our partnerships team is reviewing your profile. Once approved, we will send your login credentials, dashboard access, and unique 20% discount code to:`}
            </p>
            <div className="inline-block px-4 py-2 rounded bg-black/60 border border-white/20 text-[#dfba73] font-mono text-sm mb-8">
              {submittedEmail}
            </div>
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold text-sm transition-all"
              >
                <span>{isRTL ? 'العودة للمتجر' : 'Return to Storefront'}</span>
                <LuArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 rounded-xl bg-neutral-900/80 border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="border-b border-white/10 pb-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {isRTL ? 'نموذج التقديم' : 'Influencer Application Form'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                {isRTL
                  ? 'أدخل بياناتك وحساباتك الاجتماعية وسيتواصل معك فريقنا خلال 24 إلى 48 ساعة.'
                  : 'Please complete the details below. Our team reviews all applications within 24–48 hours.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                    {isRTL ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                    {isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. alex@creator.com"
                    className="w-full px-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Phone and Niche */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                    {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+971 50 123 4567"
                    className="w-full px-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                    {isRTL ? 'المجال / التخصص' : 'Content Niche'}
                  </label>
                  <select
                    name="niche"
                    value={formData.niche}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-white/15 text-white text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                  >
                    <option value="Luxury Lifestyle & Fashion">Luxury Lifestyle & Fashion</option>
                    <option value="Perfume & Oud Fragrances">Perfume & Oud Fragrances</option>
                    <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                    <option value="High-End Apparel">High-End Apparel</option>
                    <option value="Other Luxury Goods">Other Luxury Goods</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Follower Range */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                  {isRTL ? 'إجمالي المتابعين' : 'Total Audience / Followers'}
                </label>
                <select
                  name="followerCount"
                  value={formData.followerCount}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-white/15 text-white text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                >
                  <option value="1K - 10K (Nano Creator)">1K - 10K (Nano Creator)</option>
                  <option value="10K - 50K (Micro Influencer)">10K - 50K (Micro Influencer)</option>
                  <option value="50K - 200K (Mid-Tier)">50K - 200K (Mid-Tier)</option>
                  <option value="200K - 1M+ (Macro Creator)">200K - 1M+ (Macro Creator)</option>
                </select>
              </div>

              {/* Social Media Links */}
              <div className="pt-2">
                <label className="block text-xs uppercase tracking-wider text-neutral-300 font-semibold mb-3">
                  {isRTL ? 'حسابات التواصل الاجتماعي (رابط واحد على الأقل) *' : 'Social Media Accounts (At least 1 required) *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-neutral-400">
                      <LuInstagram className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="Instagram @handle or URL"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-neutral-400">
                      <FaTiktok className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="tiktok"
                      value={formData.tiktok}
                      onChange={handleChange}
                      placeholder="TikTok @handle or URL"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-neutral-400">
                      <FaYoutube className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleChange}
                      placeholder="YouTube Channel URL"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-neutral-400">
                      <LuGlobe className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="other"
                      value={formData.other}
                      onChange={handleChange}
                      placeholder="Snapchat, Blog, or Website URL"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Bio / Motivation */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                  {isRTL ? 'نبذة عنك وعن جمهورك' : 'Brief Bio / How You Plan to Promote'}
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us a little about your aesthetic, your audience demographics, and your favorite MMMK WODE products..."
                  className="w-full px-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#dfba73] transition-colors resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                <p className="text-xs text-neutral-500">
                  {isRTL
                    ? 'بإرسال هذا النموذج، فإنك توافق على الشروط والأحكام الخاصة بالشركاء.'
                    : 'By submitting, you agree to our affiliate & partner code of conduct.'}
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 rounded bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {loading
                    ? isRTL
                      ? 'جاري الإرسال...'
                      : 'Submitting...'
                    : isRTL
                    ? 'إرسال طلب الانضمام'
                    : 'Submit Partner Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Member Login Link */}
        <div className="mt-8 text-center text-xs text-neutral-400">
          <span>{isRTL ? 'لديك حساب شريك بالفعل؟' : 'Already an approved partner?'}</span>{' '}
          <Link
            to="/influencer/login"
            className="text-[#dfba73] hover:underline font-semibold ml-1"
          >
            {isRTL ? 'تسجيل الدخول إلى لوحة التحكم' : 'Log in to your Influencer Dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}
