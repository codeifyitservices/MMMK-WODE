/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import productImg from '../../assets/product4-trans.jpeg';
import { useCart } from '../../context/CartProvider';
import { getCartItems, addCartItem } from '../../apis/user/cart';
import { useQuery } from '@tanstack/react-query';
import { getRandomProducts, getProductSkus } from '../../apis/nonAuth/products';
import { useNavigate } from 'react-router-dom';
import {
  translate,
  useTranslationContext,
} from '../../context/TranslationContext';
import { CommonButton } from '../global/UIButtons';
import { getWishLists, removeItemFromWishList } from '../../apis/user/wishList';
import toast from 'react-hot-toast';
import { notification } from 'antd';
import { getStoredUserAuth, getStoredUserId } from '../../utils/authStorage';
import { convertPrice, formatPrice } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import { resolveAssetUrl } from '../../utils/assetUrl';

const SavedItems = () => {
  const {
    content: { profile, common },
    translateLanguage,
  } = useTranslationContext();
  const { currency, rates } = useCurrency();
  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);
  const { data, refetch: refetchCart } = useCart();
  const [cartList, setCartList] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [productList, setProductList] = useState([]);
  const navigate = useNavigate();
  const [userId, setUserId] = useState(() => ({
    ...getStoredUserAuth(),
    id: getStoredUserId(),
  }));

  const { data: products } = useQuery({
    queryKey: ['random-products'],
    queryFn: () => getRandomProducts(),
  });

  const { data: wishList, refetch: refetchWishList } = useQuery({
    queryKey: ['wish-list', userId],
    queryFn: () => getWishLists(userId.id),
    enabled: Boolean(userId?.id),
    retry: false,
  });

  const handleMoveToCart = async (item) => {
    try {
      // 1. Fetch SKUs
      const skusResponse = await getProductSkus(item.productId);
      
      const skuToUse = Array.isArray(skusResponse) && skusResponse.length > 0 
        ? skusResponse[0].sku 
        : (skusResponse?.data?.length > 0 ? skusResponse.data[0].sku : '');

      if (!skuToUse) {
        throw new Error("No SKU found for this product.");
      }

      // 2. Add to cart
      const payload = {
        product: item.productId,
        quantity: 1,
        sku: skuToUse 
      };
      
      await addCartItem(payload);

      // 3. Remove from wishlist
      await removeItemFromWishList({
        userId: userId.id,
        productId: item.productId,
      });

      notification.success({ message: 'Moved to cart successfully' });
      refetchWishList();
      refetchCart();
    } catch (err) {
      notification.error({ message: err.message || 'Failed to move to cart' });
    }
  };

  // Update wishlist items
  const updateWishlistItems = async (data, language) => {
    if (!data || !Array.isArray(data)) return;

    const newData = data?.map((item, index) => {
      return {
        id: item._id || index,
        img: resolveAssetUrl(item?.images[0]),
        title: item?.productName?.en,
        gender: item?.gender,
        price: item?.price,
        quantity: item?.quantity,
        discount: item?.discount,
        productId: item._id,
      };
    });

    if (language === 'en') {
      setWishlistItems(
        newData.map((item) => ({
          ...item,
          translated: {
            title: item.title,
            gender: item.gender,
          },
        }))
      );
      return;
    }

    const toTranslate = newData.reduce((acc, item, index) => {
      if (item.title) acc[`${index}_title`] = item.title;
      if (item.gender) acc[`${index}_gender`] = item.gender;
      return acc;
    }, {});

    const translatedData = await translate(toTranslate, language);

    const translatedNewData = Object.keys(toTranslate).reduce(
      (acc, key, index) => {
        acc[key] = translatedData[index];
        return acc;
      },
      {}
    );

    const newWishlistItems = newData.map((item, index) => ({
      ...item,
      translated: {
        title: translatedNewData[`${index}_title`],
        gender: translatedNewData[`${index}_gender`],
      },
    }));
    setWishlistItems(newWishlistItems);
  };

  const updateCartList = async (data, language) => {
    const newData = data?.map((list, index) => {
      return {
        id: index,
        img: resolveAssetUrl(list?.product?.images[0]),
        title: list?.product?.productName?.en,
        gender: list?.product?.gender,
        brand: list?.product?.brandName?.en,
        price: list?.product?.price,
        quantity: list?.product?.quantity,
      };
    });

    if (language === 'en') {
      setCartList(
        newData.map((item) => ({
          ...item,
          translated: {
            title: item.title,
            gender: item.gender,
            brand: item.brand,
          },
        }))
      );
      return;
    }

    const toTranslate = newData.reduce((acc, item, arr, index) => {
      if (item.title) acc[`${index}_title`] = item.title;
      if (item.gender) acc[`${index}_gender`] = item.gender;
      if (item.brand) acc[`${index}_brand`] = item.brand;
      return acc;
    }, {});

    const translatedData = await translate(toTranslate, language);

    const translatedNewData = Object.keys(toTranslate).reduce(
      (acc, key, index) => {
        acc[key] = translatedData[index];
        return acc;
      },
      {}
    );

    const newCartList = newData.map((item, index) => ({
      ...item,
      translated: {
        title: translatedNewData[`${index}_title`],
        gender: translatedNewData[`${index}_gender`],
        brand: translatedNewData[`${index}_brand`],
      },
    }));
    setCartList(newCartList);
  };

  useEffect(() => {
    updateCartList(data, translateLanguage);
  }, [data, translateLanguage]);

  useEffect(() => {
    if (wishList) {
      updateWishlistItems(wishList, translateLanguage);
    }
  }, [wishList, translateLanguage]);

  const handleTranslateProductsData = async (data, language) => {
    if (language === 'en') {
      setProductList(
        data.map((item) => ({
          ...item,
          translated: {
            productName: item.productName?.en,
          },
        }))
      );
      return;
    }

    const productNamesToTranslate = data
      ?.slice(0, 6)
      .map((item) => item.productName?.en || '');

    const translatedNames = await translate(productNamesToTranslate, language);

    setProductList(
      data.map((item, index) => ({
        ...item,
        translated: {
          productName: translatedNames[index],
        },
      }))
    );
  };

  const handleRemoveFromWishlist = async (id) => {
    try {
      await removeItemFromWishList({
        userId: userId.id,
        productId: id,
      });
      notification.success({ message: 'Removed from wishlist successfully' });
      refetchWishList();
    } catch (err) {
      notification.error({ message: 'Failed to remove from wishlist' });
    }
  };

  useEffect(() => {
    if (products?.data?.length > 0)
      handleTranslateProductsData(products?.data, translateLanguage);
  }, [products?.data, translateLanguage]);

  useEffect(() => {
    refetchCart();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-2 sm:px-4">
      {/* Wishlist Section */}
      <div className="col-span-1 md:col-span-7 p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-6 border-b">
          <div className="w-full sm:w-auto mb-4 sm:mb-0">
            <h2 className="text-xl font-semibold md:text-3xl text-center sm:text-left">
              {profile.wishlist}
            </h2>
            <hr className="w-16 mb-3 mx-auto sm:mx-0 border-black" />
          </div>
        </div>

        <div className="w-full">
          {wishlistItems?.length > 0 ? (
            wishlistItems.map((item) => (
              <div
                key={item.id}
                className="w-full py-5 rounded-lg px-3 sm:px-5 mb-6 bg-[#d9d9d9] flex flex-col sm:flex-row justify-between items-center hover:shadow-xl transition duration-200"
              >
                {/* Image */}
                <div className="flex-shrink-0 mb-4 sm:mb-0">
                  <img
                    src={item.img}
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover"
                    alt="product"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 text-center sm:text-left sm:mx-3 md:mx-4 mb-4 sm:mb-0">
                  <h3 className="text-base font-semibold md:text-lg line-clamp-2">
                    {item.translated?.title}
                  </h3>

                  <p className="text-sm md:text-base mt-1">
                    {common.gender}:{' '}
                    <span className="font-bold text-gray-700">
                      {item.translated?.gender}
                    </span>
                  </p>
                  {item.discount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {item.discount}% {common.discount || 'off'}
                    </p>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="w-full sm:w-auto text-center sm:text-right">
                  <h3 className="text-lg font-bold mb-2">
                    {common.price}: {formatConvertedPrice(item.price)}
                  </h3>
                  

                  <div className="flex flex-col  gap-2 justify-center sm:justify-end">
                    <CommonButton
                      onClick={() =>
                        navigate(`/product-details/${item.productId}`)
                      }
                      variant={5}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      {common.viewDetails || 'View Details'}
                    </CommonButton>
                    <CommonButton
                      onClick={() => handleRemoveFromWishlist(item.productId)}
                      variant={5}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      {common.remove || 'Remove'}
                    </CommonButton>
                    {item.quantity > 0 && (
                      <CommonButton
                        onClick={() => handleMoveToCart(item)}
                        variant={5}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        {common.moveToCart || 'Move to Cart'}
                      </CommonButton>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg mb-4">
                {profile.emptyWishlist || 'Your wishlist is empty'}
              </p>
              <CommonButton
                onClick={() => navigate('/product-listings')}
                variant={5}
                size="md"
              >
                {common.startShopping || 'Start Shopping'}
              </CommonButton>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      <div className="col-span-1 md:col-span-5 p-3">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl text-center sm:text-left">
              {profile.relatedProducts}
            </h2>
            <hr className="w-32 md:w-48 mb-3 border-black mx-auto sm:mx-0" />
          </div>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {productList?.slice(0, 6)?.map((product) => (
            <div
              key={product.id}
              className="border bg-[#d9d9d9] text-black p-3 sm:p-4 relative hover:shadow-xl transition duration-200"
            >
              <div className="text-center">
                <img
                  src={resolveAssetUrl(product.images[0])}
                  alt={product.translated?.productName}
                  className="mx-auto w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 object-contain mb-3 sm:mb-4"
                />
                <h3 className="text-sm font-bold sm:text-base md:text-lg line-clamp-2 h-10 sm:h-12 flex items-center justify-center">
                  {product.translated?.productName}
                </h3>
                <p className="text-base md:text-lg my-2">
                  {formatConvertedPrice(product.price)}
                </p>
                {product.discount > 0 && (
                  <p className="text-sm text-gray-500 rounded-full mb-2">
                    {product.discount}% off
                  </p>
                )}

                <CommonButton
                  onClick={() => navigate(`/product-details/${product._id}`)}
                  variant={5}
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                >
                  {common.buyNow}
                </CommonButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SavedItems;
