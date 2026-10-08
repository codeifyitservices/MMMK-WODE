import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, message, Tooltip, Spin } from 'antd';
import {
  Mail,
  Save,
  Send,
  Eye,
  Edit3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import PageTitle from '../../UI/PageTitle';
import {
  getEmailTemplate,
  updateEmailTemplate,
  sendTestEmail,
} from '../../../apis/admin/emailTemplate';

const { TextArea } = Input;

// ─── Live email preview renderer ─────────────────────────────────────────────
function EmailPreview({ subject, customMessage }) {
  const logoUrl = `${import.meta.env.VITE_FRONTEND_URL || 'https://www.mmmkwode.com'}/Wode%20Logo.png`;

  const mockProducts = [
    { name: 'Signature Silk Blouse', sku: 'SILK-BLO-001', qty: 1, price: 'AED 250.00' },
    { name: 'Cashmere Wide-Leg Trousers', sku: 'CSHM-TRS-002', qty: 1, price: 'AED 200.00' },
  ];

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        background: '#f4f0ec',
        padding: '20px',
        minHeight: '100%',
        borderRadius: '6px',
      }}
    >
      {/* Email subject line */}
      <div
        style={{
          background: '#fff',
          padding: '10px 16px',
          borderRadius: '4px 4px 0 0',
          borderBottom: '1px solid #ede8e4',
          marginBottom: '0',
        }}
      >
        <span style={{ fontSize: '11px', color: '#8b5e4b', letterSpacing: '1px' }}>SUBJECT: </span>
        <span style={{ fontSize: '13px', color: '#28120b', fontWeight: 600 }}>
          {subject || 'Your MMMK Wode Order Has Been Confirmed! 🎉'}
        </span>
      </div>

      {/* Email card */}
      <div
        style={{
          background: '#ffffff',
          maxWidth: '560px',
          margin: '0 auto',
          boxShadow: '0 4px 24px rgba(40,18,11,0.10)',
          borderRadius: '0 0 4px 4px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ background: '#28120b', padding: '28px 32px', textAlign: 'center' }}>
          <img
            src={logoUrl}
            alt="MMMK Wode"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            style={{ height: '52px', maxWidth: '180px', display: 'block', margin: '0 auto' }}
          />
          <div
            style={{
              display: 'none',
              fontFamily: 'Georgia, serif',
              fontSize: '24px',
              color: '#ded7d1',
              letterSpacing: '4px',
            }}
          >
            MMMK WODE
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '10px', letterSpacing: '3px', color: '#8b5e4b', textTransform: 'uppercase' }}>
            Luxury Fashion
          </p>
        </div>

        {/* Confirmation badge */}
        <div style={{ background: '#3d1e10', padding: '20px 32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              background: '#635d4a', borderRadius: '50%', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: '#e6ffcc', fontSize: '18px', lineHeight: 1 }}>✓</span>
            </div>
            <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 400, color: '#f9f5f2', letterSpacing: '1px' }}>
              Order Confirmed
            </h2>
          </div>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#8b5e4b', letterSpacing: '1px' }}>ORDER NUMBER</p>
          <p style={{ margin: '0 0 8px', fontFamily: 'Georgia, serif', fontSize: '16px', color: '#ded7d1', letterSpacing: '2px' }}>
            #TEST-ORDER-2025
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#8b5e4b' }}>
            Placed on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 0' }}>
          {/* Greeting */}
          <p style={{ margin: '0 0 10px', fontFamily: 'Georgia, serif', fontSize: '16px', color: '#28120b' }}>
            Dear Jane Doe,
          </p>

          {/* Custom message */}
          <div
            style={{ fontSize: '13px', lineHeight: '1.8', color: '#635d4a', marginBottom: '24px' }}
            dangerouslySetInnerHTML={{
              __html: customMessage || 'Thank you for your order! We are thrilled to have you as part of the MMMK Wode family.',
            }}
          />

          <div style={{ borderTop: '1px solid #ede8e4', marginBottom: '20px' }} />

          {/* Items label */}
          <h3 style={{ margin: '0 0 14px', fontFamily: 'Georgia, serif', fontSize: '12px', fontWeight: 400, color: '#8b5e4b', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Your Items
          </h3>

          {/* Products */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #ece8e4' }}>
            <tbody>
              {mockProducts.map((p) => (
                <tr key={p.sku}>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #ece8e4', width: '72px', verticalAlign: 'top' }}>
                    <div style={{ width: '64px', height: '64px', background: '#ded7d1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '9px', color: '#635d4a', textAlign: 'center', lineHeight: 1.3 }}>Sample<br/>Image</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #ece8e4', verticalAlign: 'top' }}>
                    <p style={{ margin: '0 0 3px', fontFamily: 'Georgia, serif', fontSize: '13px', color: '#28120b', fontWeight: 600 }}>{p.name}</p>
                    <p style={{ margin: '0 0 3px', fontSize: '11px', color: '#8b5e4b' }}>SKU: {p.sku}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#635d4a' }}>Qty: {p.qty}</p>
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #ece8e4', verticalAlign: 'top', textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#28120b' }}>{p.price}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #ede8e4', margin: '20px 0 18px' }} />

          {/* Summary */}
          <h3 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', fontSize: '12px', fontWeight: 400, color: '#8b5e4b', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Order Summary
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <tbody>
              {[
                ['Subtotal', 'AED 450.00'],
                ['Shipping', 'AED 30.00'],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '4px 0', fontSize: '12px', color: '#635d4a' }}>{label}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontSize: '12px', color: '#635d4a' }}>{val}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '10px 0 4px', borderTop: '1px solid #28120b', fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: 700, color: '#28120b' }}>Total</td>
                <td style={{ padding: '10px 0 4px', borderTop: '1px solid #28120b', textAlign: 'right', fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: 700, color: '#28120b' }}>AED 480.00</td>
              </tr>
            </tbody>
          </table>

          {/* Shipping + Payment */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '0' }}>
            <div style={{ flex: 1, background: '#f9f5f2', border: '1px solid #ede8e4', borderRadius: '4px', padding: '14px' }}>
              <p style={{ margin: '0 0 5px', fontSize: '10px', letterSpacing: '2px', color: '#8b5e4b', textTransform: 'uppercase' }}>Payment</p>
              <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#28120b', fontWeight: 600 }}>COD</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#635d4a' }}>Status: Pending</p>
            </div>
            <div style={{ flex: 1, background: '#f9f5f2', border: '1px solid #ede8e4', borderRadius: '4px', padding: '14px' }}>
              <p style={{ margin: '0 0 5px', fontSize: '10px', letterSpacing: '2px', color: '#8b5e4b', textTransform: 'uppercase' }}>Shipping To</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#28120b', lineHeight: 1.7 }}>
                Jane Doe<br />123 Luxury Lane<br />Dubai, United Arab Emirates
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#28120b', padding: '24px 32px', textAlign: 'center', marginTop: '24px' }}>
          <p style={{ margin: '0 0 6px', fontFamily: 'Georgia, serif', fontSize: '14px', color: '#ded7d1', letterSpacing: '1px' }}>
            Thank you for choosing MMMK Wode
          </p>
          <p style={{ margin: '0 0 14px', fontSize: '11px', color: '#8b5e4b', lineHeight: 1.7 }}>
            Questions? Contact our support team.
          </p>
          <div style={{ borderTop: '1px solid #3d1e10', paddingTop: '14px' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#635d4a', letterSpacing: '1px' }}>
              © {new Date().getFullYear()} MMMK Wode · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
const EmailTemplatePage = () => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ subject: '', customMessage: '' });
  const [testEmail, setTestEmail] = useState('');
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [isDirty, setIsDirty] = useState(false);

  // Fetch template
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['emailTemplate'],
    queryFn: getEmailTemplate,
  });

  useEffect(() => {
    if (data?.data) {
      setForm({
        subject: data.data.subject || '',
        customMessage: data.data.customMessage || '',
      });
      setIsDirty(false);
    }
  }, [data]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: updateEmailTemplate,
    onSuccess: () => {
      message.success('Email template saved successfully!');
      setIsDirty(false);
      queryClient.invalidateQueries(['emailTemplate']);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to save template');
    },
  });

  // Send test mutation
  const testMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (res) => {
      message.success(res?.message || 'Test email sent!');
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to send test email');
    },
  });

  const handleSave = () => {
    if (!form.subject.trim()) {
      message.warning('Subject line cannot be empty');
      return;
    }
    saveMutation.mutate(form);
  };

  const handleSendTest = () => {
    if (!testEmail.trim()) {
      message.warning('Please enter a recipient email address');
      return;
    }
    testMutation.mutate({ email: testEmail.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Email Template" />

      <div className="space-y-4">

        {/* ── Status bar ── */}
        <div className="flex items-center justify-between bg-white rounded-lg px-5 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-amber-700" />
            <span className="text-sm font-medium text-gray-700">Order Confirmation Email</span>
            {isDirty && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title="Refresh">
              <Button
                size="small"
                icon={<RefreshCw size={13} />}
                onClick={() => refetch()}
                className="flex items-center gap-1"
              />
            </Tooltip>
            <Button
              size="small"
              icon={<Save size={13} />}
              type="primary"
              loading={saveMutation.isPending}
              onClick={handleSave}
              disabled={!isDirty}
              className="flex items-center gap-1"
              style={{ background: isDirty ? '#28120b' : undefined, borderColor: isDirty ? '#28120b' : undefined }}
            >
              Save
            </Button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* LEFT: Editor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 xl:hidden">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'edit'
                    ? 'border-b-2 border-amber-900 text-amber-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'border-b-2 border-amber-900 text-amber-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye size={14} /> Preview
              </button>
            </div>

            <div className={`p-5 space-y-5 ${activeTab === 'preview' ? 'hidden xl:block' : ''}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                <Edit3 size={15} className="text-amber-800" />
                <h3 className="text-sm font-semibold text-gray-800 m-0">Template Editor</h3>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Email Subject Line
                </label>
                <Input
                  id="email-subject-input"
                  value={form.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="Your MMMK Wode Order Has Been Confirmed! 🎉"
                  size="large"
                  style={{ borderColor: '#ded7d1', borderRadius: '6px' }}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  This appears as the email subject in the recipient's inbox.
                </p>
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Custom Message
                </label>
                <TextArea
                  id="email-custom-message-textarea"
                  value={form.customMessage}
                  onChange={(e) => handleChange('customMessage', e.target.value)}
                  placeholder="Write a personalised message to your customers here…"
                  rows={8}
                  style={{ borderColor: '#ded7d1', borderRadius: '6px', resize: 'vertical' }}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Supports basic HTML tags (e.g. <code className="text-xs bg-gray-100 px-1 rounded">&lt;b&gt;</code>, <code className="text-xs bg-gray-100 px-1 rounded">&lt;a href&gt;</code>, <code className="text-xs bg-gray-100 px-1 rounded">&lt;br/&gt;</code>).
                  This message appears below the customer greeting in every order confirmation email.
                </p>
              </div>

              {/* ── What's in the email info box ── */}
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide m-0">
                  What's included in every email
                </p>
                <ul className="text-xs text-amber-700 space-y-1 m-0 pl-4 list-disc">
                  <li>MMMK Wode brand logo & header</li>
                  <li>Order ID and placement date</li>
                  <li>Your custom message above (editable)</li>
                  <li>Product image, name, SKU, quantity & price</li>
                  <li>Order total breakdown (subtotal, shipping, discounts)</li>
                  <li>Shipping address & payment method</li>
                  <li>Brand footer</li>
                </ul>
              </div>

              {/* ── Save button ── */}
              <Button
                id="save-email-template-btn"
                type="primary"
                icon={<Save size={14} />}
                loading={saveMutation.isPending}
                onClick={handleSave}
                disabled={!isDirty}
                block
                size="large"
                style={{
                  background: isDirty ? '#28120b' : '#9e9e9e',
                  borderColor: isDirty ? '#28120b' : '#9e9e9e',
                  borderRadius: '6px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isDirty ? 'Save Changes' : 'No Changes to Save'}
              </Button>
            </div>
          </div>

          {/* RIGHT: Preview + Test */}
          <div className={`space-y-4 ${activeTab === 'edit' ? 'hidden xl:block' : ''}`}>

            {/* Preview panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-amber-800" />
                  <h3 className="text-sm font-semibold text-gray-800 m-0">Live Preview</h3>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  Sample data
                </span>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '640px' }}>
                <EmailPreview subject={form.subject} customMessage={form.customMessage} />
              </div>
            </div>

            {/* Send test email panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                <Send size={15} className="text-amber-800" />
                <h3 className="text-sm font-semibold text-gray-800 m-0">Send Test Email</h3>
              </div>
              <p className="text-xs text-gray-500 m-0">
                Send a preview of this email (with sample order data) to any address to check how it looks in a real inbox.
              </p>
              <div className="flex gap-2">
                <Input
                  id="test-email-input"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  size="middle"
                  onPressEnter={handleSendTest}
                  style={{ borderColor: '#ded7d1', borderRadius: '6px' }}
                  className="flex-1"
                />
                <Button
                  id="send-test-email-btn"
                  type="default"
                  icon={<Send size={13} />}
                  loading={testMutation.isPending}
                  onClick={handleSendTest}
                  style={{
                    borderColor: '#28120b',
                    color: '#28120b',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Send Test
                </Button>
              </div>
              {testMutation.isSuccess && (
                <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 border border-green-100 rounded-lg p-3">
                  <CheckCircle size={13} />
                  Test email sent successfully! Check your inbox.
                </div>
              )}
              {testMutation.isError && (
                <div className="flex items-center gap-2 text-red-700 text-xs bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle size={13} />
                  {testMutation.error?.response?.data?.message || 'Failed to send test email.'}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default EmailTemplatePage;
