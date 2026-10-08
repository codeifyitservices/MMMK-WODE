import { Link } from 'react-router-dom';
import bannerImg from '../../../../../assets/Home/Banner.png';
import { useTranslation } from 'react-i18next';
import Section9Form from './Section9Form';
import { useQuery } from '@tanstack/react-query';
import { getHomeSection9 } from '../../../../../apis/admin/editPage';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';

const Section9 = () => {
  const { t, i18n } = useTranslation();

  const query = useQuery({
    queryKey: ['homeSection9'],
    queryFn: () => getHomeSection9(),
  });

  return (
    <>
      <Section9Form data={query.data?.data} query={query} />
      <div className="grid w-full h-auto grid-cols-1 overflow-hidden bg-gray-500 md:grid-cols-2 md:min-h-0">
        {/* Box 1 */}
        <div className="flex flex-col items-center justify-center w-full h-full px-8 py-20 text-center text-black bg-white md:py-32 md:px-16">
          <h4 className="mb-6 text-base font-semibold md:text-2xl">
            {query.data?.data?.title[i18n.language]}
          </h4>
          <p className="text-xl md:text-3xl lg:text-4xl tracking-[8px] md:tracking-[12px]">
            {query.data?.data?.subtitle[i18n.language]}
          </p>

          <Link to="/product-page">
            {' '}
            <button className="px-4 py-2 mt-8 text-sm font-bold text-black transition duration-300 bg-transparent border-2 border-black md:text-lg md:px-16 hover:bg-black hover:text-white">
              {t('shopNow')}
            </button>
          </Link>
        </div>

        {/* Box 2 */}
        <div
          className="w-full h-[300px] md:h-[900px] flex items-center justify-center"
          style={{
            backgroundImage: `url(${
              resolveAssetUrl(query.data?.data?.image)
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        ></div>
      </div>
    </>
  );
};

export default Section9;
