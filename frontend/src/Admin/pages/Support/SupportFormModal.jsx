/* eslint-disable react/prop-types */

import { useState } from 'react';

const SupportFormModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [hasReply, setHasReply] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name,
      subject,
      message,
      reply: hasReply ? reply : 'No reply yet',
    };
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mt-1 border rounded-md"
          required
        />
      </div>

      {/* Subject Field */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700"
        >
          Subject
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 mt-1 border rounded-md"
          required
        />
      </div>

      {/* Message Field */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 mt-1 border rounded-md"
          rows="4"
          required
        />
      </div>

      {/* Reply Field */}
      <div>
        <label
          htmlFor="reply"
          className="block text-sm font-medium text-gray-700"
        >
          Reply
        </label>
        <textarea
          id="reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="w-full p-2 mt-1 border rounded-md"
          rows="3"
          disabled={!hasReply}
        />
        {/* Conditionally show Add Reply button if no reply */}
        {!hasReply && (
          <button
            type="button"
            onClick={() => setHasReply(true)}
            className="px-4 py-2 mt-2 text-white bg-blue-500 rounded-md"
          >
            Add Reply
          </button>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-white bg-gray-500 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded-md"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default SupportFormModal;
