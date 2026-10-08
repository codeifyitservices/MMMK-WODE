import { useEffect, useState } from 'react';
import { Country, State } from 'country-state-city';
import { message } from 'antd';
import {
  getAddressBook,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../apis/user/profile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslationContext } from '../../context/TranslationContext';
import { CommonButton } from '../global/UIButtons';

const EMPTY_ADDRESS = {
  firstName: '',
  lastName: '',
  street_address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  company: '',
  phone_number: '',
  landmark: '',
  label: 'Home',
};

const AddressForm = ({ initial, onSave, onCancel, type }) => {
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const [stateList, setStateList] = useState(
    initial?.country ? State.getStatesOfCountry(initial.country) : []
  );
  const countryList = Country.getAllCountries();

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleCountryChange = (value) => {
    set('country', value);
    set('state', '');
    setStateList(State.getStatesOfCountry(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const inputClass =
    'w-full p-2 border-b-2 border-gray-400 outline-none focus:border-black bg-transparent';
  const labelClass = 'block mb-1 text-sm';

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border border-gray-200 rounded-lg">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Label</label>
          <select
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            className={inputClass}
          >
            {['Home', 'Work', 'Other'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>First name *</label>
          <input
            type="text"
            required
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Last name *</label>
          <input
            type="text"
            required
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>Street address *</label>
        <input
          type="text"
          required
          value={form.street_address}
          onChange={(e) => set('street_address', e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>City *</label>
          <input
            type="text"
            required
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Country *</label>
          <select
            required
            value={form.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={inputClass}
          >
            <option value=""></option>
            {countryList.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Postal code *</label>
          <input
            type="text"
            required
            value={form.postalCode}
            onChange={(e) => set('postalCode', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>State *</label>
          <select
            required
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            className={inputClass}
          >
            <option value=""></option>
            {stateList.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input
            type="tel"
            required
            value={form.phone_number}
            onChange={(e) => set('phone_number', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className={labelClass}>Landmark</label>
        <input
          type="text"
          value={form.landmark}
          onChange={(e) => set('landmark', e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <CommonButton variant={5} type="submit">Save address</CommonButton>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const AddressCard = ({ address, onEdit, onDelete, onSetDefault, loading }) => {
  const countryName =
    Country.getCountryByCode(address.country)?.name || address.country;
  const stateName =
    State.getStateByCodeAndCountry(address.state, address.country)?.name ||
    address.state;

  return (
    <div
      className={`relative p-4 border rounded-lg mb-3 transition-all ${
        address.isDefault ? 'border-black' : 'border-gray-200'
      }`}
    >
      {address.isDefault && (
        <span className="absolute top-3 right-3 text-xs font-semibold bg-black text-white px-2 py-0.5 rounded-full">
          Default
        </span>
      )}

      <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
        {address.label}
      </p>
      <p className="font-semibold text-sm">
        {address.firstName} {address.lastName}
      </p>
      {address.company && (
        <p className="text-sm text-gray-600">{address.company}</p>
      )}
      <p className="text-sm text-gray-600">{address.street_address}</p>
      <p className="text-sm text-gray-600">
        {address.city}, {stateName} {address.postalCode}
      </p>
      <p className="text-sm text-gray-600">{countryName}</p>
      {address.landmark && (
        <p className="text-sm text-gray-500">Near: {address.landmark}</p>
      )}
      <p className="text-sm text-gray-600 mt-1">{address.phone_number}</p>

      <div className="flex gap-3 mt-3">
        <button
          onClick={() => onEdit(address)}
          className="text-xs underline hover:text-black text-gray-500"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(address._id)}
          disabled={loading}
          className="text-xs underline hover:text-red-600 text-gray-500"
        >
          Delete
        </button>
        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address._id)}
            disabled={loading}
            className="text-xs underline hover:text-black text-gray-500"
          >
            Set as default
          </button>
        )}
      </div>
    </div>
  );
};

const AddressSection = ({ title, type, addresses, onRefetch }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (formData) => {
    setLoading(true);
    try {
      await addAddress(type, formData);
      message.success('Address added');
      setShowForm(false);
      onRefetch();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setLoading(true);
    try {
      await updateAddress(type, editingAddress._id, formData);
      message.success('Address updated');
      setEditingAddress(null);
      onRefetch();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteAddress(type, id);
      message.success('Address deleted');
      onRefetch();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    setLoading(true);
    try {
      await setDefaultAddress(type, id);
      message.success('Default address updated');
      onRefetch();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to set default');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <div className="w-1/4 mb-4 border-b-2 border-black" />

      {addresses?.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">No addresses saved yet.</p>
      )}

      {addresses?.map((addr) =>
        editingAddress?._id === addr._id ? (
          <AddressForm
            key={addr._id}
            initial={editingAddress}
            type={type}
            onSave={handleUpdate}
            onCancel={() => setEditingAddress(null)}
          />
        ) : (
          <AddressCard
            key={addr._id}
            address={addr}
            loading={loading}
            onEdit={(a) => {
              setShowForm(false);
              setEditingAddress(a);
            }}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        )
      )}

      {showForm && !editingAddress && (
        <AddressForm
          type={type}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && !editingAddress && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-2 flex items-center gap-2 text-sm font-medium hover:underline"
        >
          <span className="text-lg leading-none">+</span> Add new address
        </button>
      )}
    </div>
  );
};

const AddressBook = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['address-book'],
    queryFn: getAddressBook,
    retry: false,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['address-book'] });

  const shippingAddresses = query.data?.data?.shippingAddresses || [];
  const billingAddresses = query.data?.data?.billingAddresses || [];

  if (query.isLoading) {
    return <div className="p-4 md:p-20 text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-20">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <AddressSection
          title="Shipping addresses"
          type="shipping"
          addresses={shippingAddresses}
          onRefetch={refetch}
        />
        <AddressSection
          title="Billing addresses"
          type="billing"
          addresses={billingAddresses}
          onRefetch={refetch}
        />
      </div>
    </div>
  );
};

export default AddressBook;