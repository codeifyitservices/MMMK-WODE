import { useTranslation } from 'react-i18next';
import box1 from '../../../../../assets/Home/box1.jpg';
import box2 from '../../../../../assets/Home/box2.jpg';
import { Link } from 'react-router-dom';
import Section8Form from './Section8Form';
import { getHomeSection8 } from '../../../../../apis/admin/editPage';
import { useQuery } from '@tanstack/react-query';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';
const Section8 = () => {
  const { t, i18n } = useTranslation();

  const query = useQuery({
    queryKey: ['homeSection8'],
    queryFn: () => getHomeSection8(),
  });

  return (
    <>
      <Section8Form data={query.data?.data} query={query}></Section8Form>
      <div className="grid w-full h-auto min-h-screen grid-cols-1 overflow-hidden md:grid-cols-12">
        {/* Box 1 */}
        <div
          className="flex items-center justify-center h-[400px] md:h-auto col-span-12 md:col-span-5"
          style={{
            backgroundImage: `url(${
              resolveAssetUrl(query?.data?.data?.leftImage)
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="p-4 text-center text-white">
            <h4 className="mb-6 text-lg font-bold md:mb-10 md:text-2xl">
              {query?.data?.data?.leftTitle[i18n.language]}
            </h4>
            <p className="text-lg md:text-xl lg:text-4xl tracking-[8px] md:tracking-[16px]">
              {query?.data?.data?.leftSubtitle[i18n.language]}
            </p>
            <Link to="/product-listings">
              {' '}
              <button className="px-10 py-2 mt-8 font-semibold text-white transition bg-transparent border-2 border-white md:px-20 md:mt-10 hover:bg-gray-900 hover:text-white">
                {t('shopNow')}
              </button>
            </Link>
          </div>
        </div>

        {/* Box 2 */}
        <div className="col-span-12 md:col-span-2 h-full  text-white flex flex-col justify-center items-center text-center p-4 md:p-6 py-10 md:py-[150px] bg-yellow-900  ">
          <img
            src="Wode Logo.png"
            className="w-20 h-20 mb-6 md:w-32 md:h-32"
            alt="Wode Logo"
          />
          <h4 className="mb-6 text-lg font-bold md:mb-10 md:text-2xl">
            {query?.data?.data?.centerTitle[i18n.language]}
          </h4>
          <button className="px-8 py-2 mt-6 font-semibold text-white transition bg-transparent border-2 border-white md:px-12 hover:bg-gray-900 hover:text-white">
            <a href="/product-listings">{t('shopNow')}</a>
          </button>
        </div>

        {/* Box 3 */}
        <div
          className="flex items-center justify-center h-[400px] md:h-auto col-span-12 md:col-span-5"
          style={{
            backgroundImage: `url(${
              resolveAssetUrl(query?.data?.data?.rightImage)
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="p-4 text-center text-white">
            <h4 className="mb-6 text-lg font-bold md:mb-10 md:text-2xl">
              {query?.data?.data?.rightTitle[i18n.language]}
            </h4>
            <p className="text-lg md:text-xl lg:text-4xl tracking-[8px] md:tracking-[16px]">
              {query?.data?.data?.rightSubtitle[i18n.language]}
            </p>
            <button className="px-10 py-2 mt-8 font-semibold text-white transition bg-transparent border-2 border-white md:px-20 md:mt-10 hover:bg-gray-900 hover:text-white">
              <a href="/product-listings">{t('shopNow')}</a>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Section8;
