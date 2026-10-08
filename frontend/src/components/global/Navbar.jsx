import { TbGiftCardFilled, TbMenu } from 'react-icons/tb';
import Container from './Container';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MenuDrawer from './MenuDrawer';
import { BsMinecartLoaded } from 'react-icons/bs';
import { FaHeart, FaUser } from 'react-icons/fa';
import { IoSearchSharp } from 'react-icons/io5';
import { useCart } from '../../context/CartProvider';
import SearchDrawer from './SearchDrawer';
import { useTranslationContext } from '../../context/TranslationContext';
import LanguageDropdown from './LanguageDropdown';
import CurrencyDropdown from './CurrencyDropdown';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function Navbar() {
  const { topStrip } = useGlobalContext();
  const {
    translateLanguage,
    content: { common },
    updateTranslationContext,
  } = useTranslationContext();
  const { data } = useCart();
  const [utils, setUtils] = useState({
    isMenuOpen: false,
    isSearchOpen: false,
  });

  const showTopStrip = !!(topStrip?.enabled && topStrip?.messages?.some(msg => msg && msg.trim() !== ''));

  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  useEffect(() => {
    if (!translateLanguage) {
      updateTranslationContext({ translateLanguage: 'en' });
      document.dir = 'ltr';
    } else {
      document.dir = translateLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  }, [translateLanguage]);

  const cartCount = data?.length ?? 0;

  return (
    <>
      <MenuDrawer
        isOpen={utils.isMenuOpen}
        onClose={() => updateUtils({ isMenuOpen: false })}
      />
      <SearchDrawer
        isOpen={utils.isSearchOpen}
        onClose={() => updateUtils({ isSearchOpen: false })}
      />

      <nav className={`absolute left-0 w-full z-50 transition-all duration-300 ${showTopStrip ? 'top-12' : 'top-0'}`}>
        <Container>

          {/* ── Mobile (< md) ── */}
          <div className="flex flex-col md:hidden">

            {/* Row 1: menu — logo — icons */}
            <div className="flex items-center justify-between px-3 py-2">

              {/* Left: menu */}
              <button
                type="button"
                className="flex items-center gap-2 text-white shrink-0"
                onClick={() => updateUtils({ isMenuOpen: true })}
                aria-label={common.menu}
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                <TbMenu size={22} style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }} />
                <span className="text-xs font-medium">{common.menu}</span>
              </button>

              {/* Center: logo in normal flow */}
              <Link to="/" aria-label={common.mmmk} className="mx-4">
                <img
                  src="/Wode Logo.png"
                  alt={common.mmmk}
                  width="52"
                  height="52"
                  decoding="async"
                  className="w-13 h-13 object-contain"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
                />
              </Link>

              {/* Right: icons */}
              <div className="flex items-center gap-3 shrink-0">
                {[
                  {
                    onClick: () => updateUtils({ isSearchOpen: true }),
                    label: common.search || 'Search',
                    icon: <IoSearchSharp size={16} />,
                    isButton: true,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    type="button"
                    className="p-1 text-white bg-transparent outline-none"
                    aria-label={item.label}
                    style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                  >
                    {item.icon}
                  </button>
                ))}

                {[
                  { to: '/gift-cards', label: common.giftCards || 'Gift cards', icon: <TbGiftCardFilled size={17} /> },
                  { to: '/profile/saved-items', label: common.savedItems || 'Saved items', icon: <FaHeart size={15} /> },
                  { to: '/profile/my-account', label: common.myAccount || 'My account', icon: <FaUser size={15} /> },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-label={item.label}
                    className="p-1 text-white"
                    style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                  >
                    {item.icon}
                  </Link>
                ))}

                <Link
                  to="/shopping-cart"
                  aria-label={common.shoppingCart || 'Shopping cart'}
                  className="relative p-1 text-white"
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                >
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {cartCount}
                    </span>
                  )}
                  <BsMinecartLoaded size={15} />
                </Link>
              </div>
            </div>

            {/* Row 2: language + currency */}
            <div className="flex items-center justify-center gap-4 py-1.5">
              <LanguageDropdown />
              <CurrencyDropdown />
            </div>
          </div>

          {/* ── Desktop (>= md) ── */}
          <div className="hidden md:flex items-center justify-between py-12 relative">

            {/* Left: menu */}
            <button
              type="button"
              className="flex items-center gap-2 text-white z-10 shrink-0 ml-6 lg:ml-12"
              onClick={() => updateUtils({ isMenuOpen: true })}
              aria-label={common.menu}
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
            >
              <TbMenu size={22} />
              <span className="text-sm">{common.menu}</span>
            </button>

            {/* Center: logo absolute */}
            <div className="absolute left-1/2 -translate-x-1/2 z-0">
              <Link to="/" aria-label={common.mmmk}>
                <img
                  src="/Wode Logo.png"
                  alt={common.mmmk}
                  width="200"
                  height="200"
                  decoding="async"
                  className="w-36 h-36 lg:w-48 lg:h-48 object-contain -mb-10 lg:-mb-14"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
                />
              </Link>
            </div>

            {/* Right: dropdowns + icons */}
            <div
              className="flex items-center gap-4 z-10 shrink-0 mr-6 lg:mr-12 text-white"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
            >
              <LanguageDropdown />
              <CurrencyDropdown />
              <button
                onClick={() => updateUtils({ isSearchOpen: true })}
                type="button"
                className="bg-transparent outline-none p-1"
                aria-label={common.search || 'Search'}
              >
                <IoSearchSharp size={17} className="text-white" />
              </button>
              <Link to="/gift-cards" aria-label={common.giftCards || 'Gift cards'} className="p-1 text-white">
                <TbGiftCardFilled size={20} />
              </Link>
              <Link to="/profile/saved-items" aria-label={common.savedItems || 'Saved items'} className="p-1 text-white">
                <FaHeart size={17} />
              </Link>
              <Link to="/profile/my-account" aria-label={common.myAccount || 'My account'} className="p-1 text-white">
                <FaUser size={17} />
              </Link>
              <Link to="/shopping-cart" aria-label={common.shoppingCart || 'Shopping cart'} className="relative p-1 text-white">
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
                <BsMinecartLoaded size={17} />
              </Link>
            </div>
          </div>

        </Container>
      </nav>
    </>
  );
}