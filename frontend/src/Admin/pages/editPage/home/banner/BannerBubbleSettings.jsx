import React, { useEffect } from 'react';
import { Card, Form, Input, Button, Switch, message, Spin } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHomeBanner, updateHomeBanner } from '../../../../../apis/admin/editPage';
import BannerBubble from '../../../../../components/global/BannerBubble';
import PageTitle from '../../../../UI/PageTitle';

const BannerBubbleSettings = () => {
  const [form] = useForm();
  const queryClient = useQueryClient();

  // Fetch current banner settings
  const { data: bannerData, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: getHomeBanner,
  });

  // Watch form fields for the live preview
  const bubbleEnabled = Form.useWatch('bubbleEnabled', form);
  const bubbleText = Form.useWatch('bubbleText', form);
  const bubbleLink = Form.useWatch('bubbleLink', form);

  // Initialize form values when data is loaded
  useEffect(() => {
    if (bannerData) {
      form.setFieldsValue({
        bubbleEnabled: bannerData?.home?.banner?.bubbleEnabled ?? false,
        bubbleText: bannerData?.home?.banner?.bubbleText || '',
        bubbleLink: bannerData?.home?.banner?.bubbleLink || '',
      });
    }
  }, [bannerData, form]);

  // Mutation to update only the bubble settings
  const mutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      formData.append('bubbleEnabled', values.bubbleEnabled);
      formData.append('bubbleText', values.bubbleText || '');
      formData.append('bubbleLink', values.bubbleLink || '');
      return updateHomeBanner(formData);
    },
    onSuccess: () => {
      message.success('Banner bubble settings updated successfully');
      queryClient.invalidateQueries(['banners']);
    },
    onError: (error) => {
      console.error(error);
      message.error('Failed to update banner bubble settings');
    },
  });

  const onFinish = (values) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <PageTitle title="Banner Bubble Settings" />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        {/* Settings Form */}
        <Card className="lg:col-span-3 shadow-sm border border-neutral-100 rounded-lg">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              bubbleEnabled: false,
              bubbleText: '',
              bubbleLink: '',
            }}
          >
            <Form.Item
              label="Enable Banner Bubble"
              name="bubbleEnabled"
              valuePropName="checked"
              className="mb-6"
            >
              <Switch checkedChildren="ON" unCheckedChildren="OFF" />
            </Form.Item>

            <Form.Item
              label="Bubble Message"
              name="bubbleText"
              rules={[
                {
                  max: 40,
                  message: 'Message cannot exceed 40 characters',
                },
              ]}
              className="mb-6"
              help="Short message to display inside the cloud (e.g. 🎄 Merry Christmas!)"
            >
              <Input
                maxLength={40}
                showCount
                placeholder="Enter bubble message text..."
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Navigation Link (Optional)"
              name="bubbleLink"
              className="mb-8"
              help="URL or internal path (e.g., /product-listings) the bubble navigates to when clicked."
            >
              <Input
                placeholder="e.g. /product-listings"
                size="large"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={mutation.isPending}
                size="large"
                className="w-full"
                style={{ backgroundColor: '#635D4A', borderColor: '#635D4A' }}
              >
                Save Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Live Preview Area */}
        <Card 
          title="Interactive Preview" 
          className="lg:col-span-2 shadow-sm border border-neutral-100 rounded-lg flex flex-col"
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div className="flex-1 border border-dashed border-neutral-300 rounded-lg p-6 bg-neutral-900 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden select-none">
            <span className="absolute top-2 left-2 text-[10px] text-neutral-400 font-mono tracking-wider">LIVE PREVIEW</span>
            {bubbleEnabled && bubbleText && bubbleText.trim() !== '' ? (
              <div className="scale-95 md:scale-105 transform origin-center transition-all duration-300">
                <BannerBubble
                  text={bubbleText}
                  link={bubbleLink}
                  enabled={bubbleEnabled}
                />
              </div>
            ) : (
              <div className="text-center text-neutral-500 p-4">
                <p className="italic text-sm">Bubble is currently disabled or has no text</p>
                <p className="text-xs text-neutral-600 mt-1">Enable the toggle and type a message to see the preview</p>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-neutral-50 border border-neutral-100 rounded text-xs text-neutral-500">
            <strong>Note:</strong> The speech bubble preview uses the exact styles and animations as the public site. Try entering a link to preview the clickability hover effect!
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BannerBubbleSettings;
