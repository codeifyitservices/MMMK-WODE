import { CommonButton } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';

const Section2 = () => {
  const {
    content: { common },
  } = useTranslationContext();

  return (
    <div className="mb-8 grid w-full grid-cols-1 overflow-hidden md:mb-12 md:min-h-[520px] md:grid-cols-3 lg:min-h-[640px]">
      {/* Image Box 1 */}
      <div className="relative h-[240px] w-full sm:h-[320px] md:h-auto">
        <img
          src="/section2Left.jpg"
          alt={common.productImageAlt}
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 flex items-end justify-center p-4">
          <CommonButton
            variant={1}
            size="md"
            isLink
            to="/product-details/690c937d2db5b6e58f73efa7"
            className="bg-gray-900 text-white"
          >
            {common.buyNow}
          </CommonButton>
        </div>
      </div>
      <div className="h-[240px] w-full sm:h-[320px] md:h-auto">
        <video
          src="/section2Video.mp4"
          className="object-cover w-full h-full"
          autoPlay
          loop
          muted
          preload="none"
          playsInline
          controls
        />
      </div>

      {/* Image Box 2 */}
      <div className="relative h-[240px] w-full sm:h-[320px] md:h-auto">
        <img
          src="/section2Right.jpg"
          alt={common.productImageAlt}
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 flex items-end justify-center p-4">
          <CommonButton
            variant={1}
            size="md"
            isLink
            to="/product-details/690c937d2db5b6e58f73efa7"
            className="bg-gray-900 text-white"
          >
            {common.buyNow}
          </CommonButton>
        </div>
      </div>
    </div>
  );
};

export default Section2;
