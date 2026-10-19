import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Tag,
  Card,
  Row,
  Col,
  Select,
  Input,
  Button,
  Statistic,
  Popconfirm,
  message,
  Space,
  Tooltip,
} from 'antd';
import {
  LuMail,
  LuUserCheck,
  LuUserX,
  LuDownload,
  LuTrash2,
  LuRefreshCw,
  LuSearch,
  LuCopy,
  LuCheck,
} from 'react-icons/lu';
import dayjs from 'dayjs';
import PageTitle from '../../UI/PageTitle';
import {
  getSubscribersAdmin,
  deleteSubscriberAdmin,
  updateSubscriberStatusAdmin,
  exportSubscribersCsvAdmin,
} from '../../../apis/admin/newsletterAdmin';

const { Search } = Input;

export default function NewsletterSubscribersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [copiedId, setCopiedId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch subscribers query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['newsletter-subscribers', pagination.page, pagination.limit, search, statusFilter],
    queryFn: async () => {
      const res = await getSubscribersAdmin({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      return res;
    },
    keepPreviousData: true,
  });

  const subscribers = data?.data?.subscribers || [];
  const meta = data?.data?.pagination || {
    total: 0,
    totalActive: 0,
    totalUnsubscribed: 0,
    page: 1,
    totalPages: 1,
  };

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateSubscriberStatusAdmin(id, status),
    onSuccess: (res) => {
      message.success(res?.message || 'Status updated successfully');
      queryClient.invalidateQueries(['newsletter-subscribers']);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to update status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSubscriberAdmin(id),
    onSuccess: (res) => {
      message.success(res?.message || 'Subscriber deleted');
      queryClient.invalidateQueries(['newsletter-subscribers']);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to delete subscriber');
    },
  });

  // Export to CSV
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await exportSubscribersCsvAdmin({
        status: statusFilter || undefined,
      });

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = dayjs().format('YYYY-MM-DD');
      link.setAttribute('download', `newsletter_subscribers_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Subscriber list exported successfully');
    } catch (err) {
      console.error(err);
      message.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyEmail = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    message.success('Email copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = [
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      render: (email, record) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-stone-800">{email}</span>
          <Tooltip title={copiedId === record._id ? 'Copied' : 'Copy Email'}>
            <button
              onClick={() => handleCopyEmail(email, record._id)}
              className="text-stone-400 hover:text-stone-700 transition-colors p-1"
            >
              {copiedId === record._id ? (
                <LuCheck className="text-emerald-500" size={14} />
              ) : (
                <LuCopy size={14} />
              )}
            </button>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) =>
        status === 'subscribed' ? (
          <Tag color="success" className="px-2.5 py-0.5 font-medium rounded-full">
            Subscribed
          </Tag>
        ) : (
          <Tag color="default" className="px-2.5 py-0.5 font-medium rounded-full text-stone-500">
            Unsubscribed
          </Tag>
        ),
    },
    {
      title: 'Collection Source',
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (source) => {
        let color = 'gold';
        let label = 'Popup';
        if (source === 'footer') {
          color = 'blue';
          label = 'Footer Form';
        } else if (source === 'checkout') {
          color = 'purple';
          label = 'Checkout';
        }
        return (
          <Tag color={color} className="uppercase font-semibold text-[11px] tracking-wider rounded">
            {label}
          </Tag>
        );
      },
    },
    {
      title: 'Voucher Awarded',
      dataIndex: 'discountCode',
      key: 'discountCode',
      width: 150,
      render: (code) =>
        code ? (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
            {code}
          </span>
        ) : (
          <span className="text-stone-400 text-xs">—</span>
        ),
    },
    {
      title: 'Subscribed Date',
      dataIndex: 'subscribedAt',
      key: 'subscribedAt',
      width: 180,
      render: (date) => (date ? dayjs(date).format('MMM DD, YYYY HH:mm') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const nextStatus = record.status === 'subscribed' ? 'unsubscribed' : 'subscribed';
        return (
          <Space orientation="horizontal" size="small">
            <Button
              size="small"
              onClick={() => statusMutation.mutate({ id: record._id, status: nextStatus })}
              loading={statusMutation.isPending && statusMutation.variables?.id === record._id}
            >
              {record.status === 'subscribed' ? 'Mark Unsubscribed' : 'Reactivate'}
            </Button>

            <Popconfirm
              title="Delete subscriber?"
              description="This will permanently delete this subscriber from the list."
              onConfirm={() => deleteMutation.mutate(record._id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button
                size="small"
                danger
                icon={<LuTrash2 size={13} />}
                loading={deleteMutation.isPending && deleteMutation.variables === record._id}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle title="Email Newsletter Subscribers" />
        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<LuDownload size={15} />}
            loading={isExporting}
            onClick={handleExportCsv}
            className="bg-[#dfba73] hover:!bg-[#cda65b] border-none text-black font-medium"
          >
            Export to CSV
          </Button>
          <Button icon={<LuRefreshCw size={15} />} onClick={() => refetch()} loading={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-stone-200/80 rounded-xl">
            <Statistic
              title={<span className="text-xs uppercase font-semibold tracking-wider text-stone-500">Total Subscribers</span>}
              value={meta.total || 0}
              prefix={<LuMail className="text-[#dfba73] mr-2" size={20} />}
              valueStyle={{ fontWeight: 600, color: '#1c1917' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-stone-200/80 rounded-xl">
            <Statistic
              title={<span className="text-xs uppercase font-semibold tracking-wider text-stone-500">Active Audience</span>}
              value={meta.totalActive || 0}
              prefix={<LuUserCheck className="text-emerald-500 mr-2" size={20} />}
              valueStyle={{ fontWeight: 600, color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border border-stone-200/80 rounded-xl">
            <Statistic
              title={<span className="text-xs uppercase font-semibold tracking-wider text-stone-500">Unsubscribed</span>}
              value={meta.totalUnsubscribed || 0}
              prefix={<LuUserX className="text-stone-400 mr-2" size={20} />}
              valueStyle={{ fontWeight: 600, color: '#78716c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card bordered={false} className="shadow-sm border border-stone-200/80 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-5">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <Search
              placeholder="Search by subscriber email..."
              allowClear
              enterButton={<LuSearch size={16} />}
              onSearch={(value) => {
                setSearch(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ maxWidth: 360 }}
            />

            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ width: 180 }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Subscribed Only', value: 'subscribed' },
                { label: 'Unsubscribed Only', value: 'unsubscribed' },
              ]}
            />
          </div>
        </div>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={subscribers}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: meta.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} subscribers`,
            onChange: (page, limit) => {
              setPagination({ page, limit });
            },
          }}
          className="overflow-x-auto"
        />
      </Card>
    </div>
  );
}
