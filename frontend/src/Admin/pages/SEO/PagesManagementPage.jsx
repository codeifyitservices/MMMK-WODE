import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCw,
} from 'lucide-react';
import {
  Table,
  Button,
  Input,
  Tag,
  Popconfirm,
  message,
  Spin,
  Tooltip,
} from 'antd';
import {
  getAllPagesAdmin,
  deletePageAdmin,
} from '../../../apis/admin/pagesAdmin';
import StaticPageModal from './StaticPageModal';

const CORE_POLICIES = [
  {
    title: 'About Us',
    slug: 'about-us',
    description: 'Edit founder story, mission, and vision',
    badge: 'A',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    title: 'Terms & Conditions',
    slug: 'terms-conditions',
    description: 'Edit user agreement, platform policies, and rules',
    badge: 'T',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    description: 'Edit data protection rules, privacy claims, and terms',
    badge: 'P',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    title: 'Shipping Policy',
    slug: 'shipping-policy',
    description: 'Edit delivery timelines, charges, and shipment terms',
    badge: 'S',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    title: 'Return & Exchange Policy',
    slug: 'return-policy',
    description: 'Edit return windows, exchange rules, and refund terms',
    badge: 'R',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
  },
];

export default function PagesManagementPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPagesAdmin({
        search: searchQuery.trim() || undefined,
      });
      if (res?.success) {
        setPages(res.pages || []);
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
      message.error('Failed to load pages.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleOpenCreate = () => {
    setSelectedPage(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (page) => {
    setSelectedPage(page);
    setModalOpen(true);
  };

  const handleOpenCorePolicy = (policy) => {
    const existing = pages.find((p) => p.slug === policy.slug);
    if (existing) {
      setSelectedPage(existing);
    } else {
      setSelectedPage({
        title: policy.title,
        slug: policy.slug,
        status: 'Published',
        footerPlacement: 'footer_column_3',
        metaTitle: `${policy.title} | MMMK WODE`,
        metaDescription: policy.description,
      });
    }
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await deletePageAdmin(id);
      if (res?.success) {
        message.success('Page deleted successfully.');
        fetchPages();
      }
    } catch (err) {
      console.error('Failed to delete page:', err);
      message.error(err?.response?.data?.message || 'Failed to delete page.');
    }
  };

  const footerPlacementLabel = (val) => {
    switch (val) {
      case 'footer_column_1':
        return 'Footer Column 1';
      case 'footer_column_2':
        return 'Footer Column 2';
      case 'footer_column_3':
        return 'Footer Column 3';
      default:
        return 'None';
    }
  };

  const columns = [
    {
      title: 'TITLE',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div className="font-semibold text-gray-900 text-sm">{title}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            UPDATED {new Date(record.updatedAt || record.createdAt).toLocaleDateString('en-GB')}
          </div>
        </div>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => (
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          <span>/{slug}</span>
          <ExternalLink size={12} />
        </a>
      ),
    },
    {
      title: 'FOOTER SECTION',
      dataIndex: 'footerPlacement',
      key: 'footerPlacement',
      render: (val) => {
        const isNone = !val || val === 'none';
        return (
          <span className={`text-xs ${isNone ? 'text-gray-400 italic' : 'text-gray-700 font-medium'}`}>
            {footerPlacementLabel(val)}
          </span>
        );
      },
    },
    {
      title: 'PUBLISH STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isPub = status === 'Published';
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isPub
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="text"
            onClick={() => handleOpenEdit(record)}
            icon={<Edit2 size={15} />}
            className="text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg p-1.5 h-8 w-8 flex items-center justify-center"
          />
          <Popconfirm
            title="Delete this page?"
            description="Are you sure you want to delete this custom page? This cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes, delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<Trash2 size={15} />}
              className="hover:bg-red-50 rounded-lg p-1.5 h-8 w-8 flex items-center justify-center"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-7">
      {/* Header */}
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Pages Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Edit static site content and custom pages
        </p>
      </div>

      {/* Core Policy Cards Grid */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORE_POLICIES.map((policy) => {
            const pageDoc = pages.find((p) => p.slug === policy.slug);
            const isCreated = Boolean(pageDoc);

            return (
              <div
                key={policy.slug}
                onClick={() => handleOpenCorePolicy(policy)}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md hover:border-gray-400 transition-all cursor-pointer relative group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg border font-bold text-sm flex items-center justify-center ${policy.badgeBg}`}
                  >
                    {policy.badge}
                  </div>
                  {isCreated && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Configured
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 text-sm group-hover:text-black mb-1">
                  {policy.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {policy.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Static Pages Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Custom Static Pages
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pages created here can be published and added to footer columns
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Input
              prefix={<Search size={14} className="text-gray-400 mr-1" />}
              placeholder="Search by title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-lg text-xs w-full sm:w-64"
              allowClear
            />

            <Button
              onClick={fetchPages}
              icon={<RotateCw size={14} />}
              className="h-9 w-9 flex items-center justify-center rounded-lg border-gray-200 hover:border-gray-400"
            />

            <Button
              type="primary"
              onClick={handleOpenCreate}
              icon={<Plus size={15} />}
              className="bg-black hover:bg-neutral-800 text-white font-medium text-xs h-9 px-4 rounded-lg border-0 shadow-sm flex items-center gap-1.5 shrink-0"
            >
              New Page
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={pages}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          className="border border-gray-100 rounded-lg overflow-hidden"
          locale={{ emptyText: 'No custom static pages created yet.' }}
        />
      </div>

      {/* Static Page Edit/Create Modal */}
      <StaticPageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pageData={selectedPage}
        onSuccess={fetchPages}
      />
    </div>
  );
}

