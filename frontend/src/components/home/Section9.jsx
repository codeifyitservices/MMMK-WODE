import { Button5 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';

const Section9 = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();

  return (
    <div className="grid w-full h-auto grid-cols-1 overflow-hidden md:grid-cols-2 md:min-h-0">
      {/* Box 2 */}
      {/* <div className="w-full h-[300px] md:h-[900px] flex items-center justify-start">
        <img
          src="/section9a.jpg"
          alt={common.comingSoon}
          className="h-full object-cover w-[100%] sm:w-[95%]"
        />
      </div> */}

      {/* Box 1 */}
      {/* <div className="flex flex-col items-center justify-center w-full h-full px-8 py-20 text-center text-black bg-white md:py-32 md:px-16">
        <h4 className="mb-6 text-base font-semibold md:text-2xl">
          {common.mmmk}
        </h4>
        <p className="text-xl md:text-3xl lg:text-4xl tracking-[8px] md:tracking-[12px] space-y-8 my-8">
          {homepage.section12Heading1?.split(" ").map((word) => (
            <span className="block">{word}</span>
          ))}
        </p>
        <Button5 className="pointer-events-none">{common.comingSoon}</Button5>
      </div> */}
    </div>
  );
};

export default Section9;
