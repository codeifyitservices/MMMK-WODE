import Banner from './global/Banner';
import bgImg from '../assets/bg.png';
import NewsLetter from './global/NewsLetter';
import { useTranslationContext } from '../context/TranslationContext';
import { ABOUT_US_CONTENT } from '../utils/aboutUsContent';

const AboutUs = () => {
  const { translateLanguage } = useTranslationContext();
  const content = ABOUT_US_CONTENT[translateLanguage] || ABOUT_US_CONTENT.en;

  return (
    <div className="relative z-[10] w-full">
      <Banner bg={bgImg}>
        <div className="flex h-[20vh] flex-col items-center justify-center text-center text-white md:mb-0 md:mt-16 md:h-[0vh]"></div>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="w-full max-w-4xl rounded-lg bg-opacity-75 p-6 md:p-16">
            <h2 className="mb-6 text-center text-5xl font-bold text-white">
              {content.title}
            </h2>

            {content.intro.map((paragraph, index) => (
              <p
                key={`${content.title}-${index}`}
                className={`text-xl leading-relaxed text-white text-justify ${
                  index === 0 ? '' : 'mt-10'
                }`}
              >
                {paragraph}
              </p>
            ))}

            <h2 className="mb-6 mt-10 text-center text-5xl font-bold text-white">
              {content.identityTitle}
            </h2>
            <p className="text-xl leading-relaxed text-white text-justify">
              {content.identityBody}
            </p>

            <p className="mt-10 text-xl italic leading-relaxed text-white text-justify">
              {content.closing}
            </p>
            <h2 className="mb-6 mt-10 text-center text-5xl font-bold text-white">
              {content.journeyTitle}
            </h2>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative flex flex-col items-center">
            <div className="absolute top-0 h-full w-px bg-white/40"></div>

            {content.timeline.map((item, index) => (
              <div
                key={item.year}
                className={`flex w-full items-center ${
                  index === 0 ? 'mb-16 mt-16' : 'mb-16'
                }`}
              >
                {index % 2 === 0 ? (
                  <>
                    <div className="w-1/2 pr-10 text-right text-lg text-white">
                      <p className="font-semibold">{item.year}</p>
                      <p className="mt-2 opacity-80">{item.text}</p>
                    </div>
                    <div className="relative z-10 h-4 w-4 rounded-full bg-white"></div>
                    <div className="w-1/2"></div>
                  </>
                ) : (
                  <>
                    <div className="w-1/2"></div>
                    <div className="relative z-10 h-4 w-4 rounded-full bg-white"></div>
                    <div className="w-1/2 pl-10 text-lg text-white">
                      <p className="font-semibold">{item.year}</p>
                      <p className="mt-2 opacity-80">{item.text}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Banner>
      <NewsLetter />
    </div>
  );
};

export default AboutUs;
