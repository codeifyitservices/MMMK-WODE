import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  InputNumber,
  Select,
  Drawer,
  message,
  Space,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  Edit,
  Eye,
  Copy,
  Check,
  Search,
  Building,
  ShoppingBag,
  MousePointerClick,
  Trash2,
} from 'lucide-react';
import PageTitle from '../../UI/PageTitle';
import {
  getInfluencersListAdmin,
  getInfluencerDetailAdmin,
  updateInfluencerAdmin,
  deleteInfluencerApplicationAdmin,
} from '../../../apis/admin/influencerAdmin';

const InfluencerListPage = () => {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Drawer & Edit Modal State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState(null);
  const [editForm, setEditForm] = useState({
    commissionRate: 10,
    discountRate: 20,
    status: 'Approved',
    newPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchInfluencers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getInfluencersListAdmin({
        page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      if (res.success && res.data) {
        setInfluencers(res.data.influencers || []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
          });
        }
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load influencers list.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.limit]);

  useEffect(() => {
    fetchInfluencers(1);
  }, [fetchInfluencers]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenDetailDrawer = async (record) => {
    setDrawerVisible(true);
    setDetailLoading(true);
    try {
      const res = await getInfluencerDetailAdmin(record._id);
      if (res.success && res.data) {
        setSelectedDetail(res.data);
      }
    } catch {
      message.error('Failed to load influencer details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEditModal = (record) => {
    setEditingInfluencer(record);
    setEditForm({
      commissionRate: record.commissionRate || 10,
      discountRate: record.discountRate || 20,
      status: record.status || 'Approved',
      newPassword: '',
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editingInfluencer) return;

    try {
      setSubmitting(true);
      const payload = {
        commissionRate: editForm.commissionRate,
        discountRate: editForm.discountRate,
        status: editForm.status,
      };
      if (editForm.newPassword && editForm.newPassword.trim().length >= 6) {
        payload.newPassword = editForm.newPassword.trim();
      }

      const res = await updateInfluencerAdmin(editingInfluencer._id, payload);
      if (res.success) {
        message.success('Influencer configuration updated successfully.');
        setEditModalVisible(false);
        fetchInfluencers(pagination.page);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update influencer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInfluencer = async (record) => {
    try {
      const res = await deleteInfluencerApplicationAdmin(record._id);
      if (res.success) {
        message.success(res.message || 'Influencer deleted successfully.');
        fetchInfluencers(pagination.page);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete influencer.');
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Influencer',
        dataIndex: 'fullName',
        key: 'fullName',
        render: (name, record) => (
          <div>
            <div className="font-semibold text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">@{record.username}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        ),
      },
      {
        title: 'Referral Code',
        dataIndex: 'referralCode',
        key: 'referralCode',
        render: (code) => (
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-[#b8860b] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
              {code}
            </span>
            <button
              onClick={() => handleCopyCode(code)}
              className="text-gray-400 hover:text-gray-700"
              title="Copy Referral Code"
            >
              {copiedCode === code ? (
                <Check size={12} className="text-emerald-600" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        ),
      },
      {
        title: 'Rates',
        key: 'rates',
        render: (_, record) => (
          <div className="text-xs space-y-0.5">
            <div className="text-emerald-700 font-semibold">
              {record.commissionRate || 10}% Commission
            </div>
            <div className="text-[#b8860b] font-medium">
              {record.discountRate || 20}% Customer Off
            </div>
          </div>
        ),
      },
      {
        title: 'Traffic & Orders',
        key: 'performance',
        render: (_, record) => (
          <div className="text-xs space-y-0.5">
            <div className="text-gray-700 flex items-center gap-1">
              <MousePointerClick size={12} className="text-gray-400" />
              <span>{record.totalClicks || 0} clicks</span>
            </div>
            <div className="text-gray-700 flex items-center gap-1">
              <ShoppingBag size={12} className="text-gray-400" />
              <span>{record.totalOrders || 0} orders</span>
            </div>
          </div>
        ),
      },
      {
        title: 'Wallet Balances',
        key: 'wallet',
        render: (_, record) => (
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-gray-900">
              AED {Number(record.walletBalance || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-500">
              Paid: AED {Number(record.totalPaidOut || 0).toFixed(2)}
            </div>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const colors = {
            Approved: 'green',
            Suspended: 'volcano',
            Pending: 'gold',
            Rejected: 'red',
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              onClick={() => handleOpenDetailDrawer(record)}
              icon={<Eye size={13} />}
            >
              Details
            </Button>
            <Button
              size="small"
              onClick={() => handleOpenEditModal(record)}
              icon={<Edit size={13} />}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete Influencer?"
              description={`Permanently delete "${record.fullName || 'this influencer'}"? Their referral code and portal access will be revoked.`}
              onConfirm={() => handleDeleteInfluencer(record)}
              okText="Yes, Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Tooltip title="Delete Influencer">
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
    [copiedCode]
  );

  return (
    <div className="p-6 space-y-6">
      <PageTitle
        title="Active Influencers Directory"
        subtitle="Manage approved influencers, commission rates, financial balances, and statuses."
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-40"
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Suspended', label: 'Suspended' },
            ]}
          />
        </div>

        <div className="w-full sm:w-72">
          <Input
            prefix={<Search size={14} className="text-gray-400 mr-1" />}
            placeholder="Search name, username, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Influencers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={influencers}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => fetchInfluencers(page),
            showSizeChanger: false,
          }}
        />
      </div>

      {/* EDIT INFLUENCER MODAL */}
      <Modal
        title={`Edit Influencer: ${editingInfluencer?.fullName}`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSubmit}
        confirmLoading={submitting}
        okText="Save Changes"
      >
        <div className="py-2 space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Account Status
            </label>
            <Select
              className="w-full"
              value={editForm.status}
              onChange={(val) => setEditForm({ ...editForm, status: val })}
              options={[
                { value: 'Approved', label: 'Approved (Active)' },
                { value: 'Suspended', label: 'Suspended (Access Disabled)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Commission Rate (%)
              </label>
              <InputNumber
                min={1}
                max={50}
                className="w-full"
                value={editForm.commissionRate}
                onChange={(val) => setEditForm({ ...editForm, commissionRate: val })}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Customer Discount (%)
              </label>
              <InputNumber
                min={0}
                max={50}
                className="w-full"
                value={editForm.discountRate}
                onChange={(val) => setEditForm({ ...editForm, discountRate: val })}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Reset Portal Password (Optional)
            </label>
            <Input
              type="password"
              placeholder="Leave empty to keep existing password"
              value={editForm.newPassword}
              onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* INFLUENCER DETAIL DRAWER */}
      <Drawer
        title="Influencer Detailed Dossier"
        placement="right"
        width={520}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {detailLoading ? (
          <div className="p-8 text-center text-gray-400">Loading details...</div>
        ) : selectedDetail ? (
          <div className="space-y-6 text-xs text-gray-700">
            {/* Header info */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {selectedDetail.influencer?.fullName}
              </h3>
              <p className="text-xs text-gray-500">
                @{selectedDetail.influencer?.username} &bull; {selectedDetail.influencer?.email}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Tag color="gold">Code: {selectedDetail.influencer?.referralCode}</Tag>
                <Tag color={selectedDetail.influencer?.status === 'Approved' ? 'green' : 'red'}>
                  {selectedDetail.influencer?.status}
                </Tag>
              </div>
            </div>

            {/* Financial Performance KPI Grid */}
            <div>
              <h4 className="font-semibold text-gray-800 uppercase tracking-wider mb-2">
                Financial & Traffic Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-400">Total Sales Generated</span>
                  <div className="text-base font-bold text-gray-900 mt-1">
                    AED {selectedDetail.metrics?.totalSalesVolume || 0}
                  </div>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-400">Total Commissions Earned</span>
                  <div className="text-base font-bold text-emerald-600 mt-1">
                    AED {selectedDetail.metrics?.totalCommissionEarned || 0}
                  </div>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-400">Available Wallet</span>
                  <div className="text-base font-bold text-amber-600 mt-1">
                    AED {selectedDetail.metrics?.walletBalance || 0}
                  </div>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-400">Total Paid Out</span>
                  <div className="text-base font-bold text-blue-600 mt-1">
                    AED {selectedDetail.metrics?.totalPaidOut || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Payout Info */}
            <div>
              <h4 className="font-semibold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building size={14} className="text-[#b8860b]" />
                <span>Bank & Payout Destination</span>
              </h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <div>
                  <span className="text-gray-500">Holder:</span>{' '}
                  <strong className="text-gray-800">
                    {selectedDetail.influencer?.payoutDetails?.accountHolderName || 'Not configured'}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500">Bank:</span>{' '}
                  {selectedDetail.influencer?.payoutDetails?.bankName || 'Not configured'}
                </div>
                <div>
                  <span className="text-gray-500">Account / IBAN:</span>{' '}
                  <span className="font-mono font-medium">
                    {selectedDetail.influencer?.payoutDetails?.accountNumber || 'Not configured'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">SWIFT / IFSC:</span>{' '}
                  <span className="font-mono">
                    {selectedDetail.influencer?.payoutDetails?.swiftCode || '-'}
                  </span>
                </div>
                {selectedDetail.influencer?.payoutDetails?.upiId && (
                  <div>
                    <span className="text-gray-500">UPI:</span>{' '}
                    {selectedDetail.influencer?.payoutDetails?.upiId}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <h4 className="font-semibold text-gray-800 uppercase tracking-wider mb-2">
                Recent Attributed Orders ({selectedDetail.attributedOrders?.length || 0})
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedDetail.attributedOrders && selectedDetail.attributedOrders.length > 0 ? (
                  selectedDetail.attributedOrders.slice(0, 10).map((o) => (
                    <div
                      key={o._id}
                      className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-semibold text-gray-800">
                          #{o.orderId || o._id}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">
                          AED {o.price?.total || o.amount || 0}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold">
                          +AED {o.influencerCommissionAmount || 0} Comm.
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">No orders recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default InfluencerListPage;
