import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Input, Select, Button, message, Spin } from 'antd';
import {
  FileText,
  Globe,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {
  createPageAdmin,
  updatePageAdmin,
  generatePageSchemaAdmin,
} from '../../../apis/admin/pagesAdmin';
import SchemaEditor from './SchemaEditor';

const { TextArea } = Input;

const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function StaticPageModal({
  open,
  onClose,
  pageData,
  onSuccess,
}) {
  const isEdit = Boolean(pageData?._id);
  const [activeTab, setActiveTab] = useState('content');
  const [submitting, setSubmitting] = useState(false);
  const [generatingSchema, setGeneratingSchema] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'Published',
    footerPlacement: 'none',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    seoSchema: '',
  });

  useEffect(() => {
    if (pageData) {
      setFormData({
        title: pageData.title || '',
        slug: pageData.slug || '',
        content: pageData.content || '',
        status: pageData.status || 'Published',
        footerPlacement: pageData.footerPlacement || 'none',
        metaTitle: pageData.metaTitle || pageData.title || '',
        metaDescription: pageData.metaDescription || '',
        metaKeywords: pageData.metaKeywords || '',
        canonicalUrl: pageData.canonicalUrl || '',
        ogTitle: pageData.ogTitle || pageData.metaTitle || pageData.title || '',
        ogDescription: pageData.ogDescription || pageData.metaDescription || '',
        ogImage: pageData.ogImage || '',
        seoSchema: pageData.seoSchema || '',
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        content: '',
        status: 'Published',
        footerPlacement: 'none',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        canonicalUrl: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        seoSchema: '',
      });
    }
    setActiveTab('content');
  }, [pageData, open]);

  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!isEdit && (!prev.slug || prev.slug === slugify(prev.title))) {
        updated.slug = slugify(val);
        updated.metaTitle = val;
      }
      return updated;
    });
  };

  const handleGenerateSchema = async () => {
    try {
      setGeneratingSchema(true);
      const res = await generatePageSchemaAdmin({
        title: formData.title,
        slug: formData.slug,
        metaTitle: formData.metaTitle || formData.title,
        metaDescription: formData.metaDescription,
        content: formData.content,
        canonicalUrl: formData.canonicalUrl,
      });

      if (res?.success && res?.schema) {
        setFormData((prev) => ({ ...prev, seoSchema: res.schema }));
        message.success('Page schema generated successfully!');
      }
    } catch (err) {
      console.error('Failed to generate page schema:', err);
      message.error('Failed to generate page schema.');
    } finally {
      setGeneratingSchema(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      message.error('Please enter a page title.');
      setActiveTab('content');
      return;
    }

    const cleanSlug = slugify(formData.slug || formData.title);
    if (!cleanSlug) {
      message.error('Please provide a valid URL slug.');
      setActiveTab('content');
      return;
    }

    if (formData.seoSchema && formData.seoSchema.trim()) {
      try {
        JSON.parse(formData.seoSchema);
      } catch (e) {
        message.error('Page schema has invalid JSON syntax. Please correct it in the SEO & Schema tab.');
        setActiveTab('seo');
        return;
      }
    }

    const payload = {
      ...formData,
      slug: cleanSlug,
      metaTitle: formData.metaTitle || formData.title,
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        await updatePageAdmin(pageData._id, payload);
        message.success('Page updated successfully!');
      } else {
        await createPageAdmin(payload);
        message.success('Page created successfully!');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save page:', err);
      message.error(err?.response?.data?.message || 'Failed to save page.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = [
    {
      key: 'content',
      label: (
        <span className="flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase">
          <FileText size={14} />
          <span>Page Content</span>
        </span>
      ),
      children: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Page Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Luxury Handcrafted Policy"
                className="h-10 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <Input
                addonBefore="/"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
                placeholder="luxury-policy"
                className="h-10 rounded-lg text-sm"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Preview: /{formData.slug || 'your-slug'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Publish Status
              </label>
              <Select
                value={formData.status}
                onChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                className="w-full h-10 rounded-lg"
                options={[
                  { label: 'Published (Visible on site)', value: 'Published' },
                  { label: 'Draft (Hidden)', value: 'Draft' },
                ]}
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Draft pages are hidden on the storefront.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Footer Placement
              </label>
              <Select
                value={formData.footerPlacement}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, footerPlacement: val }))
                }
                className="w-full h-10 rounded-lg"
                options={[
                  { label: 'None (Direct link only)', value: 'none' },
                  { label: 'Footer Column 1 (Quick Links)', value: 'footer_column_1' },
                  { label: 'Footer Column 2 (Customer Care)', value: 'footer_column_2' },
                  { label: 'Footer Column 3 (Legal & Policies)', value: 'footer_column_3' },
                ]}
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Only published pages assigned to a footer column appear in the footer.
              </span>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Rich Text Content
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden min-h-[260px] bg-white">
              <CKEditor
                editor={ClassicEditor}
                data={formData.content}
                onChange={(_, editor) => {
                  const data = editor.getData();
                  setFormData((prev) => ({ ...prev, content: data }));
                }}
                config={{
                  toolbar: [
                    'heading',
                    '|',
                    'bold',
                    'italic',
                    'link',
                    'bulletedList',
                    'numberedList',
                    'blockQuote',
                    'insertTable',
                    'undo',
                    'redo',
                  ],
                }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'seo',
      label: (
        <span className="flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase">
          <Globe size={14} />
          <span>SEO & Schema</span>
        </span>
      ),
      children: (
        <div className="space-y-4 pt-2">
          <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <span>SEO Metadata</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Meta Title
              </label>
              <Input
                value={formData.metaTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                }
                placeholder={formData.title || 'Page Meta Title'}
                className="h-10 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Canonical URL
              </label>
              <Input
                value={formData.canonicalUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    canonicalUrl: e.target.value,
                  }))
                }
                placeholder="https://mmmk-wode.com/your-slug"
                className="h-10 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Meta Description
              </label>
              <TextArea
                rows={2}
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metaDescription: e.target.value,
                  }))
                }
                placeholder="Search engine summary of this page (around 150-160 characters)"
                className="rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Meta Keywords
              </label>
              <Input
                value={formData.metaKeywords}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metaKeywords: e.target.value,
                  }))
                }
                placeholder="luxury jewelry, bespoke fragrance, fine craftsmanship"
                className="h-10 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Schema JSON-LD Section */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between pb-2 mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Page Schema (JSON-LD)
                </h4>
                <p className="text-[11px] text-gray-400">
                  Auto-generates Google WebPage structured data for rich indexing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateSchema}
                  loading={generatingSchema}
                  icon={<Sparkles size={13} />}
                  className="text-xs font-semibold h-7 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 border-0 flex items-center gap-1"
                >
                  Generate Schema
                </Button>
                <Button
                  onClick={handleGenerateSchema}
                  icon={<RotateCcw size={13} />}
                  className="text-xs font-medium h-7 rounded-md border-gray-300 text-gray-700 hover:text-black flex items-center gap-1"
                >
                  Reset to Auto
                </Button>
              </div>
            </div>

            <SchemaEditor
              value={formData.seoSchema}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, seoSchema: val }))
              }
              rows={8}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} className="rounded-lg h-9">
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          className="bg-black hover:bg-neutral-800 text-white font-medium rounded-lg h-9 px-5 border-0"
        >
          {isEdit ? 'Update Page' : 'Create Page'}
        </Button>,
      ]}
      width={780}
      destroyOnClose
      centered
      title={
        <div className="pb-1">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Static Page' : 'New Static Page'}
          </h2>
          <p className="text-xs text-gray-500 font-normal mt-0.5">
            Manage content, SEO, publishing, and footer placement
          </p>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="mt-2"
      />
    </Modal>
  );
}

