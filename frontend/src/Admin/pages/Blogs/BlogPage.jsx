/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import BlogFormModal from './BlogFormModal';
import { FaPlus } from 'react-icons/fa';
import BlogTable from './BlogTable';

const BlogPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="container min-h-screen p-4 mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleModal}
          className="flex items-center px-4 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600"
        >
          <FaPlus className="mr-2" /> Add Blog
        </button>
      </div>

      {isModalOpen && <BlogFormModal toggleModal={toggleModal} />}

      <div className="grid gap-8 md:grid-cols-2 sm:grid-cols-1"></div>
      <BlogTable />
    </div>
  );
};

export default BlogPage;
