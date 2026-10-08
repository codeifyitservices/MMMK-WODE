import { useTranslation } from 'react-i18next';
import Section2Form from './Section2Form';
import { getHomeSection2 } from '../../../../../apis/admin/editPage';
import { useQuery } from '@tanstack/react-query';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';

const Section2 = () => {
  const { t, i18n } = useTranslation();

  const query = useQuery({
    queryKey: ['homeSection'],
    queryFn: () => getHomeSection2(),
  });

  return (
    <>
      <Section2Form data={query?.data?.data} query={query} />
      <div className="grid w-full h-auto min-h-screen grid-cols-1 md:grid-cols-3">
        {/* Image Box 1 */}
        <div className="w-full h-[200px] sm:h-[300px] md:h-auto lg:h-auto">
          <img
            src={resolveAssetUrl(query.data?.data?.leftImage)}
            alt="side1"
            className="object-cover w-full h-full"
          />
        </div>

        {/* Center Content Box */}
        <div className="flex flex-col justify-center items-center bg-[#a3a59c] text-center p-4 md:p-6 lg:p-12">
          <h4 className="mb-4 text-sm font-bold text-white sm:text-xl md:text-2xl lg:text-3xl">
            {query?.data?.data?.title[i18n.language]}
          </h4>
          <p className="mb-2 text-xl tracking-widest text-white sm:text-3xl md:text-4xl lg:text-5xl">
            {query?.data?.data?.subtitle[i18n.language]}
          </p>
          <button className="px-6 py-2 mt-6 font-semibold border-2 md:text-lg text-xs border-[#7a5b48] rounded-sm text-[#7a5b48] hover:bg-[#7a5b48] hover:text-white transition duration-300 sm:px-10 sm:py-3 md:px-12 md:py-3 lg:px-16 lg:py-4 ">
            <a href="/product-page"> {t('allProducts')}</a>
          </button>
        </div>

        {/* Image Box 2 */}
        <div className="w-full h-[200px] sm:h-[300px] md:h-auto lg:h-auto">
          <img
            src={resolveAssetUrl(query.data?.data?.rightImage)}
            alt="side2"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </>
  );
};

export default Section2;
