import React from 'react';
import { Drawer, Tag, Timeline, Descriptions, Table, Divider, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getAbandonedCartDetail } from '../../../apis/admin/abandonedCart';
import { CheckCircle2, XCircle, Clock, Gift, ShoppingCart, Mail, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

export default function AbandonedCartDetailDrawer({ visible, recordId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['abandoned-cart-detail', recordId],
    queryFn: () => getAbandonedCartDetail(recordId),
    enabled: Boolean(visible && recordId),
  });

  const recovery = data?.data || {};

  const getStatusTag = (status) => {
    switch (status) {
      case 'RECOVERED':
        return <Tag color="success">Recovered</Tag>;
      case 'ACTIVE':
        return <Tag color="processing">Active Cart</Tag>;
      case 'IDLE':
      case 'ABANDONED':
        return <Tag color="warning">Abandoned</Tag>;
      case 'CANCELLED':
        return <Tag color="default">Cancelled (Emptied)</Tag>;
      case 'EXPIRED':
        return <Tag color="error">Expired</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const itemColumns = [
    {
      title: 'Item',
      key: 'item',
      render: (_, item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-12 object-cover rounded border border-[#ded7d1]"
            />
          ) : (
            <div className="w-12 h-12 bg-[#f4f0ec] rounded flex items-center justify-center text-xs text-[#8b5e4b]">
              No Img
            </div>
          )}
          <div>
            <div className="font-medium text-[#28120b]">{item.name}</div>
            {item.sku && <div className="text-xs text-[#8b5e4b]">SKU: {item.sku}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      align: 'center',
    },
    {
      title: 'Price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (_, item) => `${recovery.currency || 'AED'} ${(item.price || 0).toFixed(2)}`,
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg text-[#28120b]">Abandoned Cart Details</span>
          {recovery.status && getStatusTag(recovery.status)}
        </div>
      }
      open={visible}
      onClose={onClose}
      width={680}
      className="abandoned-cart-drawer"
    >
      {isLoading ? (
        <div className="py-20 text-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Customer & Cart Overview */}
          <Descriptions bordered size="small" column={2} className="bg-white">
            <Descriptions.Item label="Customer">
              {recovery.user?.firstName
                ? `${recovery.user.firstName} ${recovery.user.lastName || ''}`
                : 'Guest / Registered'}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{recovery.email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Last Cart Activity">
              {recovery.lastActivityAt
                ? dayjs(recovery.lastActivityAt).format('DD MMM YYYY, hh:mm A')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Current Stage">
              <Tag color="blue">{recovery.currentStage || 'ACTIVE'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Cart Total">
              <span className="font-bold text-[#28120b]">
                {recovery.currency || 'AED'} {(recovery.cartValue || 0).toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Total Items">{recovery.totalQuantity || 0}</Descriptions.Item>
          </Descriptions>

          {/* Recovery Coupon Section */}
          <div className="bg-[#f9f5f2] border border-[#ded7d1] rounded p-4">
            <div className="flex items-center gap-2 mb-3 text-[#28120b] font-semibold">
              <Gift size={18} className="text-[#8b5e4b]" />
              <span>24-Hour Recovery Coupon & Secure Claim Status</span>
            </div>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Coupon Code">
                {recovery.couponCode ? (
                  <Tag color="purple" className="font-mono font-bold text-sm">
                    {recovery.couponCode}
                  </Tag>
                ) : (
                  <span className="text-gray-400">Not generated yet (triggered at 24h)</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Claim Status">
                {recovery.isClaimed ? (
                  <Tag color="green">Claimed by Customer</Tag>
                ) : recovery.couponCode ? (
                  <Tag color="orange">Unclaimed</Tag>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              {recovery.claimedAt && (
                <Descriptions.Item label="Claimed At">
                  {dayjs(recovery.claimedAt).format('DD MMM YYYY, hh:mm A')}
                </Descriptions.Item>
              )}
              {recovery.claimTokenExpiresAt && (
                <Descriptions.Item label="Token Expires">
                  {dayjs(recovery.claimTokenExpiresAt).format('DD MMM YYYY, hh:mm A')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>

          {/* Converted Order Details if Recovered */}
          {recovery.status === 'RECOVERED' && (
            <div className="bg-[#e6ffcc] border border-[#c3e8a4] rounded p-4">
              <div className="flex items-center gap-2 mb-2 text-[#28120b] font-semibold">
                <CheckCircle2 size={18} className="text-[#3d1e10]" />
                <span>Successfully Recovered Order</span>
              </div>
              <div className="text-sm text-[#28120b] space-y-1">
                <div>
                  Order Number:{' '}
                  <strong>#{recovery.recoveredOrderId?.orderId || recovery.recoveredOrderId?._id || '—'}</strong>
                </div>
                <div>
                  Recovered At:{' '}
                  {recovery.recoveredAt ? dayjs(recovery.recoveredAt).format('DD MMM YYYY, hh:mm A') : '—'}
                </div>
              </div>
            </div>
          )}

          {/* Cart Snapshot Items */}
          <div>
            <h4 className="font-serif text-base text-[#28120b] mb-2 flex items-center gap-2">
              <ShoppingCart size={16} />
              <span>Cart Snapshot at Abandonment</span>
            </h4>
            <Table
              columns={itemColumns}
              dataSource={recovery.cartSnapshot || []}
              rowKey={(r) => r.sku || r.product || Math.random()}
              pagination={false}
              size="small"
              bordered
            />
          </div>

          {/* Email Transmission Timeline */}
          <div>
            <h4 className="font-serif text-base text-[#28120b] mb-3 flex items-center gap-2">
              <Mail size={16} />
              <span>Automated Recovery Email Sequence</span>
            </h4>
            <Timeline
              items={[
                {
                  color: recovery.firstReminderSentAt ? 'green' : 'gray',
                  children: (
                    <div>
                      <div className="font-semibold text-[#28120b]">Stage 1 (6 Hours Reminder)</div>
                      <div className="text-xs text-gray-500">
                        {recovery.firstReminderSentAt
                          ? `Sent on ${dayjs(recovery.firstReminderSentAt).format('DD MMM YYYY, hh:mm A')}`
                          : 'Pending (fires 6 hours after last activity)'}
                      </div>
                    </div>
                  ),
                },
                {
                  color: recovery.secondReminderSentAt ? 'green' : 'gray',
                  children: (
                    <div>
                      <div className="font-semibold text-[#28120b]">Stage 2 (12 Hours Reminder)</div>
                      <div className="text-xs text-gray-500">
                        {recovery.secondReminderSentAt
                          ? `Sent on ${dayjs(recovery.secondReminderSentAt).format('DD MMM YYYY, hh:mm A')}`
                          : 'Pending (fires 12 hours after last activity)'}
                      </div>
                    </div>
                  ),
                },
                {
                  color: recovery.couponEmailSentAt ? 'purple' : 'gray',
                  children: (
                    <div>
                      <div className="font-semibold text-[#28120b]">Stage 3 (24 Hours Coupon Email)</div>
                      <div className="text-xs text-gray-500">
                        {recovery.couponEmailSentAt
                          ? `Sent on ${dayjs(recovery.couponEmailSentAt).format('DD MMM YYYY, hh:mm A')}`
                          : 'Pending (fires 24 hours after last activity)'}
                      </div>
                    </div>
                  ),
                },
                {
                  color: recovery.finalReminderSentAt ? 'red' : 'gray',
                  children: (
                    <div>
                      <div className="font-semibold text-[#28120b]">Stage 4 (48 Hours Final Reminder)</div>
                      <div className="text-xs text-gray-500">
                        {recovery.finalReminderSentAt
                          ? `Sent on ${dayjs(recovery.finalReminderSentAt).format('DD MMM YYYY, hh:mm A')}`
                          : 'Pending (fires 48 hours after last activity)'}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Audit Logs */}
          {recovery.logs?.length > 0 && (
            <div>
              <h4 className="font-serif text-sm text-[#8b5e4b] uppercase tracking-wider mb-2">Audit History</h4>
              <div className="bg-[#f9f5f2] rounded p-3 text-xs space-y-2 border border-[#ded7d1]">
                {recovery.logs.map((log, index) => (
                  <div key={index} className="flex items-start justify-between border-b border-[#ede8e4] pb-1 last:border-0 last:pb-0">
                    <div>
                      <span className="font-semibold text-[#28120b]">{log.stage}:</span> {log.error || log.status}
                    </div>
                    <span className="text-gray-400 whitespace-nowrap ml-2">
                      {dayjs(log.sentAt).format('DD/MM HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
