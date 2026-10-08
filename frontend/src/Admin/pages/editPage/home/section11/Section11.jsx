import luxuryImg from '../../../../../assets/Home/Luxury.png';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Section11Form from './Section11Form';
import { useQuery } from '@tanstack/react-query';
import { getHomeSection9 } from '../../../../../apis/admin/editPage';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';

const Section11 = () => {
  const { t, i18n } = useTranslation();

  const query = useQuery({
    queryKey: ['homeSection9'],
    queryFn: () => getHomeSection9(),
  });
  return (
    <>
      <Section11Form data={query.data?.data} query={query} />
      <div
        className="relative flex items-center justify-center h-screen px-4 bg-center bg-cover md:justify-end sm:px-8"
        style={{
          backgroundImage: `url(${
            resolveAssetUrl(query.data?.data?.image)
          })`,
        }}
      >
        {/* Logo Section */}
        <div className="absolute top-4 left-4 sm:left-8">
          <img
            src="/Wode Logo.png"
            alt="Wode Logo"
            className="w-24 h-24 sm:w-32 sm:h-32"
          />
        </div>

        {/* Content Section */}
        <div className="max-w-xs px-4 mr-0 space-y-4 text-right text-white sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl sm:mr-4 md:mr-20 sm:px-8">
          <p className="text-sm font-light tracking-widest sm:text-base sm:mr-7">
            {query.data?.data?.title[i18n.language]}
          </p>
          <h1 className="text-3xl font-medium leading-tight uppercase sm:text-4xl md:text-5xl">
            {query.data?.data?.subtitle[i18n.language]}
          </h1>

          <Link to="/product-listings">
            {' '}
            <button className="px-10 py-2 mt-4 text-sm font-medium text-center text-gray-700 transition duration-300 border border-gray-400 sm:px-14 sm:py-3 hover:bg-white hover:text-black">
              {t('shopNow')}
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Section11;
