/* eslint-disable no-unused-vars */
import { useState } from 'react';

import { Modal, Form, Input, Button, Select, message } from 'antd';
import {
  deletePaymentCard,
  getPaymentMethods,
  updatePaymentMethods,
} from '../../apis/user/profile';
import { useQuery } from '@tanstack/react-query';
import { useTranslationContext } from '../../context/TranslationContext';
import { CommonButton } from '../global/UIButtons';

const getCardLogo = (cardType) => {
  const logos = {
    VISA: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png',
    MasterCard:
      'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
    AMEX: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg',
    Discover:
      'https://upload.wikimedia.org/wikipedia/commons/b/bf/Discover_Card_logo.svg',
    JCB: 'https://upload.wikimedia.org/wikipedia/commons/0/02/JCB_logo.svg',
    UnionPay:
      'https://upload.wikimedia.org/wikipedia/commons/1/1a/UnionPay_logo.svg',
    DinersClub:
      'https://upload.wikimedia.org/wikipedia/commons/4/4a/Diners_Club_Logo3.svg',
    RuPay: 'https://upload.wikimedia.org/wikipedia/commons/9/94/RuPay.svg',
    Verve:
      'https://upload.wikimedia.org/wikipedia/commons/8/89/Verve_Card_Logo.png',
    Maestro:
      'https://upload.wikimedia.org/wikipedia/commons/d/d5/Maestro_logo.svg',
  };
  return logos[cardType] || 'https://via.placeholder.com/150'; // Fallback image
};

const PaymentMethods = () => {
  const {
    content: { profile, common },
  } = useTranslationContext();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => getPaymentMethods(),
    retry: false,
  });

  const handleAddCard = async (values) => {
    try {
      await updatePaymentMethods(values);
      query.refetch();
      form.resetFields();
      setIsModalVisible(false);
    } catch (err) {
      message.error(
        err.response.data.message || 'Failed to add new payment methods'
      );
    }
  };

  // const deletePaymentCard(card._id) =
  const handleDelete = async (id) => {
    try {
      await deletePaymentCard(id);
      query.refetch();
      message.success('Card delete successfullyu');
    } catch (err) {
      message.error(
        err.response.data.message || 'Failed to delete payment card'
      );
    }
  };

  return (
    <>
      <div className="w-full">
        <div className="p-3">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div>
              <h2 className="text-3xl font-semibold">{profile.savedCards}</h2>
              <hr className="w-16 mb-6 border-black" />
            </div>
            <Button
              type="primary"
              onClick={() => setIsModalVisible(true)}
              className="bg-blue-500 text-white"
            >
              {profile.addNewCard}
            </Button>
          </div>
          <div className="w-full">
            {query.data?.data?.paymentCards?.map((card, index) => (
              <div
                key={index}
                className="bg-gray-300 p-4 flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={getCardLogo(card?.cardType)}
                    alt="Card Logo"
                    className="w-[100px] h-[25px] mr-5"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{card?.cardType}</h2>
                    <p>
                      <strong>{profile.cardNumber}: </strong>
                      {card?.cardNumber}
                    </p>
                    <p>
                      <strong>{profile.expiryDate}: </strong>
                      {card?.expiryDate}
                    </p>
                    <p>
                      <strong>{profile.cardHolderName}: </strong>
                      {card?.cardholderName}
                    </p>
                  </div>
                </div>
                <CommonButton
                  size="sm"
                  variant="danger1"
                  onClick={() => handleDelete(card._id)}
                >
                  {common.delete}
                </CommonButton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Adding New Card */}
      <Modal
        title={profile.addNewCard}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleAddCard}
          layout="vertical"
          initialValues={{
            cardType: 'VISA', // Default value, change as needed
          }}
        >
          <Form.Item
            label={profile.cardType}
            name="cardType"
            rules={[{ required: true, message: 'Please select card type' }]}
          >
            <Select>
              <Select.Option value="VISA">VISA</Select.Option>
              <Select.Option value="MasterCard">MasterCard</Select.Option>
              <Select.Option value="AMEX">AMEX</Select.Option>
              <Select.Option value="Discover">Discover</Select.Option>
              <Select.Option value="JCB">JCB</Select.Option>
              <Select.Option value="UnionPay">UnionPay</Select.Option>
              <Select.Option value="DinersClub">Diners Club</Select.Option>
              <Select.Option value="RuPay">RuPay</Select.Option>
              <Select.Option value="Verve">Verve</Select.Option>
              <Select.Option value="Maestro">Maestro</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={profile.cardNumber}
            name="cardNumber"
            rules={[{ required: true, message: 'Please enter card number' }]}
          >
            <Input maxLength={16} placeholder={profile.enterCardNumber} />
          </Form.Item>

          <Form.Item
            label={profile.expiryDate}
            name="expiryDate"
            rules={[{ required: true, message: 'Please enter expiry date' }]}
          >
            <Input placeholder="MM/YY" />
          </Form.Item>

          <Form.Item
            label={profile.cardHolderName}
            name="cardholderName"
            rules={[
              { required: true, message: 'Please enter cardholder name' },
            ]}
          >
            <Input placeholder="Enter cardholder name" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-blue-500 text-white"
            >
              {common.add}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PaymentMethods;
