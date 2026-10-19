import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  InputNumber,
  message,
  Tabs,
  Space,
  Tooltip,
  Popconfirm,
  Divider,
} from 'antd';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  UserCheck,
  Search,
  Eye,
  Trash2,
  Copy,
  Check,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  User,
} from 'lucide-react';
import PageTitle from '../../UI/PageTitle';
import {
  getInfluencerApplicationsAdmin,
  approveInfluencerApplicationAdmin,
  rejectInfluencerApplicationAdmin,
  deleteInfluencerApplicationAdmin,
} from '../../../apis/admin/influencerAdmin';

const InfluencerApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Modal States
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsRecord, setDetailsRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Approval Form State
  const [approvalForm, setApprovalForm] = useState({
    customUsername: '',
    customReferralCode: '',
    customPassword: '',
    commissionRate: 10,
    discountRate: 20,
  });

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApplications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getInfluencerApplicationsAdmin({
        page,
        limit: pagination.limit,
        status: statusFilter,
        search: search || undefined,
      });

      if (res.success && res.data) {
        setApplications(res.data.applications || []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
          });
        }
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.limit]);

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  const handleOpenApproveModal = (record) => {
    setSelectedApp(record);
    const cleanName = (record.fullName || 'partner')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_');
    const codeBase = (record.fullName || 'WODE')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 6);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    setApprovalForm({
      customUsername: `${cleanName}_${record._id.slice(-3)}`,
      customReferralCode: `${codeBase || 'WODE'}20`,
      customPassword: `Wode@${randomSuffix}`,
      commissionRate: 10,
      discountRate: 20,
    });
    setApproveModalVisible(true);
  };

  const handleOpenRejectModal = (record) => {
    setSelectedApp(record);
    setRejectionReason('Your application does not meet our current influencer requirements.');
    setRejectModalVisible(true);
  };

  const handleOpenDetailsModal = (record) => {
    setDetailsRecord(record);
    setDetailsModalVisible(true);
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    message.success('Referral code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteApplication = async (record) => {
    try {
      setDeletingId(record._id);
      const res = await deleteInfluencerApplicationAdmin(record._id);
      if (res.success) {
        message.success(res.message || 'Influencer application deleted successfully.');
        if (detailsModalVisible && detailsRecord?._id === record._id) {
          setDetailsModalVisible(false);
        }
        fetchApplications(pagination.page);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete influencer record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleApproveSubmit = async () => {
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      const res = await approveInfluencerApplicationAdmin(selectedApp._id, approvalForm);
      if (res.success) {
        message.success(
          `Approved! Welcome credentials dispatched to ${selectedApp.email}.`
        );
        setApproveModalVisible(false);
        if (detailsModalVisible && detailsRecord?._id === selectedApp._id) {
          setDetailsModalVisible(false);
        }
        fetchApplications(pagination.page);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to approve application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      const res = await rejectInfluencerApplicationAdmin(selectedApp._id, {
        reason: rejectionReason,
      });
      if (res.success) {
        message.success('Application marked as Rejected.');
        setRejectModalVisible(false);
        if (detailsModalVisible && detailsRecord?._id === selectedApp._id) {
          setDetailsModalVisible(false);
        }
        fetchApplications(pagination.page);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to reject application.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Applicant',
        dataIndex: 'fullName',
        key: 'fullName',
        render: (name, record) => (
          <div>
            <div className="font-semibold text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
            {record.phoneNumber && (
              <div className="text-xs text-gray-400">{record.phoneNumber}</div>
            )}
          </div>
        ),
      },
      {
        title: 'Niche & Followers',
        key: 'niche',
        render: (_, record) => (
          <div>
            <div className="text-sm font-medium text-gray-800">
              {record.niche || 'General'}
            </div>
            <div className="text-xs text-[#b8860b] font-semibold">
              {record.followerCount || 'Not specified'} followers
            </div>
          </div>
        ),
      },
      {
        title: 'Social Channels',
        key: 'socialMedia',
        render: (_, record) => {
          const sm = record.socialMedia || {};
          const links = [
            sm.instagram && { label: 'Instagram', url: sm.instagram },
            sm.tiktok && { label: 'TikTok', url: sm.tiktok },
            sm.youtube && { label: 'YouTube', url: sm.youtube },
            sm.other && { label: 'Website', url: sm.other },
          ].filter(Boolean);

          return links.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {links.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-[#dfba73]/20 hover:text-[#8a6820] text-gray-700 transition-colors"
                >
                  <span>{item.label}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400">None provided</span>
          );
        },
      },
      {
        title: 'Bio / Note',
        dataIndex: 'bio',
        key: 'bio',
        render: (bio) => (
          <Tooltip title={bio}>
            <span className="text-xs text-gray-600 line-clamp-2 max-w-xs">
              {bio || '-'}
            </span>
          </Tooltip>
        ),
      },
      {
        title: 'Date Submitted',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => (
          <span className="text-xs text-gray-500">
            {date ? new Date(date).toLocaleDateString() : '-'}
          </span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const colors = {
            Pending: 'gold',
            Approved: 'green',
            Rejected: 'red',
            Suspended: 'volcano',
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        },
      },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <Space size="small">
            {/* View Details Icon Button */}
            <Tooltip title="View Influencer Details">
              <Button
                size="small"
                icon={<Eye size={13} className="text-gray-600" />}
                onClick={() => handleOpenDetailsModal(record)}
                className="flex items-center justify-center hover:border-[#dfba73] hover:text-[#b8860b]"
              />
            </Tooltip>

            {/* Status-specific action buttons */}
            {record.status === 'Pending' && (
              <>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleOpenApproveModal(record)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                >
                  <CheckCircle size={13} />
                  <span>Approve</span>
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => handleOpenRejectModal(record)}
                  className="flex items-center gap-1"
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {record.status === 'Approved' && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck size={13} />
                <span>Code: {record.referralCode}</span>
              </span>
            )}

            {record.status === 'Rejected' && (
              <span className="text-xs text-gray-400 italic">
                {record.rejectionReason || 'Rejected'}
              </span>
            )}

            {/* Delete button with confirmation */}
            <Popconfirm
              title="Delete this record?"
              description={`Are you sure you want to delete "${record.fullName || 'this influencer'}"? This action cannot be undone.`}
              onConfirm={() => handleDeleteApplication(record)}
              okText="Yes, Delete"
              okButtonProps={{ danger: true, loading: deletingId === record._id }}
              cancelText="Cancel"
            >
              <Tooltip title={record.status === 'Approved' ? 'Delete / Revoke Approval' : 'Delete Application'}>
                <Button
                  danger
                  size="small"
                  icon={<Trash2 size={13} />}
                  className="flex items-center justify-center text-red-500 hover:text-red-700 hover:border-red-500"
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deletingId]
  );

  return (
    <div className="p-6 space-y-6">
      <PageTitle
        title="Influencer Applications"
        subtitle="Review, approve, and auto-dispatch login credentials to aspiring influencers."
      />

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <Tabs
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key)}
          className="w-full sm:w-auto"
          items={[
            { key: 'Pending', label: 'Pending Review' },
            { key: 'Approved', label: 'Approved' },
            { key: 'Rejected', label: 'Rejected' },
            { key: 'All', label: 'All Applications' },
          ]}
        />

        <div className="w-full sm:w-72">
          <Input
            prefix={<Search size={14} className="text-gray-400 mr-1" />}
            placeholder="Search applicant name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => fetchApplications(page),
            showSizeChanger: false,
          }}
        />
      </div>

      {/* VIEW DETAILS MODAL */}
      <Modal
        title={
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <Eye size={18} className="text-[#b8860b]" />
              <span>Influencer Application Details</span>
            </div>
            {detailsRecord?.status && (
              <Tag
                color={
                  detailsRecord.status === 'Approved'
                    ? 'green'
                    : detailsRecord.status === 'Pending'
                    ? 'gold'
                    : 'red'
                }
              >
                {detailsRecord.status}
              </Tag>
            )}
          </div>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              <Popconfirm
                title="Delete this record?"
                description="Are you sure you want to permanently delete this influencer record?"
                onConfirm={() => {
                  if (detailsRecord) {
                    handleDeleteApplication(detailsRecord);
                  }
                }}
                okText="Yes, Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
              >
                <Button danger icon={<Trash2 size={14} />}>
                  Delete Record
                </Button>
              </Popconfirm>
            </div>

            <Space>
              {detailsRecord?.status === 'Pending' && (
                <>
                  <Button
                    danger
                    onClick={() => {
                      setDetailsModalVisible(false);
                      handleOpenRejectModal(detailsRecord);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    type="primary"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setDetailsModalVisible(false);
                      handleOpenApproveModal(detailsRecord);
                    }}
                  >
                    Approve Application
                  </Button>
                </>
              )}
              <Button onClick={() => setDetailsModalVisible(false)}>Close</Button>
            </Space>
          </div>
        }
        width={680}
      >
        {detailsRecord && (
          <div className="py-2 space-y-4 text-xs">
            {/* Top Identity Card */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dfba73] to-[#8c6d2d] flex items-center justify-center text-black font-extrabold text-lg shadow-sm">
                {detailsRecord.fullName ? detailsRecord.fullName.charAt(0).toUpperCase() : 'I'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  {detailsRecord.fullName}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-gray-500 mt-1 text-xs">
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-gray-400" />
                    <a href={`mailto:${detailsRecord.email}`} className="text-blue-600 hover:underline">
                      {detailsRecord.email}
                    </a>
                  </span>
                  {detailsRecord.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      <span>{detailsRecord.phoneNumber}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-gray-400">
                    <Calendar size={12} />
                    <span>Submitted: {new Date(detailsRecord.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Approved Partnership Badge & Credentials (if approved) */}
            {detailsRecord.status === 'Approved' && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                  <ShieldCheck size={15} />
                  <span>Approved Partner Credentials & Codes</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] uppercase text-gray-400 font-medium block">Referral Code</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-bold text-emerald-700 text-sm font-mono">{detailsRecord.referralCode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(detailsRecord.referralCode)}
                        className="text-gray-400 hover:text-emerald-700"
                      >
                        {copiedCode === detailsRecord.referralCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] uppercase text-gray-400 font-medium block">Commission</span>
                    <span className="font-bold text-gray-800 text-sm">{detailsRecord.commissionRate || 10}%</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] uppercase text-gray-400 font-medium block">Discount Given</span>
                    <span className="font-bold text-gray-800 text-sm">{detailsRecord.discountRate || 20}%</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] uppercase text-gray-400 font-medium block">Username</span>
                    <span className="font-semibold text-gray-800 text-xs truncate block">{detailsRecord.username || detailsRecord.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Notice (if rejected) */}
            {detailsRecord.status === 'Rejected' && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                <span className="font-semibold block mb-0.5">Rejection Feedback / Internal Note:</span>
                <p className="text-xs text-rose-700 mb-0 font-light leading-relaxed">
                  {detailsRecord.rejectionReason || 'No specific reason provided.'}
                </p>
              </div>
            )}

            {/* Creator Metrics: Niche & Audience */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider block mb-1">
                  Content Niche
                </span>
                <span className="text-sm font-bold text-gray-800">{detailsRecord.niche || 'Not specified'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider block mb-1">
                  Audience Size / Reach
                </span>
                <span className="text-sm font-bold text-[#b8860b]">{detailsRecord.followerCount || 'Not specified'}</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="p-3.5 bg-white rounded-xl border border-gray-200">
              <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider block mb-2">
                Connected Social Channels
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detailsRecord.socialMedia?.instagram ? (
                  <a
                    href={detailsRecord.socialMedia.instagram.startsWith('http') ? detailsRecord.socialMedia.instagram : `https://${detailsRecord.socialMedia.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-pink-50/60 hover:bg-pink-100/70 border border-pink-100 text-pink-700 transition-colors"
                  >
                    <span className="font-medium text-xs truncate mr-2">Instagram: {detailsRecord.socialMedia.instagram}</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 text-xs">Instagram: Not provided</div>
                )}

                {detailsRecord.socialMedia?.tiktok ? (
                  <a
                    href={detailsRecord.socialMedia.tiktok.startsWith('http') ? detailsRecord.socialMedia.tiktok : `https://${detailsRecord.socialMedia.tiktok}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 transition-colors"
                  >
                    <span className="font-medium text-xs truncate mr-2">TikTok: {detailsRecord.socialMedia.tiktok}</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 text-xs">TikTok: Not provided</div>
                )}

                {detailsRecord.socialMedia?.youtube ? (
                  <a
                    href={detailsRecord.socialMedia.youtube.startsWith('http') ? detailsRecord.socialMedia.youtube : `https://${detailsRecord.socialMedia.youtube}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 hover:bg-red-100/70 border border-red-100 text-red-700 transition-colors"
                  >
                    <span className="font-medium text-xs truncate mr-2">YouTube: {detailsRecord.socialMedia.youtube}</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 text-xs">YouTube: Not provided</div>
                )}

                {detailsRecord.socialMedia?.other ? (
                  <a
                    href={detailsRecord.socialMedia.other.startsWith('http') ? detailsRecord.socialMedia.other : `https://${detailsRecord.socialMedia.other}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 hover:bg-amber-100/70 border border-amber-100 text-amber-800 transition-colors"
                  >
                    <span className="font-medium text-xs truncate mr-2">Website / Blog: {detailsRecord.socialMedia.other}</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 text-xs">Website / Blog: None</div>
                )}
              </div>
            </div>

            {/* Bio & Strategy Statement */}
            <div className="p-3.5 bg-white rounded-xl border border-gray-200">
              <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider block mb-1">
                Bio & Promotional Strategy
              </span>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xs bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                {detailsRecord.bio || 'Applicant did not provide a bio statement.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* APPROVE INFLUENCER MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <UserCheck size={18} className="text-emerald-600" />
            <span>Approve Application: {selectedApp?.fullName}</span>
          </div>
        }
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        onOk={handleApproveSubmit}
        confirmLoading={submitting}
        okText="Approve & Send Welcome Email"
        okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700' }}
        width={560}
      >
        <div className="py-2 space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800 flex items-start gap-2">
            <Send size={15} className="shrink-0 mt-0.5" />
            <span>
              Approving will create an active influencer account and automatically dispatch a branded welcome email with these credentials to <strong>{selectedApp?.email}</strong>.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Portal Username
              </label>
              <Input
                value={approvalForm.customUsername}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, customUsername: e.target.value })
                }
                placeholder="e.g. jatin_style"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Unique Referral Code
              </label>
              <Input
                value={approvalForm.customReferralCode}
                onChange={(e) =>
                  setApprovalForm({
                    ...approvalForm,
                    customReferralCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. JATIN20"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Temporary Password
              </label>
              <Input
                value={approvalForm.customPassword}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, customPassword: e.target.value })
                }
                placeholder="Initial password"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Commission Rate (%)
              </label>
              <InputNumber
                min={1}
                max={50}
                className="w-full"
                value={approvalForm.commissionRate}
                onChange={(val) =>
                  setApprovalForm({ ...approvalForm, commissionRate: val })
                }
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-600 font-medium mb-1">
                Customer Discount Rate (%)
              </label>
              <InputNumber
                min={0}
                max={50}
                className="w-full"
                value={approvalForm.discountRate}
                onChange={(val) =>
                  setApprovalForm({ ...approvalForm, discountRate: val })
                }
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Referred customers automatically get this discount at cart and checkout.
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        title="Reject Influencer Application"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleRejectSubmit}
        confirmLoading={submitting}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2 space-y-3 text-xs">
          <p className="text-gray-600">
            Are you sure you want to reject the application for{' '}
            <strong>{selectedApp?.fullName}</strong> ({selectedApp?.email})?
          </p>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Rejection Reason (Internal & Feedback Note)
            </label>
            <Input.TextArea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application was not approved..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InfluencerApplicationsPage;
