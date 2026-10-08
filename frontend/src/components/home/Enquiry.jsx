import { Button3, CommonButton } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import {
  ConfigProvider,
  Form,
  Input,
  message,
  Modal,
  notification,
} from 'antd';
import { useState } from 'react';
import { createSupport } from '../../apis/nonAuth/support';

const Enquiry = () => {
  const {
    content: { common, homepage, enquiryModal },
    translateLanguage,
    translatePages,
  } = useTranslationContext();

  const [isOpen, setIsOpen] = useState(false);

  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    try {
      await createSupport(values);
      setIsOpen(false);
      form.resetFields();
      notification.success({
        message: enquiryModal.enquirySuccess,
        showProgress: false,
      });
    } catch (error) {
      notification.error({
        message: enquiryModal.enquiryError,
        showProgress: false,
      });
      console.error('Error submitting enquiry:', error);
    }
  };

  const handleOpenModal = async () => {
    form.resetFields();
    setIsOpen(true);
    await translatePages(['enquiryModal'], translateLanguage);
  };

  return (
    <>
      <div className="w-full flex flex-col md:flex-row justify-between py-10 md:py-[100px] px-4 md:px-20">
        {/* Left Section */}
        <div className="mb-4 text-black md:mb-0">
          <h2 className="text-2xl font-medium text-center md:text-5xl lg:text-6xl md:text-left">
            {homepage.section13Heading1}
          </h2>
        </div>

        {/* Right Section */}
        <div className="flex justify-center md:justify-start">
          <Button3 onClick={handleOpenModal}>{common.enquiry}</Button3>
        </div>
      </div>
      <ConfigProvider
        theme={{
          token: {
            fontSize: 16,
            borderRadius: 0,
            padding: 20,
          },
        }}
        input={{
          style: { borderBottom: '1px solid #ddd' },
          className: 'focus:outline-none',
        }}
        textArea={{
          style: { borderBottom: '1px solid #ddd' },
          className: 'focus:outline-none',
        }}
      >
        <Modal
          open={isOpen}
          onCancel={() => setIsOpen(false)}
          footer={null}
          width={800}
          title={enquiryModal.title}
          centered
          classNames={{ body: 'max-h-[80vh] overflow-y-auto' }}
        >
          <Form
            form={form}
            name="enquiryForm"
            layout="vertical"
            onFinish={handleFinish}
            requiredMark="optional"
            className="mt-8"
          >
            <Form.Item
              name="name"
              label={enquiryModal.name}
              rules={[{ required: true, message: enquiryModal.nameRequired }]}
            >
              <Input
                variant="underlined"
                placeholder={enquiryModal.namePlaceholder}
              />
            </Form.Item>
            <Form.Item
              name="email"
              label={enquiryModal.email}
              rules={[{ required: true, message: enquiryModal.emailRequired }]}
            >
              <Input
                type="email"
                variant="underlined"
                placeholder={enquiryModal.emailPlaceholder}
              />
            </Form.Item>
            <Form.Item name="phone" label={enquiryModal.contactNumber}>
              <Input
                variant="underlined"
                placeholder={enquiryModal.contactNumberPlaceholder}
              />
            </Form.Item>
            <Form.Item
              name="subject"
              label={enquiryModal.subject}
              rules={[
                { required: true, message: enquiryModal.subjectRequired },
              ]}
            >
              <Input
                variant="underlined"
                placeholder={enquiryModal.subjectPlaceholder}
              />
            </Form.Item>
            <Form.Item
              name="description"
              label={enquiryModal.message}
              rules={[
                { required: true, message: enquiryModal.messageRequired },
              ]}
            >
              <Input.TextArea
                rows={4}
                variant="underlined"
                placeholder={enquiryModal.messagePlaceholder}
              />
            </Form.Item>
            <CommonButton
              variant={3}
              size="md"
              type="submit"
              className="w-full"
            >
              {common.submit}
            </CommonButton>
          </Form>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default Enquiry;
