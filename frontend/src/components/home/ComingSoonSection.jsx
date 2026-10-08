import { useTranslationContext } from '../../context/TranslationContext';
import { CommonButton } from '../global/UIButtons';
import { Link } from 'react-router-dom';

const ComingSoonSection = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();
  return (
    <div className="flex w-full flex-col overflow-hidden sm:h-screen sm:flex-row lg:py-10">
      {/* Left Image */}
      <div className="flex flex-1 flex-col">
        <div className="h-[260px] w-full flex-1 overflow-hidden sm:h-auto">
          <img
            src="/commingsoon1a.jpg"
            alt={common.comingSoon}
            width="1200"
            height="1200"
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="h-[260px] w-full flex-1 overflow-hidden sm:h-auto">
          <img
            src="/commingsoon2a.jpg"
            alt={common.comingSoon}
            width="1200"
            height="1200"
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-8 bg-[rgb(83,49,37)] px-4 py-10 text-[rgb(248,238,188)] sm:min-h-0 sm:h-full md:gap-10">
        <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48">
          <img
            src="Wode Logo.png"
            alt={common.mmmk}
            width="192"
            height="192"
            loading="lazy"
            decoding="async"
            className="object-contain w-full h-full"
          />
        </div>

        <CommonButton
          variant={1}
          size="md"
          isLink
          to="/product-listings?categories=Fragrance"
        >
          {common.shopNow} {common.fragrance}
        </CommonButton>

        {/* <p className="text-center text-3xl">{common.comingSoon}</p> */}
      </div>

      {/* Center Section */}
      <div className="relative flex h-[260px] w-full flex-col items-center justify-between text-white sm:h-full sm:w-1/3">
        {/* Top: Logo */}
        <div className="flex justify-center h-full w-full">
          <img
            src="/comingsoon3.jpg"
            alt={common.comingSoon}
            width="1200"
            height="1200"
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ComingSoonSection;
