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
import {
  addCategory,
  editCategory,
  generateCategorySchemaAdmin,
} from '../../../apis/admin/category';
import { AddButton, DeleteButton } from '../../UI/Buttons';
import { LuUpload } from 'react-icons/lu';
import { LANGUAGECODES, LANGUAGECODETONAME } from '../../../utils/staticData';
import { getTranslatedFields } from '../../../utils/getTranslatedFields';
import { FormTabs } from '../../UI/Tabs';
import SchemaEditor from '../SEO/SchemaEditor';
import { useQuery } from '@tanstack/react-query';
import { getAllFilters } from '../../../apis/admin/filter';
import {
  getAssetFallbackUrl,
  isLocalEnvironment,
  resolveAssetUrl,
} from '../../../utils/assetUrl';
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
  const [autoSchema, setAutoSchema] = useState('');
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
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
      const initialUrl = resolveAssetUrl(currentEditCategory?.image);
      updateUtils({
        isTabLoading: false,
        activeTab: 0,
        fileList: currentEditCategory
          ? [
              {
                uid: '-1',
                name: 'category-image.jpg',
                status: 'done',
                url: initialUrl,
              },
            ]
          : [],
      });
      if (currentEditCategory) {
        form.setFieldsValue({
          ...currentEditCategory,
          slug: currentEditCategory.slug || '',
          metaTitle: currentEditCategory.metaTitle || '',
          metaDescription: currentEditCategory.metaDescription || '',
          metaKeywords: currentEditCategory.metaKeywords || '',
          canonicalUrl: currentEditCategory.canonicalUrl || '',
          seoSchema: currentEditCategory.seoSchema || '',
        });
        setAutoSchema(currentEditCategory.seoSchema || '');
      } else {
        setAutoSchema('');
      }

      if (currentEditCategory?.image) {
        const testImg = new window.Image();
        testImg.onerror = () => {
          const fallbackUrl = getAssetFallbackUrl(currentEditCategory.image);
          updateUtils({
            fileList: [
              {
                uid: '-1',
                name: 'category-image.jpg',
                status: 'done',
                url: fallbackUrl,
              },
            ],
          });
        };
        testImg.src = initialUrl;
      }
    }
  }, [currentEditCategory, isVisible]);

  const handleGenerateSchema = async () => {
    try {
      setIsSchemaLoading(true);
      const formValues = form.getFieldsValue();
      const res = await generateCategorySchemaAdmin({
        name: formValues.name,
        slug: formValues.slug,
        metaTitle: formValues.metaTitle,
        metaDescription: formValues.metaDescription,
        metaKeywords: formValues.metaKeywords,
        canonicalUrl: formValues.canonicalUrl,
        image: currentEditCategory?.image,
      });
      if (res?.success && res?.schema) {
        setAutoSchema(res.schema);
        form.setFieldsValue({ seoSchema: res.schema });
        message.success('Schema generated successfully');
      }
    } catch (err) {
      console.error('Failed to generate schema:', err);
      message.error(err?.response?.data?.message || 'Failed to generate schema');
    } finally {
      setIsSchemaLoading(false);
    }
  };

  const handleResetSchema = () => {
    if (autoSchema) {
      form.setFieldsValue({ seoSchema: autoSchema });
      message.info('Reset schema to auto-generated');
    }
  };

  const handleFinish = async () => {
    try {
      await form.validateFields();
      updateUtils({ isTabLoading: true });
      if (utils.activeTab < tabs.length - 1) {
        const values = form.getFieldsValue();
        try {
          if (utils.activeTab === 0) {
            const translatedNames = await getTranslatedFields(values.name);
            form.setFieldsValue({
              name: translatedNames,
            });

            // Auto-fill slug if empty based on English name
            const currentSlug = form.getFieldValue('slug');
            const enName = values.name?.en;
            if (!currentSlug && enName) {
              const generatedSlug = String(enName)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
              form.setFieldsValue({ slug: generatedSlug });
            }
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

      // SEO & Meta Fields
      if (formValues.slug) formData.append('slug', formValues.slug.trim());
      if (formValues.metaTitle) formData.append('metaTitle', formValues.metaTitle.trim());
      if (formValues.metaDescription) formData.append('metaDescription', formValues.metaDescription.trim());
      if (formValues.metaKeywords) formData.append('metaKeywords', formValues.metaKeywords.trim());
      if (formValues.canonicalUrl) formData.append('canonicalUrl', formValues.canonicalUrl.trim());
      if (formValues.seoSchema) formData.append('seoSchema', formValues.seoSchema.trim());

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
      {
        key: 3,
        label: 'SEO',
        children: (
          <div className="space-y-4 pt-2">
            <Form.Item
              label={
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  URL Slug
                </span>
              }
              name="slug"
            >
              <Input placeholder="e.g. fragrance" allowClear />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Meta Title
                </span>
              }
              name="metaTitle"
            >
              <Input
                placeholder="e.g. Luxury Fragrances & Perfumes | MMMK WODE"
                maxLength={60}
                showCount
                allowClear
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Meta Description
                </span>
              }
              name="metaDescription"
            >
              <Input.TextArea
                placeholder="e.g. Explore our curated collection of luxury fragrances, exotic musks, and perfumes at MMMK WODE."
                maxLength={160}
                showCount
                rows={3}
                allowClear
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label={
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Meta Keywords
                  </span>
                }
                name="metaKeywords"
              >
                <Input placeholder="e.g. fragrance, luxury perfumes, silky musk, mmmk wode" allowClear />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Canonical URL
                  </span>
                }
                name="canonicalUrl"
              >
                <Input
                  placeholder="https://mmmk-wode.com/product-listings?categories=Fragrance"
                  allowClear
                />
              </Form.Item>
            </div>

            <Form.Item
              name="seoSchema"
              label={
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Schema (JSON-LD)
                </span>
              }
            >
              <SchemaEditor
                value={form.getFieldValue('seoSchema')}
                onChange={(val) => form.setFieldsValue({ seoSchema: val })}
                onGenerate={handleGenerateSchema}
                onReset={handleResetSchema}
                isLoading={isSchemaLoading}
                autoSchemaAvailable={Boolean(autoSchema)}
                rows={8}
              />
            </Form.Item>
          </div>
        ),
      },
    ],
    [utils.fileList, currentEditCategory, isSchemaLoading, autoSchema]
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
