/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Container from '../../../../../components/global/Container';
import { TbMenu } from 'react-icons/tb';
import { Button, Divider, Drawer, Space } from 'antd';
import { IoSearchSharp } from 'react-icons/io5';
import { FaUser } from 'react-icons/fa';
import { BsMinecartLoaded } from 'react-icons/bs';
import { RiArrowDropDownLine } from 'react-icons/ri';
import BannerSlider from '../../../../../components/global/BannerSlider';
import { NavLink } from 'react-router-dom';
import BannerForm from './BannerForm';
import { getHomeBanner } from '../../../../../apis/admin/editPage';
import { useQuery } from '@tanstack/react-query';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';
import BannerBubble from '../../../../../components/global/BannerBubble';

const Banner = ({ children, minHight = '300px', bg }) => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  // const [language, setLanguage] = useState("en");

  const query = useQuery({
    queryKey: ['banners'],
    queryFn: () => getHomeBanner(),
  });

  const showDrawer = () => {
    setOpen(true);
  };
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { name: t('collection'), subItems: [t('newArrivals'), t('bestSellers')] },
    { name: t('perfumes'), subItems: [t('perfumes'), t('bodyMists')] },
    { name: t('jewelry'), subItems: [t('necklaces'), t('rings')] },
    { name: t('swimWear'), subItems: [t('swimTops'), t('swimBottoms')] },
    { name: t('fitness'), subItems: [t('yogaPants'), t('highWaist')] },
    { name: t('sandals'), subItems: [t('sneakers'), t('sandals')] },
    { name: t('dress'), subItems: [t('casualDresses'), t('eveningGowns')] },
  ];

  useEffect(() => {
    if (!i18n.language) {
      i18n.changeLanguage('en');
      document.dir = 'ltr';
    } else {
      document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [i18n.language]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    setListOpen(false);
  };

  const onClose = () => {
    setOpen(false);
  };

  const showSearchDrawer = () => {
    setIsSearch(true);
  };

  const closeSearchDrawer = () => {
    setIsSearch(false);
  };

  return (
    <>
      <BannerForm data={query.data} query={query} />
      <div
        className={`w-full min-h-[${minHight}vh] text-white relative md:py-24 py-6`}
        style={{
          backgroundImage: `url(${
            resolveAssetUrl(query?.data?.home?.banner?.image)
          })`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        {/* Black overlay */}
        <div className="absolute inset-0 bg-black opacity-80 z-[1]"></div>
        {/* Black overlay */}
        <Container>
          <div className="w-full flex justify-between items-center py-4 relative z-[10]">
            {/* left - Menu */}
            <div
              className="flex items-center gap-4 cursor-pointer text-3rd sm:mx-4 md:mx-8 lg:mx-14"
              onClick={showDrawer}
            >
              <TbMenu className="w-6 h-8" />
              <p className="hidden sm:block">{t('menu')}</p>
            </div>

            {/* center - Logo */}
            <div className="absolute mt-56 transform -translate-x-1/2 md:mt-0 left-1/2 sm:mt-10">
              <NavLink to={'/'}>
                <img
                  src="Wode Logo.png"
                  className="w-32 h-32 md:-mb-20 sm:w-48 sm:h-48"
                />
              </NavLink>
            </div>

            {/* right - Icons */}
            <div className="flex items-center gap-6 text-3rd">
              <div className="relative">
                <button
                  onClick={() => setListOpen((prev) => !prev)}
                  className="flex items-center text-lg text-white bg-transparent outline-none"
                >
                  <span>
                    {i18n.language === 'en'
                      ? 'ENGLISH'
                      : i18n.language === 'ar'
                        ? 'العربية'
                        : i18n.language === 'ru'
                          ? 'РУССКИЙ'
                          : 'FRANÇAIS'}
                  </span>
                  <RiArrowDropDownLine className="w-8 h-12 text-white" />
                </button>

                {listOpen && (
                  <div className="absolute w-32 text-black bg-white rounded shadow-lg -left-6 top-full">
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`w-full p-1 text-lg text-center ${
                        i18n.language === 'en'
                          ? 'bg-gray-300'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      ENGLISH
                    </button>
                    <button
                      onClick={() => changeLanguage('ar')}
                      className={`w-full p-1 text-lg text-center ${
                        i18n.language === 'ar'
                          ? 'bg-gray-300'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      Arabic
                    </button>
                    <button
                      onClick={() => changeLanguage('ru')}
                      className={`w-full p-1 text-lg text-center ${
                        i18n.language === 'ru'
                          ? 'bg-gray-300'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      Russia
                    </button>
                    <button
                      onClick={() => changeLanguage('fr')}
                      className={`w-full p-1 text-lg text-center ${
                        i18n.language === 'fr'
                          ? 'bg-gray-300'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      French
                    </button>
                  </div>
                )}
              </div>

              {/* <span>
                <IoSearchSharp
                  className="text-white cursor-pointer"
                  onClick={showSearchDrawer}
                />
              </span>
              <span className="">
                <NavLink to={"/profile/my-account"}>
                  <FaUser className="text-white cursor-pointer" />
                </NavLink>
              </span>
              <span className="">
                <NavLink to={"/shopping-cart"}>
                  <BsMinecartLoaded className="text-white cursor-pointer" />
                </NavLink>
              </span> */}
            </div>
          </div>
        </Container>
        <div className="w-full relative z-[2]">
          <div className="text-white text-center md:h-[70vh] h-[80vh] flex flex-col items-center justify-center md:mt-16 md:mb-0 -mb-56">
            <BannerBubble
              text={query?.data?.home?.banner?.bubbleText}
              link={query?.data?.home?.banner?.bubbleLink}
              enabled={query?.data?.home?.banner?.bubbleEnabled}
            />
            <h4 className="text-lg sm:text-5xl md:text-6xl lg:text-2xl">
              {query?.data?.home?.banner?.title[i18n.language]}
            </h4>
            <h1 className="my-4 text-xl sm:text-7xl md:text-8xl lg:text-7xl sm:my-6 md:my-10">
              {query?.data?.home?.banner?.subtitle[i18n.language]}
            </h1>
            <NavLink to={'/product-listings'}>
              <button className="px-8 py-1.5 mt-6 text-sm text-white transition duration-300 border-2 border-orange-200 md:px-12 md:mt-0 sm:px-16 sm:py-3 hover:bg-orange-200 hover:text-black">
                {query?.data?.home?.banner?.buttonText[i18n.language]}
              </button>
            </NavLink>
          </div>
        </div>

        {/* Drawer for mobile menu with slide panels */}
        <Drawer
          placement={'left'}
          width={300}
          onClose={onClose}
          open={open}
          styles={{ body: { height: '100%' } }}
        >
          <div className="text-base leading-10 text-center cursor-pointer md:text-xl">
            {menuItems.map((item, index) => (
              <div key={item.name} className="relative group">
                {/* Menu Heading with Plus Icon */}
                <div
                  className="flex items-center justify-between px-4 py-2 cursor-pointer hover:text-primary"
                  onClick={() =>
                    setHoveredItem((prev) =>
                      prev === item.name ? null : item.name
                    )
                  }
                >
                  <p className="hover:underline">{item.name}</p>
                  <span className="text-lg font-bold text-primary">
                    {hoveredItem === item.name ? '-' : '+'}
                  </span>
                </div>

                {/* Sliding panel for sub-items */}
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    hoveredItem === item.name ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  {item.subItems.map((subItem, subIndex) => (
                    <p
                      key={subIndex}
                      className="p-2 pl-8 text-left text-black bg-white cursor-pointer hover:bg-gray-200"
                    >
                      {subItem}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Divider />
          <div className="text-base leading-10 text-center md:text-xl">
            <p className="hover:underline">{t('mMMMK WODE')}</p>
            <p className="hover:underline">{t('contactUs')}</p>
            <p className="hover:underline">{t('ourStory')}</p>
          </div>
        </Drawer>

        {/* Drawer for Search */}
        <Drawer
          placement="top"
          onClose={closeSearchDrawer}
          open={isSearch}
          height="100vh"
          styles={{ height: '100%' }}
          style={{ padding: 0 }}
        >
          <Container>
            {/* Search Bar */}
            <div className="text-center">
              <div className="flex items-center border-b-2 border-black my-4 mx-auto focus-within:border-blue-500 max-w-[700px]">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full ml-2 focus:outline-none text-3rd"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.9 14.32a8 8 0 111.414-1.414l4.243 4.242a1 1 0 01-1.414 1.415l-4.243-4.243zM8 14a6 6 0 100-12 6 6 0 000 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Container>
          {/* BannerSlider */}
          <div className="flex flex-col justify-between w-full gap-5 mt-10 lg:flex-row">
            {/* Right - Trending Searches */}
            <div className="w-full lg:w-[40%]">
              <div className="p-4">
                <h2 className="mb-4 font-semibold text-3rd">
                  {t('msg.trends')}
                </h2>
                <ul className="space-y-4">
                  {[
                    t('productDetails.fragrance'),
                    t('productDetails.jewelry'),
                    t('productDetails.swim'),
                    t('productDetails.golden'),
                    t('productDetails.yoga'),
                    t('productDetails.sandals'),
                    t('productDetails.candles'),
                    t('productDetails.dresses'),
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center justify-between pb-2 border-b border-gray-300"
                    >
                      <span className="text-base text-2nd">{item}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    </>
  );
};

export default Banner;
