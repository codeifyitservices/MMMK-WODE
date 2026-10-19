import React, { useState, useEffect } from 'react';
import {
  User,
  Share2,
  Building,
  Lock,
  Check,
  AlertCircle,
  Save,
  ShieldCheck,
  Sparkles,
  Instagram,
  Youtube,
  Globe,
} from 'lucide-react';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';
import { changeInfluencerPasswordApi } from '../../apis/influencer/client';

const InfluencerProfilePage = () => {
  const { influencer, updateProfile, refreshProfile } = useInfluencerAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'payout', 'security'

  // Profile Information State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [niche, setNiche] = useState('');
  const [bio, setBio] = useState('');

  // Social Media State
  const [socialMedia, setSocialMedia] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    facebook: '',
    other: '',
  });

  // Payout Details State
  const [payoutDetails, setPayoutDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    branchCity: '',
    upiId: '',
    paypalEmail: '',
    payoutMethod: 'BankTransfer',
  });

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback State
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState({ type: '', text: '' });

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Hydrate fields from influencer auth
  useEffect(() => {
    if (influencer) {
      setFullName(influencer.fullName || '');
      setPhoneNumber(influencer.phoneNumber || '');
      setNiche(influencer.niche || '');
      setBio(influencer.bio || '');

      if (influencer.socialMedia) {
        setSocialMedia({
          instagram: influencer.socialMedia.instagram || '',
          tiktok: influencer.socialMedia.tiktok || '',
          youtube: influencer.socialMedia.youtube || '',
          facebook: influencer.socialMedia.facebook || '',
          other: influencer.socialMedia.other || '',
        });
      }

      if (influencer.payoutDetails) {
        setPayoutDetails({
          accountHolderName: influencer.payoutDetails.accountHolderName || '',
          bankName: influencer.payoutDetails.bankName || '',
          accountNumber: influencer.payoutDetails.accountNumber || '',
          iban: influencer.payoutDetails.iban || '',
          swiftCode: influencer.payoutDetails.swiftCode || '',
          branchCity: influencer.payoutDetails.branchCity || '',
          upiId: influencer.payoutDetails.upiId || '',
          paypalEmail: influencer.payoutDetails.paypalEmail || '',
          payoutMethod: influencer.payoutDetails.payoutMethod || 'BankTransfer',
        });
      }
    }
  }, [influencer]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    try {
      setProfileSaving(true);
      await updateProfile({
        fullName,
        phoneNumber,
        niche,
        bio,
        socialMedia,
      });
      setProfileMessage({ type: 'success', text: 'Profile details saved successfully.' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to update profile.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Save Banking / Payout
  const handleSavePayout = async (e) => {
    e.preventDefault();
    setPayoutMessage({ type: '', text: '' });

    try {
      setPayoutSaving(true);
      await updateProfile({
        payoutDetails,
      });
      setPayoutMessage({ type: 'success', text: 'Payout & banking information updated successfully.' });
      setTimeout(() => setPayoutMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setPayoutMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to update payout details.',
      });
    } finally {
      setPayoutSaving(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in both current and new password.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordSaving(true);
      await changeInfluencerPasswordApi(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password successfully changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to change password.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-['Poppins',sans-serif]">
      {/* Header */}
      <div className="pb-2 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Influencer Profile & Settings</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage your social links, banking details for commission disbursements, and security credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-[#dfba73] text-black font-semibold shadow-md shadow-[#dfba73]/15'
              : 'bg-[#121217] text-gray-400 hover:text-white'
          }`}
        >
          <User size={14} />
          <span>Profile & Social</span>
        </button>

        <button
          onClick={() => setActiveTab('payout')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'payout'
              ? 'bg-[#dfba73] text-black font-semibold shadow-md shadow-[#dfba73]/15'
              : 'bg-[#121217] text-gray-400 hover:text-white'
          }`}
        >
          <Building size={14} />
          <span>Payout & Bank Details</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'security'
              ? 'bg-[#dfba73] text-black font-semibold shadow-md shadow-[#dfba73]/15'
              : 'bg-[#121217] text-gray-400 hover:text-white'
          }`}
        >
          <Lock size={14} />
          <span>Security & Password</span>
        </button>
      </div>

      {/* TAB 1: Profile & Social Media */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-white/5">
              <User size={16} className="text-[#dfba73]" />
              <span>Identity & Account Details</span>
            </h3>

            {profileMessage.text && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <Check size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Username (Fixed)
                </label>
                <input
                  type="text"
                  value={influencer?.username || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[#121217] border border-white/5 rounded-xl text-gray-500 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Email Address (Fixed)
                </label>
                <input
                  type="email"
                  value={influencer?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[#121217] border border-white/5 rounded-xl text-gray-500 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Primary Niche
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Luxury Fragrances, Lifestyle, Fashion"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Assigned Referral Code
                </label>
                <input
                  type="text"
                  value={influencer?.referralCode || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[#121217] border border-white/5 rounded-xl text-[#dfba73] font-mono font-bold text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1 text-xs">
                Bio / Introduction
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief description of your content and channels..."
                className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
              />
            </div>
          </div>

          {/* Social Links Card */}
          <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-white/5">
              <Share2 size={16} className="text-[#dfba73]" />
              <span>Social Media Accounts & Links</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Instagram Profile</label>
                <input
                  type="text"
                  value={socialMedia.instagram}
                  onChange={(e) =>
                    setSocialMedia({ ...socialMedia, instagram: e.target.value })
                  }
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">TikTok Profile</label>
                <input
                  type="text"
                  value={socialMedia.tiktok}
                  onChange={(e) =>
                    setSocialMedia({ ...socialMedia, tiktok: e.target.value })
                  }
                  placeholder="https://tiktok.com/@yourhandle"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">YouTube Channel</label>
                <input
                  type="text"
                  value={socialMedia.youtube}
                  onChange={(e) =>
                    setSocialMedia({ ...socialMedia, youtube: e.target.value })
                  }
                  placeholder="https://youtube.com/@channel"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Other / Blog / Website</label>
                <input
                  type="text"
                  value={socialMedia.other}
                  onChange={(e) =>
                    setSocialMedia({ ...socialMedia, other: e.target.value })
                  }
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 rounded-xl bg-[#dfba73] hover:bg-[#caa055] text-black font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save size={14} />
                <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Payout & Bank Details */}
      {activeTab === 'payout' && (
        <form onSubmit={handleSavePayout} className="space-y-6">
          <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building size={16} className="text-[#dfba73]" />
                <span>Banking & Disbursement Information</span>
              </h3>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-400" />
                256-bit Encrypted
              </span>
            </div>

            {payoutMessage.text && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  payoutMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {payoutMessage.type === 'success' ? (
                  <Check size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{payoutMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Default Payout Method
                </label>
                <select
                  value={payoutDetails.payoutMethod}
                  onChange={(e) =>
                    setPayoutDetails({ ...payoutDetails, payoutMethod: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                >
                  <option value="BankTransfer">Bank Wire / Transfer (UAE & Global)</option>
                  <option value="UPI">UPI (India)</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Account Holder Full Legal Name
                </label>
                <input
                  type="text"
                  value={payoutDetails.accountHolderName}
                  onChange={(e) =>
                    setPayoutDetails({
                      ...payoutDetails,
                      accountHolderName: e.target.value,
                    })
                  }
                  placeholder="As registered with your bank"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={payoutDetails.bankName}
                  onChange={(e) =>
                    setPayoutDetails({ ...payoutDetails, bankName: e.target.value })
                  }
                  placeholder="e.g. Emirates NBD, ADCB, HDFC Bank"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Account Number / IBAN
                </label>
                <input
                  type="text"
                  value={payoutDetails.accountNumber}
                  onChange={(e) =>
                    setPayoutDetails({
                      ...payoutDetails,
                      accountNumber: e.target.value,
                    })
                  }
                  placeholder="AE07 0331 2345 6789 012"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  SWIFT / BIC / IFSC Code
                </label>
                <input
                  type="text"
                  value={payoutDetails.swiftCode}
                  onChange={(e) =>
                    setPayoutDetails({ ...payoutDetails, swiftCode: e.target.value })
                  }
                  placeholder="e.g. EBILAEADXXX"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Branch / City / Country
                </label>
                <input
                  type="text"
                  value={payoutDetails.branchCity}
                  onChange={(e) =>
                    setPayoutDetails({
                      ...payoutDetails,
                      branchCity: e.target.value,
                    })
                  }
                  placeholder="e.g. Dubai, United Arab Emirates"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={payoutDetails.upiId}
                  onChange={(e) =>
                    setPayoutDetails({ ...payoutDetails, upiId: e.target.value })
                  }
                  placeholder="username@okhdfcbank"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  PayPal Email (Optional)
                </label>
                <input
                  type="email"
                  value={payoutDetails.paypalEmail}
                  onChange={(e) =>
                    setPayoutDetails({
                      ...payoutDetails,
                      paypalEmail: e.target.value,
                    })
                  }
                  placeholder="paypal@yourdomain.com"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={payoutSaving}
                className="px-6 py-2.5 rounded-xl bg-[#dfba73] hover:bg-[#caa055] text-black font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save size={14} />
                <span>{payoutSaving ? 'Saving...' : 'Save Payout Details'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-white/5">
              <Lock size={16} className="text-[#dfba73]" />
              <span>Change Portal Password</span>
            </h3>

            {passwordMessage.text && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <Check size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-2.5 rounded-xl bg-[#dfba73] hover:bg-[#caa055] text-black font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save size={14} />
                <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default InfluencerProfilePage;
