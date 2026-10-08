import bgImg from '../../../../../assets/bg.png';
import { Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FaSnapchat } from 'react-icons/fa6';
import FooterForm from './FooterForm';
import { useQuery } from '@tanstack/react-query';
import { getFooter } from '../../../../../apis/admin/editPage';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['homeFooter'],
    queryFn: () => getFooter(),
  });

  return (
    <>
      <FooterForm data={query.data?.data} query={query}></FooterForm>
      <footer
        className={`relative bg-black text-white pt-12 md:pt-[100px] ${
          isRTL ? 'rtl' : 'ltr'
        }`}
      >
        {/* Background Overlay */}
        <div
          className="absolute inset-0 bg-black opacity-20"
          style={{
            background: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
          }}
        ></div>

        {/* Content */}
        <div className="container relative px-4 mx-auto max-w-[1400px] sm:px-6 lg:px-8 ">
          {/* Top Section */}
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:gap-20">
            {/* Collections Section (Left) */}
            <div
              className={`w-full text-center md:w-1/3 md:text-left ${
                isRTL ? 'text-right' : ''
              }`}
            >
              <h3 className="mb-4 text-base font-semibold uppercase md:text-xl">
                {t('footer.collections')}
              </h3>
              <ul className="space-y-6 text-sm cursor-pointer md:text-lg sm:text-xl">
                <li>
                  <a href="#" className="hover:underline">
                    {t('footer.collections_list.perfumes')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    {t('footer.collections_list.jewelry')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    {t('footer.collections_list.swim_wear')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    {t('footer.collections_list.fitness_yoga')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    {t('footer.collections_list.sandals')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    {t('footer.collections_list.dress')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Logo and Description Section (Center) */}
            <div className="flex flex-col items-center justify-center w-full text-center md:w-1/3">
              <div className="py-10">
                <h3 className="mb-4 font-semibold uppercase md:text-2xl">
                  {t('footer.follow_us_on')}
                </h3>
                <div className="flex justify-center gap-6 mb-6 text-4xl cursor-pointer sm:text-5xl">
                  <span className="w-10 h-10 text-black bg-white rounded-md hover:bg-yellow-300 hover:text-black">
                    <FaSnapchat className="w-6 h-6 mt-2 ml-2 mr-2" />
                  </span>
                  <span className="w-10 h-10 text-black bg-white rounded-md hover:text-white hover:bg-blue-800">
                    <Instagram className="mt-2 ml-2 mr-2 " />
                  </span>
                </div>
                <img
                  src="Wode Logo.png"
                  className="w-32 h-32 mx-auto md:h-48 md:w-48"
                />
                <p className="mt-6 text-sm leading-relaxed text-center md:text-base">
                  {query.data?.data?.footerContent[i18n.language]}
                </p>
              </div>
            </div>

            {/* MMMK WOOD Section (Right) */}
            <div
              className={`w-full text-center md:w-1/3 md:text-right ${
                isRTL ? 'text-right' : ''
              }`}
            >
              <h3 className="mb-4 text-base font-semibold uppercase md:text-xl md:text-right">
                {t('footer.mmmk_wood')}
              </h3>
              <ul className="space-y-6 text-sm cursor-pointer md:text-lg sm:text-xl md:text-right">
                {query.data?.data?.footerLinks?.map((list) => {
                  return (
                    <li onClick={() => navigate(list?.link)}>
                      <a className="hover:underline">
                        {list.text[i18n.language]}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center justify-between py-10 mt-4 text-center border-t border-white md:mt-8 md:flex-row">
            <p className="text-sm md:text-lg">
              {' '}
              {t('footer.official_website')}
            </p>
            <p className="mt-4 text-xs md:text-lg md:mt-0">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
