import { useState } from 'react';
import { Modal, message } from 'antd';
import { LuSparkles, LuCheckCircle2, LuInstagram, LuGlobe } from 'react-icons/lu';
import { FaTiktok, FaYoutube } from 'react-icons/fa';
import { useTranslationContext } from '../../context/TranslationContext';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function InfluencerApplyModal({ isOpen, onClose }) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
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
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        headers: { 'Content-Type': 'application/json' },
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

      setSubmitted(true);
      message.success(data.message || 'Application submitted successfully!');
    } catch (err) {
      message.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={700}
      centered
      className="influencer-apply-modal"
      styles={{
        content: {
          backgroundColor: '#09090c',
          color: '#ffffff',
          border: '1px solid rgba(223, 186, 115, 0.25)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 50px rgba(223, 186, 115, 0.08)',
          backgroundImage: 'radial-gradient(ellipse at top, rgba(223, 186, 115, 0.12), transparent 70%)',
        },
        mask: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
        },
      }}
    >
      <div className={`text-white ${isRTL ? 'rtl' : 'ltr'}`}>
        {submitted ? (
          <div className="py-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#dfba73]/20 border border-[#dfba73] text-[#dfba73] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#dfba73]/20">
              <LuCheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">
              {isRTL ? 'تم استلام طلبك بنجاح!' : 'Application Submitted!'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed mb-6 font-light">
              {isRTL
                ? 'شكراً لاهتمامك بالانضمام إلى MMMK WODE. سنقوم بمراجعة طلبك وإرسال بيانات تسجيل الدخول ورمز الخصم الخاص بك عبر البريد الإلكتروني فور الموافقة.'
                : 'Thank you for your interest! We are reviewing your application and will email your unique referral code and login credentials upon approval.'}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#dfba73] via-[#cca154] to-[#8d6f30] hover:brightness-110 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#dfba73]/20"
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-[#dfba73] text-[10px] font-semibold uppercase tracking-widest mb-1.5">
              <LuSparkles className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>{isRTL ? 'برنامج الشركاء الحصري' : 'EXCLUSIVE PARTNER PROGRAM'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1.5">
              {isRTL ? 'انضم إلى مجتمع المؤثرين' : 'Apply to Join the Influencer Community'}
            </h2>
            <p className="text-xs text-neutral-400 mb-6 font-light">
              {isRTL
                ? 'قدم لمتابعيك خصمًا حصريًا بنسبة 20% واحصل على عمولة بنسبة 10% على كل عملية بيع.'
                : 'Offer your audience 20% off all products and earn 10% monthly commission on every sale.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1.5">
                    {isRTL ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1.5">
                    {isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="creator@email.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1.5">
                    {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+971..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1.5">
                    {isRTL ? 'المجال / التخصص' : 'Niche'}
                  </label>
                  <select
                    name="niche"
                    value={formData.niche}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-900 border border-white/15 text-white text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                  >
                    <option value="Luxury Lifestyle & Fashion">Luxury Lifestyle & Fashion</option>
                    <option value="Perfume & Oud Fragrances">Perfume & Oud Fragrances</option>
                    <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                    <option value="High-End Apparel">High-End Apparel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-200 font-semibold mb-2">
                  {isRTL ? 'حسابات التواصل الاجتماعي (رابط واحد على الأقل) *' : 'Social Profiles (At least 1 required) *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[#dfba73]">
                      <LuInstagram className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="Instagram @handle or URL"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[#dfba73]">
                      <FaTiktok className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      name="tiktok"
                      value={formData.tiktok}
                      onChange={handleChange}
                      placeholder="TikTok @handle or URL"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[#dfba73]">
                      <FaYoutube className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleChange}
                      placeholder="YouTube channel URL"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[#dfba73]">
                      <LuGlobe className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      name="other"
                      value={formData.other}
                      onChange={handleChange}
                      placeholder="Other profile / website"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1.5">
                  {isRTL ? 'نبذة قصيرة' : 'Brief Bio / Notes'}
                </label>
                <textarea
                  name="bio"
                  rows={2}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us briefly about your audience..."
                  className="w-full px-3.5 py-2 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]/40 transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#dfba73] via-[#cca154] to-[#8d6f30] hover:brightness-110 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#dfba73]/20 disabled:opacity-50"
                >
                  {loading
                    ? isRTL
                      ? 'جاري الإرسال...'
                      : 'Submitting...'
                    : isRTL
                    ? 'إرسال الطلب'
                    : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}
