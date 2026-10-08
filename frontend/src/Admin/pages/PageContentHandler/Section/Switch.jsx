/* eslint-disable react/prop-types */

const Switch = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all ${
      checked ? 'bg-blue-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 rounded-full bg-white transition-transform transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default Switch;
