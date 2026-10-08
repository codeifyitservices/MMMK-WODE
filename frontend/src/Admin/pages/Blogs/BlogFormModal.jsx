/* eslint-disable react/prop-types */
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const BlogFormModal = ({ toggleModal }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [trendy, setTrendy] = useState('');
  const [badges, setBadges] = useState([]);

  const handleBadgeAdd = () => {
    if (trendy && badges.length < 3) {
      setBadges([...badges, trendy]);
      setTrendy(''); // Clear input after adding badge
    }
  };

  const handleBadgeRemove = (badge) => {
    setBadges(badges.filter((item) => item !== badge));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Log the form data to the console
    

    // Close modal after form submission
    toggleModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div className="p-8 bg-white rounded-lg w-96">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Add Blog</h2>
          <button onClick={toggleModal}>
            <FaTimes className="text-xl text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Blog Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Image
            </label>
            <input
              type="file"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
            {image && (
              <img
                src={image}
                alt="Blog"
                className="object-cover w-20 h-20 mt-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Top Trendy
            </label>
            <div className="flex items-center justify-start gap-2">
              <input
                type="text"
                value={trendy}
                onChange={(e) => setTrendy(e.target.value)}
                className="w-3/4 px-4 py-2 mt-3 border border-gray-300 rounded-md"
                maxLength={20}
              />
              <button
                type="button"
                onClick={handleBadgeAdd}
                className="px-4 py-2 text-white bg-blue-500 rounded-md"
                disabled={badges.length >= 3 || !trendy}
              >
                Add
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-green-200 rounded-full"
                >
                  <span>{badge}</span>
                  <FaTimes
                    className="text-red-500 cursor-pointer"
                    onClick={() => handleBadgeRemove(badge)}
                  />
                </div>
              ))}
            </div>

            {badges.length === 3 && (
              <p className="mt-2 text-red-500">
                You can only add 3 trendy captions.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={toggleModal}
              className="px-4 py-2 text-white bg-gray-400 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 rounded-md"
            >
              Create Blog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogFormModal;
