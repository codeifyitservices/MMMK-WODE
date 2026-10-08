import { Button4 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';

const LuxurySection = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();

  return (
    <div
      className="relative flex min-h-[560px] items-center justify-center bg-cover bg-center px-4 py-24 sm:px-8 md:min-h-screen"
      style={{
        backgroundImage: `url("/luxurySectionImage.jpg")`,
      }}
    >
      {/* Logo Section */}
      <div className="absolute left-4 top-4 sm:left-8">
        <img
          src="/Wode Logo.png"
          alt={common.mmmk}
          className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32"
        />
      </div>

      {/* Content Section */}
      <div className="max-w-4xl px-4 text-center text-white">
        <p className="text-sm font-light tracking-widest sm:text-base">
          {common.mmmk}
        </p>
        <h2 className="my-4 text-3xl font-medium leading-tight uppercase sm:text-4xl md:text-5xl">
          {homepage.section14Heading1}
        </h2>

        <Button4 isLink to="/product-listings">
          {common.shopNow}
        </Button4>
      </div>
    </div>
  );
};

export default LuxurySection;
