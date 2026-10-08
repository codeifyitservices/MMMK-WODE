import { CommonButton } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import { PRODUCTIDS } from '../../utils/staticData';
import { getModuleUrl } from '../../utils/globalMethods';

const Section3 = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();
  return (
    <div className="grid w-full grid-cols-1 overflow-hidden bg-[rgb(83,49,37)] md:grid-cols-2">
      {/* Text Section */}
      <div className="flex flex-col justify-center px-4 py-10 text-white sm:px-6 md:px-8 md:py-16 lg:px-12 xl:px-16">
        <h4 className="text-xl font-bold md:text-2xl lg:text-3xl xl:text-4xl">
          {homepage.section11Heading1}
        </h4>
        <p className="my-3 text-sm md:text-base lg:text-lg xl:text-xl">
          {homepage.section11Description1}
        </p>
        <CommonButton
          variant={1}
          className="mt-6 w-fit md:mt-8"
          size="md"
          isLink
          to={getModuleUrl('product', PRODUCTIDS.silkyMusk)}
        >
          {common.buyNow}
        </CommonButton>
      </div>
      <div className="flex h-[320px] w-full items-center justify-end sm:h-[420px] md:h-auto md:min-h-[640px] lg:min-h-[760px]">
        <img
          src="/section3Product1.jpg"
          alt={homepage.section11Heading1}
          width="1200"
          height="1200"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default Section3;
