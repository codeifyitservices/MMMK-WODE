import { Collapse, ConfigProvider } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

const Accordion = ({ data }) => {
  const {
    content: { productDetails },
  } = useTranslationContext();

  const [items, setItems] = useState([]);

  

  useEffect(() => {
    if (data) {
      setItems([
        {
          key: '1',
          label: productDetails.description,
          children: (
            <div
              className="ck-content"
              dangerouslySetInnerHTML={{
                __html:
                  data?.translated?.productDescription ||
                  data?.productDescription?.en ||
                  '',
              }}
            />
          ),
        },
        {
          key: '3',
          label: productDetails.directionsOfUse,
          children: (
            <div
              className="ck-content"
              dangerouslySetInnerHTML={{
                __html: data?.translated?.uses || data?.uses?.en || '',
              }}
            />
          ),
        },
        {
          key: '4',
          label: productDetails.benefits,
          children: (
            <div
              className="ck-content"
              dangerouslySetInnerHTML={{
                __html: data?.translated?.benefits || data?.benefits?.en || '',
              }}
            />
          ),
        },
      ]);
    }
  }, [data, productDetails]);

  const onChange = (key) => {
    
  };

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
        className="text-white"
        defaultActiveKey={['1']}
        onChange={onChange}
      />
    </ConfigProvider>
  );
};

export default Accordion;
