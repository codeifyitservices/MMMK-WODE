import { message } from 'antd';
import { useEffect, useState } from 'react';
import { getMyAccount, updateMyAccount } from '../../apis/user/profile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslationContext } from '../../context/TranslationContext';
import { CommonButton } from '../global/UIButtons';

const MyAccounts = () => {
  const {
    content: { profile, common },
  } = useTranslationContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    contactNumber: '',
    email: '',
    gender: '',
  });

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyAccount(),
    retry: false,
  });

  const updateQueryCache = (newData) => {
    queryClient.setQueryData(['my-profile'], (oldData) => {
      return { ...oldData, data: newData };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.dateOfBirth ||
      !formData.email
      // !formData.contactNumber ||
      // !formData.gender
    ) {
      message.warning('All fields are required');
      return null;
    }
    setLoading(true);

    try {
      const res = await updateMyAccount(formData);
      updateQueryCache(res?.data);
      setLoading(false);
      message.success('My account updated successfully');
    } catch (err) {
      
      setLoading(false);
      message.err(
        err?.response?.data?.message || 'Failed to update my account'
      );
    }
  };

  const formatDate = (isoString) => {
    return isoString ? isoString.split('T')[0] : '';
  };

  const handleInputChange = (key, value) => {
    setFormData((prevData) => {
      return { ...prevData, [key]: value };
    });
  };

  useEffect(() => {
    if (query.data) {
      const { firstName, lastName, dateOfBirth, contactNumber, email, gender } =
        query?.data?.data;
      setFormData({
        firstName,
        lastName,
        dateOfBirth: formatDate(dateOfBirth),
        contactNumber,
        email,
        gender,
      });
    }
  }, [query.data]);

  return (
    <div className="w-full sm:w-[80%] md:w-[70%] lg:w-[60%] mx-auto md:-ml-12">
      <h3 className="text-2xl sm:text-5xl lg:text-6xl brown-text font-[700] md:mt-0 -mt-4">
        {profile.personalInformation}
      </h3>
      <hr className="w-[30%] sm:w-[20%] h-[5px] bg-[#28120b]" />

      {/* Form Fields */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
          <div>
            <label className="block mb-1">{profile.firstName}</label>
            <input
              name="firstName"
              value={formData?.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              type="text"
              className="w-full p-2 border-b-2 border-gray-400 outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block mb-1">{profile.lastName}</label>
            <input
              name="lastName"
              value={formData?.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              type="text"
              className="w-full p-2 border-b-2 border-gray-400 outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <label className="block mb-1">{profile.dateOfBirth}</label>
          <input
            name="dateOfBirth"
            value={formData?.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            type="date"
            className="w-full p-2 border-b-2 border-gray-400 outline-none focus:border-black"
          />
        </div>

        <div className="mt-6 sm:mt-8">
          <input
            type="number"
            name="contactNumber"
            value={formData?.contactNumber}
            onChange={(e) => handleInputChange('contactNumber', e.target.value)}
            className="w-full p-2 border-b-2 border-gray-400 outline-none focus:border-black"
            placeholder={profile.contactNumber}
          />
        </div>

        <div className="mt-6 sm:mt-8">
          <select
            name="gender"
            value={formData?.gender || ''}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full p-2 border-b-2 border-gray-400 outline-none focus:border-black bg-white"
          >
            <option value="" disabled>
              {profile.selectGender}
            </option>
            <option value="male">{profile.male}</option>
            <option value="female">{profile.female}</option>
            <option value="other">{profile.other}</option>
          </select>
        </div>

        <div className="mt-6 sm:mt-8">
          <input
            value={formData?.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            name="email"
            type="email"
            className="w-full p-2 border-b-2 border-gray-400 outline-none focus:border-black"
            placeholder={profile.email}
          />
        </div>

        <CommonButton
          type="submit"
          disabled={loading}
          variant={5}
          className="mt-8"
        >
          {loading ? common.loading : common.save}
        </CommonButton>
      </form>
    </div>
  );
};

export default MyAccounts;
