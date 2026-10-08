import { Button3 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';

const ShopInstant = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();
  return (
    <div className="flex flex-col items-center justify-between w-full px-4 py-8 md:flex-row md:py-16 lg:py-24 sm:px-8 lg:px-16">
      {/* Left Section */}
      <div className="w-full mb-6 text-center md:w-auto md:text-left md:mb-0">
        <h2 className="text-2xl text-[#88a9C4] font-bold sm:text-3xl md:text-4xl lg:text-5xl">
          {homepage.section7Heading1}
        </h2>
      </div>

      {/* Right Section */}
      <div className="flex justify-center w-full md:w-auto md:justify-end">
        <Button3 isLink to="/product-listings" className="!py-3 !h-fit">
          {common.allProducts}
        </Button3>
      </div>
    </div>
  );
};

export default ShopInstant;
