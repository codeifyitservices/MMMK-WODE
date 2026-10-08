import Banner from '../components/global/Banner';
import bgImg from '../assets/bg.png';
import NewsLetter from '../components/global/NewsLetter';
import { Link } from 'react-router-dom';
import {
  translateText,
  useTranslationContext,
} from '../context/TranslationContext';
import { useEffect, useState } from 'react';

export default function PageNotFound() {
  const {
    content: { common },
    translateLanguage,
  } = useTranslationContext();
  const enText =
    'The page you are looking for does not exist or has been moved. Please check the URL or return to homepage.';
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
          <div className="w-full max-w-2xl p-6 bg-opacity-75 rounded-lg md:p-16 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-center mb-6">
              {common.pageNotFound}
            </h1>
            <p className="text-lg text-center mb-8">{text}</p>
            <Link
              to="/"
              className="px-12 py-2 text-base text-white transition duration-300 border border-white hover:border-black md:px-12 sm:text-xl hover:bg-white hover:text-black md:text-lg"
            >
              {common.home}
            </Link>
          </div>
        </div>
      </Banner>
      <NewsLetter />
    </div>
  );
}
