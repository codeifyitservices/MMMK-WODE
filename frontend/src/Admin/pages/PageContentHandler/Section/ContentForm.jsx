import { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { motion, AnimatePresence } from 'framer-motion';
import Switch from './Switch';

const ContentForm = () => {
  const [language, setLanguage] = useState('en');
  const [formData, setFormData] = useState({
    bannerContent: { title: { en: '', ar: '' }, subtitle: { en: '', ar: '' } }, // Fix here
    section2Content: { en: '', ar: '' },
    section3Content: { en: '', ar: '' },
    section5Content: { en: '', ar: '' },
    section6Content: { en: '', ar: '' },
    section7Content: { en: '', ar: '' },
    section8Content: { en: '', ar: '' },
    section9Content: { en: '', ar: '' },
    section10Content: { en: '', ar: '' },
    recommendedSection: { en: '', ar: '' },
    luxurySection: { en: '', ar: '' },
    shopInstant: { en: '', ar: '' },
    enquiry: { en: '', ar: '' },
    newsLetter: { en: '', ar: '' },
    highlighter: { en: [], ar: [] },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [videoData, setVideoData] = useState({ video: null, name: '' });
  const [editableSections, setEditableSections] = useState({});

  // Handle language toggle
  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  // Handle changes in CKEditor for specific sections and languages
  const handleEditorChange = (section, lang, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [section]: {
        ...prevState[section],
        [lang]: value,
      },
    }));
  };

  // Add highlighter modal toggle
  const handleAddHighlighter = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setVideoData({ video: null, name: '' });
  };

  const handleVideoUpload = (e) => {
    setVideoData((prev) => ({ ...prev, video: e.target.files[0] }));
  };

  const handleNameChange = (e) => {
    setVideoData((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleSaveHighlighter = () => {
    if (videoData.video && videoData.name) {
      setFormData((prevState) => ({
        ...prevState,
        highlighter: {
          ...prevState.highlighter,
          [language]: [
            ...prevState.highlighter[language],
            { name: videoData.name, video: videoData.video },
          ],
        },
      }));
      closeModal();
    } else {
      alert('Please provide both a video and a name.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Submit both the English and Arabic content when the form is submitted
  };

  const toggleEditMode = (section) => {
    setEditableSections((prev) => ({
      ...prev,
      [section]: !prev[section], // Toggle the edit mode of the specific section
    }));
  };

  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center justify-end mb-6 space-x-2">
        <label htmlFor="language-toggle" className="text-base font-medium">
          {language === 'en' ? 'EN' : 'AR'}
        </label>
        <Switch checked={language === 'ar'} onChange={handleLanguageToggle} />
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="p-6 space-y-6 bg-white rounded-lg shadow-md h-[90vh] overflow-y-scroll"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-6 text-3xl font-semibold text-center">
          Home - MMMK WODE
        </h1>

        {/* Highlighter Section */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-4 text-2xl font-semibold">Highlighter Section</h2>
          <div>
            {formData.highlighter[language].map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center mb-2 space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span>{item.name}</span>
                <span className="text-sm text-gray-500">{item.video.name}</span>
              </motion.div>
            ))}
          </div>
          <button
            onClick={handleAddHighlighter}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded"
          >
            Add More
          </button>
        </motion.div>

        {/* Form Sections with CKEditor */}
        {[
          'bannerContent',
          'section2Content',
          'section3Content',
          'section5Content',
          'section6Content',
          'section7Content',
          'section8Content',
          'section9Content',
          'section10Content',
          'recommendedSection',
          'luxurySection',
          'shopInstant',
          'enquiry',
          'newsLetter',
        ].map((section, idx) => (
          <motion.div
            key={section}
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
          >
            <h2 className="mb-4 text-2xl font-semibold">{section}</h2>
            <div className="space-y-4">
              {/* English Field */}
              {language === 'en' && (
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-medium">English</label>
                  <button
                    onClick={() => toggleEditMode(`${section}-en`)}
                    className="px-4 py-2 border rounded"
                  >
                    {editableSections[`${section}-en`] ? 'Close' : 'Edit'}
                  </button>
                </div>
              )}
              {language === 'en' && (
                <CKEditor
                  editor={ClassicEditor}
                  data={formData[section].en}
                  onChange={(event, editor) =>
                    handleEditorChange(section, 'en', editor.getData())
                  }
                  config={{
                    placeholder: `Enter content for ${section} in English`,
                    isReadOnly: !editableSections[`${section}-en`],
                  }}
                />
              )}

              {/* Arabic Field */}
              {language === 'ar' && (
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-medium">Arabic</label>
                  <button
                    onClick={() => toggleEditMode(`${section}-ar`)}
                    className="px-4 py-2 border rounded"
                  >
                    {editableSections[`${section}-ar`] ? 'Close' : 'Edit'}
                  </button>
                </div>
              )}
              {language === 'ar' && (
                <CKEditor
                  editor={ClassicEditor}
                  data={formData[section].ar}
                  onChange={(event, editor) =>
                    handleEditorChange(section, 'ar', editor.getData())
                  }
                  config={{
                    placeholder: `Enter content for ${section} in Arabic`,
                    isReadOnly: !editableSections[`${section}-ar`],
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}

        {/* Modal for Adding Highlighter */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            >
              <motion.div
                className="w-[400px] p-6 bg-white rounded shadow-lg"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                <h2 className="text-2xl font-semibold">Add Highlighter</h2>
                <input
                  type="text"
                  value={videoData.name}
                  onChange={handleNameChange}
                  placeholder="Enter Video Name"
                  className="w-full px-4 py-2 mb-4 border rounded"
                />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="w-full px-4 py-2 mb-4 border rounded"
                />
                <div className="flex justify-between">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-white bg-gray-500 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveHighlighter}
                    className="px-4 py-2 text-white bg-blue-500 rounded"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="px-6 py-3 text-white bg-blue-600 rounded-lg"
          >
            Submit
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default ContentForm;
