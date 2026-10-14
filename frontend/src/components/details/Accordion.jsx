import { Collapse, ConfigProvider } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

const hasMeaningfulContent = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') return false;
  const stripped = htmlContent
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, '')
    .trim();
  return stripped.length > 0;
};

const Accordion = ({ data }) => {
  const {
    content: { productDetails },
  } = useTranslationContext();

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (data) {
      const descContent =
        data?.translated?.productDescription ||
        (typeof data?.productDescription === 'string'
          ? data.productDescription
          : data?.productDescription?.en) ||
        '';
      const usesContent =
        data?.translated?.uses ||
        (typeof data?.uses === 'string' ? data.uses : data?.uses?.en) ||
        '';
      const benefitsContent =
        data?.translated?.benefits ||
        (typeof data?.benefits === 'string'
          ? data.benefits
          : data?.benefits?.en) ||
        '';

      const validItems = [];

      if (hasMeaningfulContent(descContent)) {
        validItems.push({
          key: '1',
          label: productDetails.description,
          children: (
            <div
              className="ck-content text-white/90"
              dangerouslySetInnerHTML={{ __html: descContent }}
            />
          ),
        });
      }

      if (hasMeaningfulContent(usesContent)) {
        validItems.push({
          key: '3',
          label: productDetails.directionsOfUse,
          children: (
            <div
              className="ck-content text-white/90"
              dangerouslySetInnerHTML={{ __html: usesContent }}
            />
          ),
        });
      }

      if (hasMeaningfulContent(benefitsContent)) {
        validItems.push({
          key: '4',
          label: productDetails.benefits,
          children: (
            <div
              className="ck-content text-white/90"
              dangerouslySetInnerHTML={{ __html: benefitsContent }}
            />
          ),
        });
      }

      setItems(validItems);
    } else {
      setItems([]);
    }
  }, [data, productDetails]);

  if (!items || items.length === 0) {
    return null;
  }

  const defaultKeys = items.length > 0 ? [items[0].key] : [];

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            colorBgContainer: 'transparent',
            colorText: '#fff',
            colorTextHeading: '#fff',
          },
        },
      }}
    >
      <Collapse
        items={items}
        bordered={false}
        className="text-white"
        defaultActiveKey={defaultKeys}
      />
    </ConfigProvider>
  );
};

export default Accordion;
