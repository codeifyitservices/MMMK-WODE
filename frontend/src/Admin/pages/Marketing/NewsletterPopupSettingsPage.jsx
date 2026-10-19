import React, { useEffect } from 'react';
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
  message,
  Spin,
  Divider,
} from 'antd';
import {
  LuSparkles,
  LuClock,
  LuCalendar,
  LuTag,
  LuSave,
  LuEye,
  LuArrowRight,
} from 'react-icons/lu';
import PageTitle from '../../UI/PageTitle';
import {
  getPopupSettingsAdmin,
  updatePopupSettingsAdmin,
} from '../../../apis/admin/newsletterAdmin';

const { TextArea } = Input;

export default function NewsletterPopupSettingsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Watch form fields for live visual preview
  const enabled = Form.useWatch('enabled', form);
  const title = Form.useWatch('title', form);
  const subtitle = Form.useWatch('subtitle', form);
  const discountCode = Form.useWatch('discountCode', form);
  const discountText = Form.useWatch('discountText', form);
  const delaySeconds = Form.useWatch('delaySeconds', form);
  const displayFrequencyDays = Form.useWatch('displayFrequencyDays', form);

  // Fetch settings
  const { data, isLoading } = useQuery({
    queryKey: ['newsletter-popup-settings'],
    queryFn: getPopupSettingsAdmin,
  });

  useEffect(() => {
    if (data?.data) {
      form.setFieldsValue({
        enabled: data.data.enabled !== false,
        title: data.data.title || 'JOIN THE MAISON MMMK WODE',
        subtitle:
          data.data.subtitle ||
          'Enjoy 15% off your first purchase and receive private invitations to exclusive releases.',
        discountCode: data.data.discountCode || 'WELCOME15',
        discountText: data.data.discountText || 'Use code at checkout for 15% off',
        delaySeconds: data.data.delaySeconds || 6,
        displayFrequencyDays: data.data.displayFrequencyDays || 7,
      });
    }
  }, [data, form]);

  // Save settings mutation
  const mutation = useMutation({
    mutationFn: (values) => updatePopupSettingsAdmin(values),
    onSuccess: () => {
      message.success('Newsletter popup settings saved successfully');
      queryClient.invalidateQueries(['newsletter-popup-settings']);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to save settings');
    },
  });

  const onFinish = (values) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <PageTitle title="Email Popup Configuration" />

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
                delaySeconds: 6,
                displayFrequencyDays: 7,
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
                <span>Marketing & Copywriting</span>
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
                  placeholder="e.g. Enjoy 15% off your first purchase and receive private invitations to exclusive releases."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Welcome Coupon Code"
                    name="discountCode"
                    rules={[{ required: true, message: 'Please enter voucher code' }]}
                  >
                    <Input placeholder="e.g. WELCOME15" className="uppercase font-mono font-semibold" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Offer Badge Text"
                    name="discountText"
                    rules={[{ required: true, message: 'Please enter offer text' }]}
                  >
                    <Input placeholder="e.g. Use code at checkout for 15% off" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="mt-8 flex justify-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LuSave size={15} />}
                  loading={mutation.isPending}
                  className="bg-[#dfba73] hover:!bg-[#cda65b] border-none text-black font-medium px-6 h-10"
                >
                  Save Configuration
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
                    'Enjoy 15% off your first purchase and receive private invitations to exclusive releases.'}
                </p>

                {/* Discount Highlight Banner */}
                <div className="mt-3 rounded-lg border border-[#dfba73]/20 bg-[#dfba73]/5 py-2 px-3 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-[#dfba73]">
                    {discountText || 'Use code at checkout for 15% off'}
                  </span>
                </div>

                {/* Preview Input & Button */}
                <div className="mt-5 space-y-2.5 text-left">
                  <input
                    type="email"
                    readOnly
                    placeholder="Enter your email address"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-stone-500 cursor-not-allowed"
                  />
                  <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e7cb8c] via-[#dfba73] to-[#cba358] py-2.5 px-4 font-semibold text-black text-xs tracking-wider shadow">
                    <span>CLAIM 15% PRIVILEGE</span>
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
                <span>Cooldown: {displayFrequencyDays || 7} days</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
