import { useMemo, useState } from 'react';
import { Form, Input, Select, message } from 'antd';
import { Country } from 'country-state-city';
import Banner from '../components/global/Banner';
import CategoryNavBar from '../components/global/CategoryNavBar';
import NewsLetter from '../components/global/NewsLetter';
import Section10 from '../components/home/Section10';
import { CommonButton } from '../components/global/UIButtons';
import { useTranslationContext } from '../context/TranslationContext';
import { createSupport } from '../apis/nonAuth/support';
import bg from '../assets/bg.png';

const ContactUs = () => {
  const {
    translateLanguage,
    content: { common, contact },
  } = useTranslationContext();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryCodeOptions = useMemo(
    () =>
      Country.getAllCountries()
        .filter((country) => country.phonecode)
        .map((country) => ({
          value: `+${country.phonecode}`,
          label: `${country.flag} ${country.name} (+${country.phonecode})`,
          searchText: `${country.name} +${country.phonecode}`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    []
  );

  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      await createSupport({
        ...values,
        locale: translateLanguage || 'en',
        source: 'contact-us',
      });
      message.success(contact.submitSuccess);
      form.resetFields();
    } catch (error) {
      message.error(error?.response?.data?.message || contact.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Banner bg={bg}>
        <div className="w-full py-24 md:py-12 md:mt-12">
          <CategoryNavBar />
          <div className="border-y border-black bg-white px-5 py-8 md:px-20">
            <h1 className="text-3xl font-[700] text-black md:text-5xl">
              {contact.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm text-black/70 md:text-lg">
              {contact.subtitle}
            </p>
          </div>

          <main className="bg-white px-5 py-10 md:px-20">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[28px] border border-black p-6 md:p-10">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{ phoneCountryCode: '+971' }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Form.Item
                      label={contact.name}
                      name="name"
                      rules={[{ required: true, message: contact.requiredName }]}
                    >
                      <Input placeholder={contact.namePlaceholder} size="large" />
                    </Form.Item>
                    <Form.Item
                      label={contact.email}
                      name="email"
                      rules={[
                        { required: true, message: contact.requiredEmail },
                        { type: 'email', message: contact.requiredEmail },
                      ]}
                    >
                      <Input placeholder={contact.emailPlaceholder} size="large" />
                    </Form.Item>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                    <Form.Item
                      label={contact.phoneCountryCode}
                      name="phoneCountryCode"
                      rules={[
                        { required: true, message: contact.requiredPhoneCode },
                      ]}
                    >
                      <Select
                        size="large"
                        showSearch
                        placeholder={contact.countryCodePlaceholder}
                        optionFilterProp="label"
                        options={countryCodeOptions}
                        filterOption={(input, option) =>
                          option?.searchText
                            ?.toLowerCase()
                            .includes(input.toLowerCase()) ?? false
                        }
                      />
                    </Form.Item>
                    <Form.Item
                      label={contact.phoneNumber}
                      name="phoneNumber"
                      rules={[
                        { required: true, message: contact.requiredPhoneNumber },
                      ]}
                    >
                      <Input
                        placeholder={contact.phoneNumberPlaceholder}
                        size="large"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label={contact.query}
                    name="query"
                    rules={[{ required: true, message: contact.requiredQuery }]}
                  >
                    <Input.TextArea
                      rows={7}
                      placeholder={contact.queryPlaceholder}
                    />
                  </Form.Item>

                  <CommonButton
                    htmlType="submit"
                    variant={6}
                    size="md"
                    className="mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? common.processing : common.submit}
                  </CommonButton>
                </Form>
              </section>

              <aside className="rounded-[28px] border border-black bg-black p-6 text-white md:p-10">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  {common.customerSupport}
                </p>
                <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
                  {contact.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/75 md:text-base">
                  {contact.subtitle}
                </p>
                <div className="mt-8 space-y-4 rounded-[24px] bg-white/10 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {common.email}
                    </p>
                    <p className="mt-2 text-lg">support@mmmk-wode.com</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {contact.phoneNumber}
                    </p>
                    <p className="mt-2 text-lg">+971 582908669</p>
                  </div>
                </div>
              </aside>
            </div>
          </main>

          <div className="w-full text-black bg-white">
            <Section10 />
          </div>
          <div className="py-10">
            <NewsLetter />
          </div>
        </div>
      </Banner>
    </div>
  );
};

export default ContactUs;
