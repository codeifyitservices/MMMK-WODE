/* eslint-disable react/prop-types */
import { useState } from 'react';

const PaymentFormModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    payerName: '',
    owner: '',
    paymentId: '',
    amount: '',
    paidAt: '',
    paymentType: '',
  });

  const paymentTypes = ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Add Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Payer Name</label>
            <input
              type="text"
              name="payerName"
              value={formData.payerName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Owner</label>
            <input
              type="text"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Payment ID</label>
            <input
              type="text"
              name="paymentId"
              value={formData.paymentId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Paid At</label>
            <input
              type="date"
              name="paidAt"
              value={formData.paidAt}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">
              Payment Type
            </label>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
            >
              <option value="">Select Payment Type</option>
              {paymentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentFormModal;
