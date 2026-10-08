import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Upload,
  message,
  Divider,
  Table,
  Select,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { addCategory, editCategory } from '../../../apis/admin/category';
import { AddButton, DeleteButton } from '../../UI/Buttons';
import { LuUpload } from 'react-icons/lu';
import { LANGUAGECODES, LANGUAGECODETONAME } from '../../../utils/staticData';
import { getTranslatedFields } from '../../../utils/getTranslatedFields';
import { FormTabs } from '../../UI/Tabs';
import { useQuery } from '@tanstack/react-query';
import { getAllFilters } from '../../../apis/admin/filter';
import { resolveAssetUrl } from '../../../utils/assetUrl';
import { appendCompressedImage } from '../../../utils/imageCompression';

const FilterDropdown = ({ value, onChange }) => {
  const filtersQuery = useQuery({
    queryKey: ['all-filters'],
    queryFn: async () => {
      const res = await getAllFilters({ pageSize: 1000 });
      return res;
    },
  });

  const filterOptions =
    filtersQuery.data?.data?.map((filter) => ({
      label: filter.filterName,
      value: filter.filterName,
    })) || [];

  return (
    <Select
      value={value}
      onChange={onChange}
      options={filterOptions}
      placeholder="Select filter"
      loading={filtersQuery.isLoading}
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  );
};

const CategoryModal = ({
  isVisible,
  onClose,
  onSubmit,
  tableQuery,
  currentEditCategory,
  setCurrentEditCategory,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [imageFile, setImageFile] = useState(null); // raw File object
  const [utils, setUtils] = useState({
    isTabLoading: false,
    activeTab: 0,
    fileList: [],
  });
  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  useEffect(() => {
    
    if (isVisible) {
      form.resetFields();
      setImageFile(null);
      updateUtils({
        isTabLoading: false,
        activeTab: 0,
        fileList: currentEditCategory
          ? [
              {
                uid: '-1',
                name: 'category-image.jpg',
                status: 'done',
                url:
                  resolveAssetUrl(currentEditCategory?.image),
              },
            ]
          : [],
      });
      if (currentEditCategory) form.setFieldsValue(currentEditCategory);
    }
  }, [currentEditCategory, isVisible]);

  const handleFinish = async () => {
    try {
      await form.validateFields();
      updateUtils({ isTabLoading: true });
      if (utils.activeTab < 2) {
        const values = form.getFieldsValue();
        try {
          if (utils.activeTab === 0) {
            const translatedNames = await getTranslatedFields(values.name);
            form.setFieldsValue({
              name: translatedNames,
            });

            
          } else if (utils.activeTab === 1) {
            const subCategories = form.getFieldValue('subcategories') || [];
            
            if (subCategories.length) {
              const translatedSubCategories = await Promise.all(
                subCategories.map(async (subcategory) => {
                  return await getTranslatedFields(subcategory);
                })
              );
              
              form.setFieldsValue({
                subcategories: translatedSubCategories,
              });
            }
          }
        } catch (error) {
          console.error('Error translating category names:', error);
          // message.error("Failed to translate category names.");
        }
        return updateUtils({
          activeTab: utils.activeTab + 1,
          isTabLoading: false,
        });
      }
      const formValues = form.getFieldsValue();

      const formData = new FormData();
      formData.append('name', JSON.stringify(formValues.name));
      formData.append(
        'subcategories',
        JSON.stringify(formValues.subcategories)
      );
      
      formData.append('filters', JSON.stringify(formValues.filters || []));

      await appendCompressedImage(formData, 'image', imageFile);
      try {
        let res = null;
        if (currentEditCategory) {
          res = await editCategory(currentEditCategory._id, formData);
        } else {
          res = await addCategory(formData);
        }
        onSubmit();
        tableQuery.refetch();
        setCurrentEditCategory(null);
        setImageFile(null);
        currentEditCategory
          ? message.success('Category updated successfully')
          : message.success('Category added successfully');
      } catch (err) {
        
        message.error(
          err?.response?.data?.message || 'Failed to save category'
        );
        updateUtils({ isTabLoading: false });
      }
    } catch (error) {
      console.error('Form validation failed:', error);
      updateUtils({ isTabLoading: false });
    }
  };

  const handleImageUpload = () => false; // prevent auto-upload

  const handleRemoveImage = () => {
    setImageFile(null);
    updateUtils({ fileList: [] });
  };

  const tabs = useMemo(
    () => [
      {
        key: 0,
        label: 'Category',
        children: (
          <div>
            {LANGUAGECODES.map((code) => (
              <Form.Item
                label={`Category Name (${LANGUAGECODETONAME[code]})`}
                key={code}
                name={['name', code]}
                rules={[
                  {
                    required: code === 'en',
                    message: 'English name is required!',
                  },
                ]}
              >
                <Input
                  placeholder={`Enter category name in ${LANGUAGECODETONAME[code]}`}
                  allowClear
                />
              </Form.Item>
            ))}

            {/* Image Upload Section */}
            <Form.Item label="Category Image" name="image" valuePropName="file">
              <Upload
                customRequest={handleImageUpload}
                listType="picture-card"
                fileList={utils.fileList} // Display the image preview
                showUploadList={{ showRemoveIcon: true }} // Display delete icon
                onRemove={handleRemoveImage} // Handle image removal
                maxCount={1} // Restricts to a single image
                beforeUpload={(file) => {
                  // Store the real File object for FormData submission
                  setImageFile(file);
                  // Generate preview URL
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateUtils({
                      fileList: [
                        {
                          uid: file.uid || String(Date.now()),
                          name: file.name,
                          status: 'done',
                          url: reader.result,
                          originFileObj: file,
                        },
                      ],
                    });
                  };
                  reader.readAsDataURL(file);
                  return false; // Prevents automatic upload
                }}
              >
                {utils.fileList.length === 0 && (
                  <Button icon={<LuUpload />}></Button>
                )}
              </Upload>
            </Form.Item>
          </div>
        ),
      },
      {
        key: 1,
        label: 'Subcategories',
        children: (
          <div>
            <div className="flex items-center gap-2 justify-between mb-2">
              <h3 className="text-md">Sub Categories</h3>
              <AddButton
                onClick={() => {
                  const subcategories =
                    form.getFieldValue('subcategories') || [];
                  subcategories.push(
                    Object.fromEntries(LANGUAGECODES.map((code) => [code, '']))
                  );
                  form.setFieldsValue({ subcategories });
                }}
              />
            </div>
            <Form.Item name={'subcategories'} valuePropName="dataSource">
              <Table
                pagination={false}
                scroll={{ x: 1000, y: 300 }}
                columns={[
                  {
                    title: 'S No',
                    key: 'sno',
                    render: (_, __, index) => index + 1,
                    width: 70,
                    fixed: 'left',
                  },
                  ...LANGUAGECODES.map((code) => ({
                    title: LANGUAGECODETONAME[code],
                    dataIndex: code,
                    key: code,
                    render: (text, record, index) => (
                      <Form.Item
                        name={['subcategories', index, code]}
                        rules={[
                          {
                            required: code === 'en',
                            message:
                              'English name is required for subcategory!',
                          },
                        ]}
                        className="mb-0 w-full"
                      >
                        <Input
                          placeholder={`(${LANGUAGECODETONAME[code]})`}
                          allowClear
                          className="w-full"
                        />
                      </Form.Item>
                    ),
                  })),
                  {
                    title: 'Action',
                    key: 'action',
                    align: 'center',
                    width: 80,
                    fixed: 'right',
                    render: (_, record, index) => (
                      <DeleteButton
                        onClick={() => {
                          const newSubcategories =
                            form.getFieldValue('subcategories');
                          newSubcategories.splice(index, 1);
                          form.setFieldsValue({
                            subcategories: newSubcategories,
                          });
                        }}
                      />
                    ),
                  },
                ]}
              />
            </Form.Item>
          </div>
        ),
      },
      {
        key: 2,
        label: 'Filters',
        children: (
          <div>
            <Form.List name="filters">
              {(fields, { add, remove }) => (
                <>
                  <div className="flex items-center gap-2 justify-between">
                    <h3 className="text-md">Filters</h3>
                    <AddButton onClick={() => add({ name: '' })} />
                  </div>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex items-baseline gap-2">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[
                          {
                            required: true,
                            message: 'Filter name is required!',
                          },
                        ]}
                        className="flex-1"
                      >
                        <FilterDropdown />
                      </Form.Item>

                      <DeleteButton onClick={() => remove(name)} />
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </div>
        ),
      },
    ],
    [utils.fileList, currentEditCategory]
  );

  return (
    <Modal
      title={`${
        currentEditCategory ? 'Edit' : 'Add'
      } Category and Subcategories`}
      open={isVisible}
      onCancel={onClose}
      centered
      width={1000}
      onClose={onClose}
      onOk={form.submit}
      okText={'Save'}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        // onFinish={handleFinish}
        initialValues={{ subcategories: [] }}
      >
        <FormTabs
          items={tabs}
          isLoading={utils.isTabLoading}
          activeTab={utils.activeTab}
          updateUtils={updateUtils}
          onCancel={onClose}
          onSave={handleFinish}
        />
      </Form>
    </Modal>
  );
};

export default CategoryModal;
