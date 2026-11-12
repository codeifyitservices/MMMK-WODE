import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Button, Input, message, Spin, Tooltip } from 'antd';
import {
  getSeoSettingsAdmin,
  updateSeoSettingsAdmin,
  generateSeoSchemaAdmin,
} from '../../../apis/admin/seoAdmin';
import SchemaEditor from './SchemaEditor';

const { TextArea } = Input;

const emptySocialLink = () => ({ platform: '', url: '' });

export default function SeoSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSchema, setGeneratingSchema] = useState(false);

  const [formData, setFormData] = useState({
    websiteName: 'MMMK WODE',
    websiteUrl: 'https://mmmk-wode.com',
    organizationName: 'MMMK WODE',
    organizationDescription:
      'Luxury jewelry, fragrance, swimwear, and curated fashion collections.',
    logo: '',
    contactEmail: 'contact@mmmk-wode.com',
    contactPhone: '',
    socialMediaLinks: [emptySocialLink()],
    seoSchema: '',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSeoSettingsAdmin();
      if (res?.success && res?.settings) {
        setFormData({
          websiteName: res.settings.websiteName || 'MMMK WODE',
          websiteUrl: res.settings.websiteUrl || 'https://mmmk-wode.com',
          organizationName: res.settings.organizationName || 'MMMK WODE',
          organizationDescription: res.settings.organizationDescription || '',
          logo: res.settings.logo || '',
          contactEmail: res.settings.contactEmail || '',
          contactPhone: res.settings.contactPhone || '',
          socialMediaLinks:
            Array.isArray(res.settings.socialMediaLinks) &&
            res.settings.socialMediaLinks.length > 0
              ? res.settings.socialMediaLinks
              : [emptySocialLink()],
          seoSchema: res.settings.seoSchema || '',
        });
      }
    } catch (err) {
      console.error('Failed to load SEO settings:', err);
      message.error('Failed to load SEO settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.socialMediaLinks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, socialMediaLinks: updated };
    });
  };

  const handleAddSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      socialMediaLinks: [...prev.socialMediaLinks, emptySocialLink()],
    }));
  };

  const handleRemoveSocialLink = (index) => {
    setFormData((prev) => {
      const updated = prev.socialMediaLinks.filter((_, i) => i !== index);
      return {
        ...prev,
        socialMediaLinks: updated.length ? updated : [emptySocialLink()],
      };
    });
  };

  const handleGenerateSchema = async () => {
    try {
      setGeneratingSchema(true);
      const res = await generateSeoSchemaAdmin(formData);
      if (res?.success && res?.schema) {
        setFormData((prev) => ({ ...prev, seoSchema: res.schema }));
        message.success('Global schema generated successfully!');
      }
    } catch (err) {
      console.error('Failed to generate schema:', err);
      message.error('Failed to generate schema.');
    } finally {
      setGeneratingSchema(false);
    }
  };

  const handleResetToAuto = async () => {
    handleGenerateSchema();
  };

  const handleSave = async () => {
    if (formData.seoSchema && formData.seoSchema.trim()) {
      try {
        JSON.parse(formData.seoSchema);
      } catch (e) {
        message.error('Schema has invalid JSON syntax. Please correct it before saving.');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await updateSeoSettingsAdmin(formData);
      if (res?.success) {
        message.success('SEO settings saved successfully!');
        if (res.settings) {
          setFormData((prev) => ({
            ...prev,
            ...res.settings,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to save SEO settings:', err);
      message.error(err?.response?.data?.message || 'Failed to save SEO settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Loading SEO settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>SEO Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <span>Manage global website, organization, and structured data defaults</span>
          </p>
        </div>

        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          icon={<Save size={16} />}
          className="bg-black hover:bg-neutral-800 text-white font-medium h-10 px-5 rounded-lg border-0 shadow-sm flex items-center gap-2"
        >
          Save Changes
        </Button>
      </div>

      {/* Global SEO Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Globe size={18} className="text-gray-700" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
            Global SEO
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Website Name
            </label>
            <Input
              value={formData.websiteName}
              onChange={(e) => handleChange('websiteName', e.target.value)}
              placeholder="e.g. MMMK WODE"
              className="h-10 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Website URL
            </label>
            <Input
              value={formData.websiteUrl}
              onChange={(e) => handleChange('websiteUrl', e.target.value)}
              placeholder="https://mmmk-wode.com"
              className="h-10 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Organization Name
            </label>
            <Input
              value={formData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              placeholder="e.g. MMMK WODE Luxury"
              className="h-10 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Logo URL
            </label>
            <Input
              value={formData.logo}
              onChange={(e) => handleChange('logo', e.target.value)}
              placeholder="https://mmmk-wode.com/Wode%20Logo.png"
              className="h-10 rounded-lg text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Organization Description
            </label>
            <TextArea
              rows={3}
              value={formData.organizationDescription}
              onChange={(e) => handleChange('organizationDescription', e.target.value)}
              placeholder="Concise overview of your luxury fashion and lifestyle brand for search engines."
              className="rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Contact Email
            </label>
            <Input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="contact@mmmk-wode.com"
              className="h-10 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Contact Phone
            </label>
            <Input
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="+971 50 123 4567"
              className="h-10 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Social Media Links Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
            Social Media Links
          </h2>
          <Button
            type="primary"
            onClick={handleAddSocialLink}
            icon={<Plus size={14} />}
            className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold h-8 px-3 rounded-md border-0 flex items-center gap-1"
          >
            Add Link
          </Button>
        </div>

        <div className="space-y-3">
          {formData.socialMediaLinks.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <Input
                placeholder="Platform (e.g. Instagram)"
                value={item.platform}
                onChange={(e) => handleSocialChange(idx, 'platform', e.target.value)}
                className="w-1/3 h-10 rounded-lg text-sm"
              />
              <Input
                placeholder="https://instagram.com/mmmk_wode"
                value={item.url}
                onChange={(e) => handleSocialChange(idx, 'url', e.target.value)}
                className="flex-1 h-10 rounded-lg text-sm"
              />
              <Button
                type="text"
                danger
                onClick={() => handleRemoveSocialLink(idx)}
                icon={<Trash2 size={16} />}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-red-50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Schema Generator Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
              Schema (JSON-LD)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Saved custom schema is used on the storefront until you regenerate or reset it.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateSchema}
              loading={generatingSchema}
              icon={<Sparkles size={14} />}
              className="text-xs font-semibold h-8 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 border-0 flex items-center gap-1.5"
            >
              Generate Schema
            </Button>
            <Button
              onClick={handleResetToAuto}
              icon={<RotateCcw size={14} />}
              className="text-xs font-medium h-8 rounded-md border-gray-300 text-gray-700 hover:text-black flex items-center gap-1.5"
            >
              Reset to Auto
            </Button>
          </div>
        </div>

        <SchemaEditor
          value={formData.seoSchema}
          onChange={(val) => handleChange('seoSchema', val)}
          rows={14}
        />
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          icon={<Save size={16} />}
          className="bg-black hover:bg-neutral-800 text-white font-medium h-11 px-7 rounded-lg border-0 shadow-md flex items-center gap-2 text-sm"
        >
          Save All SEO Settings
        </Button>
      </div>
    </div>
  );
}

