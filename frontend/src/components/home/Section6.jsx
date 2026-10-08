import { Button4 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import { PRODUCTIDS } from '../../utils/staticData';
import { getModuleUrl } from '../../utils/globalMethods';

const Section6 = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();
  // console.log("Product in Section6:", product);
  return (
    <div className="grid w-full grid-cols-1 overflow-hidden bg-[#99ddff] md:grid-cols-3">
      {/* Image Section */}
      <div className="flex w-full items-center justify-center">
        <img
          src="/section6Product.jpg"
          alt={common.productImageAlt}
          width="1200"
          height="1200"
          loading="lazy"
          decoding="async"
          className="h-auto max-h-[420px] w-full object-contain shadow md:max-h-none"
        />
      </div>
      {/* Text Content Section */}
      <div className="flex h-full w-full flex-col justify-center px-6 py-10 text-center text-white md:px-10 md:py-16 lg:px-16 xl:px-20">
        <p className="text-sm font-bold leading-relaxed md:text-[14px]">
          {homepage.section8Heading1}
        </p>

        {/* <Link to={`/product-details/${product?._id}`}> */}
        <Button4
          isLink
          to={getModuleUrl('product', PRODUCTIDS.melMoney)}
          className="!hover:text-[var(--primary-olive)] w-fit mx-auto"
        >
          {common.buyNow}
        </Button4>
        {/* </Link> */}
      </div>
      {/* Image Section */}
      <div className="flex w-full items-center justify-center">
        <img
          src="/melMoneyRight2.jpg"
          alt={common.productImageAlt}
          width="1200"
          height="1200"
          loading="lazy"
          decoding="async"
          className="h-auto max-h-[420px] w-full object-contain shadow md:max-h-none"
        />
      </div>
    </div>
  );
};

export default Section6;
