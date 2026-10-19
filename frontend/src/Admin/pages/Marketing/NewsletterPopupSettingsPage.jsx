import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Row,
  Col,
  Slider,
  Select,
  Radio,
  message,
  Spin,
  Divider,
  Alert,
} from 'antd';
import {
  LuSparkles,
  LuClock,
  LuTag,
  LuSave,
  LuEye,
  LuArrowRight,
  LuCheck,
  LuGift,
} from 'react-icons/lu';
import PageTitle from '../../UI/PageTitle';
import {
  getPopupSettingsAdmin,
  updatePopupSettingsAdmin,
  getAvailableCouponsAdmin,
} from '../../../apis/admin/newsletterAdmin';

const { TextArea } = Input;

export default function NewsletterPopupSettingsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [couponMode, setCouponMode] = useState('custom'); // 'custom' | 'existing'

  // Watch form fields for live visual preview
  const enabled = Form.useWatch('enabled', form);
  const title = Form.useWatch('title', form);
  const subtitle = Form.useWatch('subtitle', form);
  const offerCoupon = Form.useWatch('offerCoupon', form);
  const discountCode = Form.useWatch('discountCode', form);
  const discountValue = Form.useWatch('discountValue', form);
  const discountType = Form.useWatch('discountType', form);
  const discountText = Form.useWatch('discountText', form);
  const buttonText = Form.useWatch('buttonText', form);
  const delaySeconds = Form.useWatch('delaySeconds', form);
  const displayFrequencyDays = Form.useWatch('displayFrequencyDays', form);

  // Fetch settings
  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['newsletter-popup-settings'],
    queryFn: getPopupSettingsAdmin,
  });

  // Fetch available store coupons
  const { data: couponsData } = useQuery({
    queryKey: ['available-store-coupons'],
    queryFn: getAvailableCouponsAdmin,
  });

  const availableCoupons = couponsData?.data || [];

  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      form.setFieldsValue({
        enabled: s.enabled !== false,
        title: s.title || 'JOIN THE MAISON MMMK WODE',
        subtitle:
          s.subtitle ||
          'Enjoy exclusive privileges and receive private invitations to new releases.',
        offerCoupon: s.offerCoupon !== false,
        discountCode: s.discountCode || 'WELCOME15',
        discountValue: s.discountValue !== undefined ? s.discountValue : 15,
        discountType: s.discountType || 'percentage',
        discountText: s.discountText || 'Use code at checkout for 15% off',
        buttonText: s.buttonText || 'CLAIM MY PRIVILEGE',
        delaySeconds: s.delaySeconds || 6,
        displayFrequencyDays: s.displayFrequencyDays || 7,
      });
    }
  }, [settingsData, form]);

  // Handle selecting an existing coupon
  const handleSelectExistingCoupon = (selectedCode) => {
    const found = availableCoupons.find((c) => c.couponCode === selectedCode);
    if (found) {
      form.setFieldsValue({
        discountCode: found.couponCode,
        discountValue: found.discount || 0,
        discountType: found.discountType || 'percentage',
        discountText: `Use code ${found.couponCode} at checkout for ${found.discount}${
          found.discountType === 'percentage' ? '%' : ''
        } off`,
      });
    }
  };

  // Save settings mutation
  const mutation = useMutation({
    mutationFn: (values) => updatePopupSettingsAdmin(values),
    onSuccess: (res) => {
      message.success(
        res?.message || 'Popup settings and discount coupon saved successfully'
      );
      queryClient.invalidateQueries(['newsletter-popup-settings']);
      queryClient.invalidateQueries(['available-store-coupons']);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to save settings');
    },
  });

  const onFinish = (values) => {
    mutation.mutate(values);
  };

  if (isSettingsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <PageTitle title="Email Popup & Coupon Management" />

      <Row gutter={[24, 24]}>
        {/* Left Column: Form Settings */}
        <Col xs={24} lg={13}>
          <Card
            bordered={false}
            className="rounded-xl border border-stone-200/80 shadow-sm"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                enabled: true,
                offerCoupon: true,
                delaySeconds: 6,
                displayFrequencyDays: 7,
                discountType: 'percentage',
                discountValue: 15,
                discountCode: 'WELCOME15',
                buttonText: 'CLAIM MY PRIVILEGE',
              }}
            >
              {/* Enable Switch */}
              <div className="mb-6 flex items-center justify-between rounded-xl bg-stone-50 p-4 border border-stone-200">
                <div>
                  <h4 className="font-semibold text-stone-800 text-sm">
                    Activate Storefront Popup
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    When enabled, visitors will receive the subscription invitation after the delay.
                  </p>
                </div>
                <Form.Item name="enabled" valuePropName="checked" noStyle>
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </div>

              {/* Coupon Management Section */}
              <div className="rounded-xl border border-[#dfba73]/40 bg-[#dfba73]/5 p-4.5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LuGift className="text-[#dfba73]" size={18} />
                    <h4 className="font-semibold text-stone-900 text-sm">
                      Offer Discount Coupon to Subscribers
                    </h4>
                  </div>
                  <Form.Item name="offerCoupon" valuePropName="checked" noStyle>
                    <Switch checkedChildren="YES" unCheckedChildren="NO" />
                  </Form.Item>
                </div>
                <p className="text-xs text-stone-600 mb-4">
                  Reward customers who subscribe with an instant voucher code valid at checkout.
                </p>

                {offerCoupon && (
                  <div className="space-y-4 pt-2 border-t border-[#dfba73]/20">
                    {/* Mode Selector */}
                    <div>
                      <span className="text-xs font-semibold text-stone-700 block mb-1.5">
                        Coupon Source:
                      </span>
                      <Radio.Group
                        value={couponMode}
                        onChange={(e) => setCouponMode(e.target.value)}
                        size="small"
                      >
                        <Radio.Button value="custom">Create / Custom Coupon</Radio.Button>
                        <Radio.Button
                          value="existing"
                          disabled={availableCoupons.length === 0}
                        >
                          Select Existing Store Coupon ({availableCoupons.length})
                        </Radio.Button>
                      </Radio.Group>
                    </div>

                    {couponMode === 'existing' && availableCoupons.length > 0 && (
                      <Form.Item label="Select Store Coupon" tooltip="Select an existing coupon already created in store">
                        <Select
                          placeholder="Choose an existing coupon..."
                          onChange={handleSelectExistingCoupon}
                          options={availableCoupons.map((c) => ({
                            label: `${c.couponCode} — ${c.discount}${
                              c.discountType === 'percentage' ? '%' : ' off'
                            }`,
                            value: c.couponCode,
                          }))}
                        />
                      </Form.Item>
                    )}

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Coupon Code"
                          name="discountCode"
                          tooltip="The exact promo code customers enter at checkout."
                          rules={[{ required: true, message: 'Please enter promo code' }]}
                        >
                          <Input
                            placeholder="e.g. WELCOME15"
                            className="uppercase font-mono font-bold"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Discount Value & Type"
                          rules={[{ required: true }]}
                        >
                          <Space.Compact className="w-full">
                            <Form.Item
                              name="discountValue"
                              noStyle
                              rules={[{ required: true, message: 'Enter discount value' }]}
                            >
                              <InputNumber
                                min={1}
                                max={100}
                                placeholder="15"
                                className="w-2/3"
                              />
                            </Form.Item>
                            <Form.Item name="discountType" noStyle>
                              <Select
                                className="w-1/3"
                                options={[
                                  { label: '%', value: 'percentage' },
                                  { label: 'Amount', value: 'amount' },
                                ]}
                              />
                            </Form.Item>
                          </Space.Compact>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Offer Badge Text"
                          name="discountText"
                          tooltip="Highlighted text shown inside the popup offer banner."
                        >
                          <Input placeholder="e.g. Use code at checkout for 15% off" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Button Label"
                          name="buttonText"
                          tooltip="CTA button text in the popup."
                        >
                          <Input placeholder="e.g. CLAIM MY 15% PRIVILEGE" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Alert
                      type="success"
                      showIcon
                      message="Automatic Checkout Validation"
                      description="When you save, this coupon is automatically activated in the store's checkout system. Customers can apply it at checkout immediately with 0 errors."
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              <Divider className="my-5" />

              {/* Timing Controls */}
              <h4 className="text-xs uppercase font-bold tracking-wider text-stone-400 mb-4 flex items-center gap-1.5">
                <LuClock size={14} />
                <span>Display & Timing Rules</span>
              </h4>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Trigger Delay (seconds)"
                    name="delaySeconds"
                    tooltip="How many seconds after visitor lands on the site before showing the popup."
                    rules={[{ required: true, message: 'Please specify delay seconds' }]}
                  >
                    <Slider min={1} max={30} marks={{ 1: '1s', 6: '6s', 15: '15s', 30: '30s' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Dismissed Cooldown (days)"
                    name="displayFrequencyDays"
                    tooltip="If a visitor closes the popup without subscribing, hide it for this many days."
                    rules={[{ required: true, message: 'Please specify frequency days' }]}
                  >
                    <InputNumber min={1} max={90} className="w-full" addonAfter="Days" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider className="my-5" />

              {/* Promotional Content */}
              <h4 className="text-xs uppercase font-bold tracking-wider text-stone-400 mb-4 flex items-center gap-1.5">
                <LuTag size={14} />
                <span>Headlines & Copywriting</span>
              </h4>

              <Form.Item
                label="Popup Title"
                name="title"
                rules={[{ required: true, message: 'Please enter title' }]}
              >
                <Input placeholder="e.g. JOIN THE MAISON MMMK WODE" />
              </Form.Item>

              <Form.Item
                label="Subtitle & Description"
                name="subtitle"
                rules={[{ required: true, message: 'Please enter subtitle' }]}
              >
                <TextArea
                  rows={2}
                  placeholder="e.g. Enjoy exclusive privileges and receive private invitations to new releases."
                />
              </Form.Item>

              <div className="mt-8 flex justify-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LuSave size={15} />}
                  loading={mutation.isPending}
                  className="bg-[#dfba73] hover:!bg-[#cda65b] border-none text-black font-medium px-6 h-10"
                >
                  Save Configuration & Sync Coupon
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        {/* Right Column: Live Interactive Visual Preview */}
        <Col xs={24} lg={11}>
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase font-bold tracking-wider text-stone-500 flex items-center gap-1.5">
                <LuEye size={14} />
                <span>Live Storefront Preview</span>
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {enabled ? 'Active on Storefront' : 'Currently Inactive'}
              </span>
            </div>

            {/* Preview Card */}
            <div className="relative overflow-hidden rounded-2xl border border-[#dfba73]/30 bg-gradient-to-b from-[#181411] via-[#100c0a] to-[#0a0706] p-7 shadow-2xl text-white">
              {/* Gold radial aura */}
              <div className="pointer-events-none absolute -top-16 left-1/2 h-44 w-56 -translate-x-1/2 rounded-full bg-[#dfba73]/15 blur-2xl" />

              <div className="relative text-center">
                {/* Brand Tag Pill */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#dfba73]/30 bg-[#dfba73]/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#dfba73]">
                  <LuSparkles size={11} />
                  <span>Maison Privilege</span>
                </div>

                {/* Title */}
                <h3 className="mt-3 font-serif text-xl font-normal tracking-wide text-white">
                  {title || 'JOIN THE MAISON MMMK WODE'}
                </h3>

                {/* Subtitle */}
                <p className="mt-2 text-xs leading-relaxed text-stone-300">
                  {subtitle ||
                    'Enjoy exclusive privileges and receive private invitations to new releases.'}
                </p>

                {/* Discount Highlight Banner (Only if offerCoupon is ON) */}
                {offerCoupon && (
                  <div className="mt-3 rounded-lg border border-[#dfba73]/20 bg-[#dfba73]/5 py-2 px-3 text-center">
                    <span className="text-[11px] uppercase tracking-wider text-[#dfba73]">
                      {discountText || `Use code ${discountCode || 'WELCOME15'} at checkout`}
                    </span>
                  </div>
                )}

                {/* Preview Input & Button */}
                <div className="mt-5 space-y-2.5 text-left">
                  <input
                    type="email"
                    readOnly
                    placeholder="Enter your email address"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-stone-500 cursor-not-allowed"
                  />
                  <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e7cb8c] via-[#dfba73] to-[#cba358] py-2.5 px-4 font-semibold text-black text-xs tracking-wider shadow">
                    <span>
                      {buttonText || (offerCoupon ? 'CLAIM MY PRIVILEGE' : 'JOIN THE MAISON')}
                    </span>
                    <LuArrowRight size={13} />
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-stone-500">
                  No thank you, I prefer full price
                </p>
              </div>

              {/* Preview Footer note */}
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400">
                <span>Triggers after: {delaySeconds || 6}s</span>
                <span>
                  {offerCoupon
                    ? `Coupon: ${discountCode || 'WELCOME15'} (${discountValue || 15}${
                        discountType === 'percentage' ? '%' : ''
                      })`
                    : 'Coupon: Disabled'}
                </span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
