/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Container from './Container';
import { TbMenu } from 'react-icons/tb';
import { Button, Divider, Drawer, Space } from 'antd';
import { IoSearchSharp } from 'react-icons/io5';
import { FaUser } from 'react-icons/fa';
import { BsMinecartLoaded } from 'react-icons/bs';
import { RiArrowDropDownLine } from 'react-icons/ri';
import BannerSlider from './BannerSlider';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartProvider';

const Banner = ({
  children,
  minHeight,
  desktopMinHeight,
  bg,
  blurOverlay = true,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const { data } = useCart();
  // const [language, setLanguage] = useState("en");

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

  const handleClickMenu = (item) => {
    if (pathname !== '/product-listings') navigate('/product-listings');
    onClose();
  };

  const mobileHeight = minHeight || 100;
  const desktopHeight = desktopMinHeight || mobileHeight;

  return (
    <div
      className={`w-full text-white relative banner-container ${minHeight ? 'md:py-10 py-4' : 'md:py-24 py-6'}`}
      style={{
        '--mobile-min-height': `${mobileHeight}vh`,
        '--desktop-min-height': `${desktopHeight}vh`,
        minHeight: 'var(--mobile-min-height)',
        backgroundImage: `url(${bg})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <style>
        {`
          @media (min-width: 768px) {
            .banner-container {
              min-height: var(--desktop-min-height) !important;
            }
          }
        `}
      </style>
      {/* Black overlay */}
      <div
        className={`absolute inset-0 bg-black opacity-50 z-[1] ${
          blurOverlay ? 'backdrop-filter backdrop-blur-xl' : ''
        }`}
      ></div>
      {/* Content container */}
      <div className="w-full relative z-[2]">{children}</div>
    </div>
  );
};

export default Banner;
