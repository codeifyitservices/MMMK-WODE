import { Button, ConfigProvider, Layout, Menu, theme } from 'antd';
import { getCookie, useAdminContext } from '../../context/AdminProvider';
import Loading from './Loading';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { CommonButton } from './Buttons';
import { LuChevronLeft, LuMenu, LuX } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router-dom';
const { Sider, Header, Content } = Layout;
import {
  Home,
  Tags,
  Box,
  Users,
  ShoppingCart,
  Ticket,
  LifeBuoy,
  FileText,
  SlidersHorizontal,
  CreditCard,
  BookOpen,
  LogOut,
  X,
  ChevronDown,
  ChevronLeft,
  Mail,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { FaGift } from 'react-icons/fa';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import { useAdminAuthContext } from '../../context/AdminAuthProvider';

export default function AdminSidebar({ children }) {
  const { setData } = useAdminAuthContext();
  const { isSidebarCollapsed, updateContext } = useAdminContext();
  const { screenSizeFactor } = useGlobalContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [utils, setUtils] = useState({
    activeNavItem: '',
    openedKeys: [],
    currentPath: pathname,
  });
  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  const handleCollapse = () => {
    document.cookie = `react-resizable-panels:collapsed=true`;
    updateContext({ isSidebarCollapsed: true });
  };

  const handleExpand = () => {
    document.cookie = `react-resizable-panels:collapsed=false`;
    updateContext({ isSidebarCollapsed: false });
  };

  const menuItems = useMemo(
    () => [
      {
        icon: <Home size={15} />,
        label: 'Dashboard',
        title: 'Dashboard',
        key: '/admin/dashboard',
      },
      {
        icon: <SlidersHorizontal size={15} />,
        label: 'Filters',
        title: 'Filters',
        key: '/admin/filters',
      },
      {
        icon: <Tags size={15} />,
        label: 'Category',
        title: 'Category',
        key: '/admin/category',
      },
      {
        icon: <Box size={15} />,
        label: 'Products',
        title: 'Products',
        key: '/admin/products',
      },
      {
        icon: <TrendingUp size={15} />,
        label: 'Product Performance',
        title: 'Product Performance',
        key: '/admin/product-performance',
      },
      {
        icon: <Eye size={15} />,
        label: 'Most Viewed',
        title: 'Most Viewed',
        key: '/admin/most-viewed',
      },
      {
        icon: <Ticket size={15} />,
        label: 'Review',
        title: 'Review',
        key: '/admin/review',
      },
      {
        icon: <Users size={15} />,
        label: 'Users',
        title: 'Users',
        key: '/admin/users',
      },
      {
        icon: <FaGift />,
        label: 'Gift Card',
        title: 'Gift Card',
        key: '/admin/gift-card',
      },
      {
        icon: <ShoppingCart size={15} />,
        label: 'Orders',
        title: 'Orders',
        key: '/admin/orders',
      },
      {
        icon: <ShoppingCart size={15} />,
        label: 'Abandoned Carts',
        title: 'Abandoned Carts',
        key: '/admin/abandoned-carts',
      },
      {
        icon: <Mail size={15} />,
        label: 'Email Template',
        title: 'Email Template',
        key: '/admin/email-template',
      },
      {
        icon: <Ticket size={15} />,
        label: 'Coupons',

        title: 'Coupons',
        key: '/admin/coupons',
      },
      {
        icon: <LifeBuoy size={15} />,
        label: 'Support',
        title: 'Support',
        key: '/admin/support',
      },
      {
        icon: <SlidersHorizontal size={15} />,
        label: 'Top Strip',
        title: 'Top Strip',
        key: '/admin/top-strip',
      },
      {
        icon: <FileText size={15} />,
        label: 'Banner Bubble',
        title: 'Banner Bubble',
        key: '/admin/banner-bubble',
      },
      // {
      //   icon: <FileText size={15} />,
      //   label: "Edit Pages",
      //   title: "Edit Pages",
      //   key: "/admin/edit-pages",
      //   children: [
      //     {
      //       label: "Homepage",
      //       title: "Homepage",
      //       key: "/admin/edit-pages/homepage",
      //       children: [
      //         {
      //           label: "Section 2",
      //           title: "Section 2",
      //           key: "/admin/edit-pages/homepage/section-2",
      //         },
      //         {
      //           label: "Section 8",
      //           title: "Section 8",
      //           key: "/admin/edit-pages/homepage/section-8",
      //         },
      //         {
      //           label: "Section 9",
      //           title: "Section 9",
      //           key: "/admin/edit-pages/homepage/section-9",
      //         },
      //         {
      //           label: "Section 11",
      //           title: "Section 11",
      //           key: "/admin/edit-pages/homepage/section-11",
      //         },
      //         {
      //           label: "Section 12",
      //           title: "Section 12",
      //           key: "/admin/edit-pages/homepage/section-12",
      //         },
      //         {
      //           label: "Section Products",
      //           title: "Section Products",
      //           key: "/admin/edit-pages/homepage/section-products",
      //         },
      //       ],
      //     },
      //     {
      //       label: "Footer",
      //       title: "Footer",
      //       key: "/admin/edit-pages/footer",
      //     },
      //   ],
      // },
      
      // {
      //   icon: <CreditCard size={15} />,
      //   label: 'Payment',
      //   title: 'Payment',
      //   key: '/admin/payment',
      // },
      // { icon: <FaMoneyBill1Wave />, label: "Pricing", title: "Pricing", key: "/admin/pricing" },
      // { icon: <BookOpen />, label: "Blogs", title: "Blogs", key: "/admin/blogs" },
      {
        icon: <LogOut size={15} />,
        label: 'Logout',
        title: 'Logout',
        key: '/admin/logout',
      },
    ],
    []
  );

  const getKeys = (menuItem) => {
    if (menuItem.children?.length)
      return menuItem.children.map((item) => getKeys(item));
    else if (menuItem.key) return menuItem.key;
  };

  useEffect(() => {
    const navKeys = menuItems.map((item) => getKeys(item)).flat(Infinity);

    updateUtils({
      openedKeys: pathname.split('/').reduce((acc, cur, i, arr) => {
        if (i === arr.length || !cur) return acc;
        acc.push(arr.slice(0, i + 1).join('/'));
        return acc;
      }, []),
      currentPath: pathname,
      activeNavItem: navKeys.find((key) => pathname.includes(key)),
    });
    const activeElement = document.activeElement;
    if (activeElement) {
      activeElement.blur();
    }
  }, [pathname, isSidebarCollapsed, screenSizeFactor, menuItems]);

  useEffect(() => {
    if (screenSizeFactor < 6) {
      if (!isSidebarCollapsed) updateContext({ isSidebarCollapsed: true });
    } else {
      const isCollapsed = getCookie('react-resizable-panels:collapsed');
      updateContext({ isSidebarCollapsed: isCollapsed === 'true' });
    }
  }, [screenSizeFactor]);

  const handleLogout = async () => {
    localStorage.removeItem('adminAuthToken');
    setData({});
    return navigate('/admin/login');
  };

  const handleSelectMenuItem = (item) => {
    if (item.key === '/admin/logout') return handleLogout();

    if (screenSizeFactor < 6) updateContext({ isSidebarCollapsed: true });
    if (utils.currentPath !== item.key && item.key) {
      navigate(item.key);
    }
  };

  return (
    <Layout className="bg-background h-[100vh] overflow-hidden bg-transparent">
      <Sider
        collapsed={screenSizeFactor >= 6 && isSidebarCollapsed}
        collapsible
        width={screenSizeFactor < 5 ? '100%' : 260}
        collapsedWidth={screenSizeFactor < 6 ? 0 : 60}
        trigger={null}
        breakpoint="lg"
        className={`${
          screenSizeFactor < 6 && isSidebarCollapsed ? 'left-[-100%]' : 'left-0'
        } top-0 transition-all duration-300 ease-in-out bg-gradient-to-b from-gray-950 to-yellow-950 dark:bg-gray-900 border-r border-accent lg:relative absolute w-full z-[1000] pop-container`}
      >
        <div
          className={cn(
            'logo flex h-[50px] border-b border-accent items-center bg-background px-2',
            isSidebarCollapsed
              ? 'justify-center'
              : screenSizeFactor < 6
                ? 'justify-between'
                : 'justify-center'
          )}
        >
          <div className="flex items-center justify-center w-full">
            <motion.h2
              animate={{
                width: isSidebarCollapsed ? 0 : 'auto',
                opacity: isSidebarCollapsed ? 0 : 1,
              }}
              className="text-lg text-white font-semibold text-center flex-1 origin-left"
            >
              Admin Panel
            </motion.h2>
            {screenSizeFactor < 6 ? (
              <CommonButton
                icon={<LuX />}
                size="small"
                className="px-0"
                onClick={handleCollapse}
                // icon={<X strokeWidth={0.5} />}
              />
            ) : (
              <Button
                ghost
                className={cn('my-auto', isSidebarCollapsed ? 'ml-0 pl-0' : '')}
                onClick={() => {
                  if (isSidebarCollapsed) {
                    handleExpand();
                  } else {
                    handleCollapse();
                  }
                }}
                icon={isSidebarCollapsed ? <LuMenu /> : <LuChevronLeft />}
              />
            )}
          </div>
        </div>
        <div className="h-[calc(100vh-50px)] overflow-y-auto scrollbar-hidden border-0 relative">
          <ConfigProvider
            // theme={{ token: { colorPrimary: "#635D4A" },  }}
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#635D4A',
              },
            }}
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={[utils.activeNavItem]}
              className="border-0 mb-0 bg-transparent text-white"
              items={menuItems}
              selectedKeys={[utils.activeNavItem]}
              openKeys={
                screenSizeFactor < 6 && isSidebarCollapsed
                  ? null
                  : utils.openedKeys
              }
              onOpenChange={(openKeys) => {
                updateUtils({ openedKeys: openKeys });
              }}
              onClick={handleSelectMenuItem}
            />
          </ConfigProvider>
        </div>
      </Sider>
      <Layout className="bg-transparent h-[100vh] overflow-hidden flex flex-col">
        {screenSizeFactor < 6 && (
          <Header className="bg-white m-0 p-0 h-[50px]">
            <div className="header flex items-center border-b border-accent h-full px-2 justify-between">
              <div className="flex items-center gap-2">
                {screenSizeFactor < 6 ? (
                  <Button
                    onClick={isSidebarCollapsed ? handleExpand : handleCollapse}
                    icon={<LuMenu />}
                  />
                ) : null}
              </div>
            </div>
          </Header>
        )}

        <Content className="bg-background m-0 p-4 flex-1 flex flex-col overflow-y-auto">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
