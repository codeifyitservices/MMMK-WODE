import Banner from '../components/global/Banner';
import bgImg from '../assets/bg.png';
import NewsLetter from '../components/global/NewsLetter';
import {
  translateText,
  useTranslationContext,
} from '../context/TranslationContext';
import { useEffect, useState } from 'react';

export default function ComingSoon() {
  const {
    content: { common },
    translateLanguage,
  } = useTranslationContext();
  const enText =
    'We are working hard to bring you something amazing. Stay tuned!';
  const [text, setText] = useState(enText);

  const handleTranslateText = async (enText, language) => {
    const newText = await translateText(enText, language);
    setText(newText);
  };
  useEffect(() => {
    handleTranslateText(enText, translateLanguage);
  }, [translateLanguage]);
  return (
    <div className="w-full relative z-[10]">
      {/* <Banner bg={bgImg}> */}
      <Banner bg={bgImg}>
        <div className="text-white text-center md:h-[0vh] h-[20vh] flex flex-col items-center justify-center md:mt-16 md:mb-0 "></div>
        {/* </Banner> */}
        <div className="flex items-center justify-center min-h-[400px] ">
          <div className="w-full max-w-2xl p-6 bg-opacity-75 rounded-lg md:p-16">
            <h1 className="text-4xl font-bold text-center mb-6">
              {common.comingSoon}
            </h1>
            <p className="text-lg text-center mb-8">{text}</p>
          </div>
        </div>
      </Banner>
      <NewsLetter />
    </div>
  );
}
