import bgImg from '../assets/bg.png';
import { Instagram } from 'lucide-react';
import { FaSnapchat } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { FaTiktok } from 'react-icons/fa';
import { useTranslationContext } from '../context/TranslationContext';
import { useGlobalContext } from '../context/GlobalProvider';
import { getUrl } from '../utils/globalMethods';
import { getCategoryLabel } from '../utils/categoryTranslation';

const Footer = () => {
  const {
    translateLanguage,
    content: { common },
  } = useTranslationContext();
  const { categories } = useGlobalContext();
  const isRTL = translateLanguage === 'ar';
  return (
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
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-20">
            {/* Collections Section (Left) */}
            <div
              className={`w-full text-center md:text-left ${
                isRTL ? 'md:text-right' : ''
              }`}
            >
              <h3 className="mb-6 text-lg font-semibold uppercase md:text-xl">
                {common.collections}
              </h3>
              <ul className="space-y-4 text-sm cursor-pointer md:text-base lg:text-lg">
                {categories.map((category) => (
                  <li key={category._id}>
                    <Link
                      className="hover:underline"
                      to={`/product-listings?categories=${getUrl(
                        category.name.en
                      )}`}
                    >
                      {getCategoryLabel(category, translateLanguage)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Logo and Description Section (Center) */}
            <div className="flex flex-col items-center justify-center w-full text-center order-first md:order-none">
              <div className="pb-6 md:py-0">
                <h3 className="mb-4 text-base font-semibold uppercase md:text-xl lg:text-2xl">
                  {common.followUsOn}
                </h3>
                <div className="flex justify-center gap-4 mb-8 text-2xl cursor-pointer sm:gap-6 sm:text-3xl">
                  <a
                    className="w-10 h-10 text-black bg-white rounded-md hover:bg-yellow-300 hover:text-white inline-flex items-center justify-center transition-colors"
                    href="https://snapchat.com/t/iadrVQMK"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Snapchat"
                  >
                    <FaSnapchat className="w-6 h-6" />
                  </a>
                  <a
                    className="w-10 h-10 text-black bg-white rounded-md hover:text-white hover:bg-blue-800 inline-flex items-center justify-center transition-colors"
                    href="https://www.instagram.com/mmmk_wode?igsh=MXRvbWZhOGJ6dXVyNA=="
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a
                    className="w-10 h-10 text-black bg-white rounded-md hover:text-white hover:bg-violet-800 inline-flex items-center justify-center transition-colors"
                    href="https://www.tiktok.com/@mmmk.wode?_r=1&_t=ZS-93aBxbSUzRY"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                  >
                    <FaTiktok className="w-6 h-6" />
                  </a>
                </div>
                <div className="flex items-center justify-center gap-4 sm:gap-8">
                  <img
                    src="/Wode Logo.png"
                    alt={common.mmmk}
                    width="192"
                    height="192"
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48"
                  />
                  <img
                    src="/africanFalcon.jpg"
                    alt={common.productImageAlt}
                    width="176"
                    height="176"
                    loading="lazy"
                    decoding="async"
                    className="object-contain w-24 h-24 rounded-full sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44"
                  />
                </div>
                <p className="mt-8 text-sm leading-relaxed text-center md:text-base lg:max-w-md mx-auto">
                  {common.footerDescription}
                </p>
              </div>
            </div>

            {/* MMMK WOOD Section (Right) */}
            <div
              className={`w-full text-center md:text-right ${
                isRTL ? 'md:text-left' : ''
              }`}
            >
              <h3 className="mb-6 text-lg font-semibold uppercase md:text-xl">
                {common.mmmk}
              </h3>
              <ul className="space-y-4 text-sm cursor-pointer md:text-base lg:text-lg">
                <li>
                  <Link to="/contact-us" className="hover:underline">
                    {common.contactUs}
                  </Link>
                </li>
                <li>
                  <Link to="/about-us" className="hover:underline">
                    {common.ourStory}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:underline">
                    {common.privacyPolicy}
                  </Link>
                </li>
                <li>
                  <Link to="/return-policy" className="hover:underline">
                    {common.refundPolicy}
                  </Link>
                </li>
                <li>
                  <Link to="/terms-conditions" className="hover:underline">
                    {common.termsAndConditions}
                  </Link>
                </li>
                <li>
                  <Link to="/contact-us" className="hover:underline">
                    {common.customerSupport}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center justify-between py-10 mt-10 text-center border-t border-white/20 md:mt-16 md:flex-row">
            <p className="text-sm md:text-base opacity-80"> {common.mmmkOfficialWebsite}</p>
            <p className="mt-4 text-xs md:text-base md:mt-0 opacity-60">
              {common.copyright}
            </p>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
