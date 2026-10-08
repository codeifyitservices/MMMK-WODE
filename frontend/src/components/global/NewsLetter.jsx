import { CommonButton } from './UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';

const NewsLetter = () => {
  const {
    content: { common },
  } = useTranslationContext();
  return (
    <div className="flex w-full flex-col justify-between bg-white py-10 md:flex-row md:py-[100px]">
      {/* Left */}
      <div className="mb-4 max-w-4xl px-4 text-center text-black md:mb-0 md:px-20 md:text-left">
        <h2 className="text-2xl font-bold leading-tight sm:text-4xl md:text-4xl">
          {common.newsLetterHeading}
        </h2>
        <p className="mt-3 text-sm leading-relaxed sm:text-lg md:text-lg">
          {common.newsLetterDescription}
        </p>
      </div>

      {/* Right */}
      <div className="flex justify-center px-4 py-2 md:justify-start md:px-20 md:py-8">
        <CommonButton variant={3} isLink to="/auth">
          {common.signUp}
        </CommonButton>
      </div>
    </div>
  );
};

export default NewsLetter;
