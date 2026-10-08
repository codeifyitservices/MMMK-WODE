import { Button4 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import { getModuleUrl } from '../../utils/globalMethods';

const Section8 = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();

  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-12 overflow-hidden md:min-h-screen">
      {/* Box 1 */}
      <div
        className="col-span-1 flex h-[250px] items-center justify-center px-4 py-10 md:col-span-5 md:h-full md:px-0 md:py-0"
        style={{
          backgroundImage: `url("/section8Left.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
          <div className="max-w-full p-4 text-center">
          <h4 className="mb-2 text-sm font-bold md:mb-10 md:text-2xl">
            {common.mmmk}
          </h4>
          <p className="mb-4 flex flex-row flex-wrap justify-center gap-2 text-lg leading-tight tracking-[2px] md:mb-8 md:flex-col md:gap-4 md:text-xl md:leading-10 md:tracking-[10px] lg:text-4xl lg:tracking-[14px]">
            {homepage.section4Heading1?.split(' ').map((word) => (
              <span key={word}>{word}</span>
            ))}
          </p>
          <Button4
            className="!static !px-4 !py-1.5 !text-[10px] md:!relative md:!top-8 md:!px-12 md:!py-3 md:!text-base pointer-events-none"
            isLink
            to="/product-listings"
          >
            {common.comingSoon}
          </Button4>
        </div>
      </div>

      {/* Box 2 - Horizontal Strip on Mobile */}
      <div className="col-span-1 flex flex-row items-center justify-between bg-yellow-900 px-4 py-3 text-center text-white md:col-span-2 md:flex-col md:justify-center md:min-h-0 md:p-6 md:py-[150px]">
        <img
          src="Wode Logo.png"
          className="w-10 h-10 md:w-32 md:h-32"
          alt={common.mmmk}
          width="128"
          height="128"
          loading="lazy"
          decoding="async"
        />
        <p className="flex flex-row flex-wrap justify-center gap-1 text-[10px] font-medium uppercase tracking-wider md:my-8 md:flex-col md:gap-4 md:text-lg md:leading-10 md:tracking-[5px] lg:text-2xl">
          {homepage.section4Heading2?.split(' ').map((word) => (
            <span key={word}>{word}</span>
          ))}
        </p>

        <Button4 
          isLink 
          to={getModuleUrl('category', 'Jewellery & Accessories')}
          className="!static !px-4 !py-1.5 !text-[10px] md:!relative md:!top-8 md:!px-12 md:!py-3 md:!text-base"
        >
          {common.shopNow}
        </Button4>
      </div>

      {/* Box 3 */}
      <div
        className="col-span-1 flex h-[250px] items-center justify-center px-4 py-10 md:col-span-5 md:h-full md:px-0 md:py-0"
        style={{
          backgroundImage: `url("/static8Right.jpg")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="max-w-full p-4 text-center text-white">
          <h4 className="mb-2 text-sm font-bold md:mb-10 md:text-2xl">
            {common.mmmk}
          </h4>
          <p className="mb-4 flex flex-row flex-wrap justify-center gap-2 text-lg leading-tight tracking-[2px] md:mb-8 md:flex-col md:gap-4 md:text-xl md:leading-10 md:tracking-[8px] lg:text-4xl lg:tracking-[10px]">
            {homepage.section4Heading3?.split(' ').map((word) => (
              <span key={word}>{word}</span>
            ))}
          </p>
          <Button4
            isLink
            to={getModuleUrl('category', 'Jewellery & Accessories')}
            className="!static !px-4 !py-1.5 !text-[10px] md:!relative md:!top-8 md:!px-12 md:!py-3 md:!text-base"
          >
            {common.shopNow}
          </Button4>
        </div>
      </div>
    </div>
  );
};

export default Section8;
