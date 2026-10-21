import { useState, useEffect } from 'react';
import {
  User,
  Share2,
  Building,
  Lock,
  Check,
  AlertCircle,
  Save,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { Input, Button, Select, Tabs, message, Tag } from 'antd';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';
import { changeInfluencerPasswordApi } from '../../apis/influencer/client';

export default function InfluencerProfilePage() {
  const { influencer, updateProfile } = useInfluencerAuth();

  const [activeTab, setActiveTab] = useState('profile');

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
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

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
    try {
      setProfileSaving(true);
      const res = await updateProfile({
        fullName,
        phoneNumber,
        niche,
        bio,
        socialMedia,
      });

      if (res.success) {
        message.success('Profile details saved successfully.');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Save Payout Details
  const handleSavePayoutDetails = async (e) => {
    e.preventDefault();
    try {
      setPayoutSaving(true);
      const res = await updateProfile({
        payoutDetails,
      });

      if (res.success) {
        message.success('Payout & banking details updated.');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Failed to update payout details.');
    } finally {
      setPayoutSaving(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      message.error('Please fill in both current and new password.');
      return;
    }

    if (newPassword.length < 6) {
      message.error('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      message.error('New passwords do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      await changeInfluencerPasswordApi(currentPassword, newPassword);
      message.success('Password successfully changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Partner Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage your personal details, social channels, wire transfer banking info, and security credentials.
        </p>
      </div>

      {/* Clean Tabs */}
      <div className="flex items-center gap-2 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
            activeTab === 'profile'
              ? 'bg-[#dfba73] text-black font-semibold'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <User size={14} />
          <span>Profile & Social</span>
        </button>

        <button
          onClick={() => setActiveTab('payout')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
            activeTab === 'payout'
              ? 'bg-[#dfba73] text-black font-semibold'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Building size={14} />
          <span>Payout & Banking</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
            activeTab === 'security'
              ? 'bg-[#dfba73] text-black font-semibold'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Lock size={14} />
          <span>Security & Password</span>
        </button>
      </div>

      {/* TAB 1: Profile & Social Media */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <User size={16} className="text-[#8d6f30]" />
              <span>Identity & Account Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name / Legal Name
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Jatin Verma"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address (Login Identifier)
                </label>
                <Input
                  value={influencer?.email || ''}
                  disabled
                  size="large"
                  className="bg-gray-50 text-gray-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Contact store support if you need to change your registered email.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username
                </label>
                <Input
                  value={influencer?.username || ''}
                  disabled
                  size="large"
                  className="bg-gray-50 text-gray-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  WhatsApp / Phone Number
                </label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+971 50 123 4567"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Creator Niche
                </label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Luxury Jewelry, Fashion, Lifestyle"
                  size="large"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio / Audience Summary
                </label>
                <Input.TextArea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little bit about your content style and audience..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Social Channels Card */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Share2 size={16} className="text-[#8d6f30]" />
              <span>Social Media Channels & Handles</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Instagram Handle / Profile Link
                </label>
                <Input
                  value={socialMedia.instagram}
                  onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                  placeholder="https://instagram.com/username"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  TikTok Profile Link
                </label>
                <Input
                  value={socialMedia.tiktok}
                  onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
                  placeholder="https://tiktok.com/@username"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  YouTube Channel Link
                </label>
                <Input
                  value={socialMedia.youtube}
                  onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                  placeholder="https://youtube.com/@channel"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Website / Other Link
                </label>
                <Input
                  value={socialMedia.other}
                  onChange={(e) => setSocialMedia({ ...socialMedia, other: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  size="large"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                loading={profileSaving}
                className="bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold border-0 shadow-sm"
              >
                Save Profile Changes
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Payout & Bank Details */}
      {activeTab === 'payout' && (
        <form onSubmit={handleSavePayoutDetails} className="space-y-6">
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Building size={16} className="text-[#8d6f30]" />
              <span>Wire Transfer Banking Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Holder Legal Name
                </label>
                <Input
                  value={payoutDetails.accountHolderName}
                  onChange={(e) =>
                    setPayoutDetails({ ...payoutDetails, accountHolderName: e.target.value })
                  }
                  placeholder="As registered with your bank"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Name
                </label>
                <Input
                  value={payoutDetails.bankName}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
                  placeholder="e.g., Emirates NBD / Abu Dhabi Commercial Bank"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Number
                </label>
                <Input
                  value={payoutDetails.accountNumber}
                  onChange={(e) =>
                    setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })
                  }
                  placeholder="Your bank account number"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  IBAN Number
                </label>
                <Input
                  value={payoutDetails.iban}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, iban: e.target.value })}
                  placeholder="e.g., AE070330000000000000000"
                  size="large"
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  SWIFT / BIC / IFSC Code
                </label>
                <Input
                  value={payoutDetails.swiftCode}
                  onChange={(e) =>
                    setPayoutDetails({ ...payoutDetails, swiftCode: e.target.value })
                  }
                  placeholder="Bank routing swift code"
                  size="large"
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  UPI ID (Optional for India Transfers)
                </label>
                <Input
                  value={payoutDetails.upiId}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, upiId: e.target.value })}
                  placeholder="username@upi"
                  size="large"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                loading={payoutSaving}
                className="bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold border-0 shadow-sm"
              >
                Save Payout Details
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Lock size={16} className="text-[#8d6f30]" />
              <span>Change Portal Password</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Current Password
                </label>
                <Input.Password
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Password
                </label>
                <Input.Password
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  size="large"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input.Password
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  size="large"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordSaving}
                className="bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold border-0 shadow-sm"
              >
                Update Password
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
