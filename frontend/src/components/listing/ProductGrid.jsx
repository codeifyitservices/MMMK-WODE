/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button4 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import { FiHeart } from 'react-icons/fi';
import { message, notification } from 'antd';
import { addItemToWishList } from '../../apis/user/wishList';
import { getStoredUserId } from '../../utils/authStorage';
import { convertPrice, formatPrice } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import { useQueryClient } from '@tanstack/react-query';
import { getSingleProduct, getProductSkus } from '../../apis/nonAuth/products';
import { useCart } from '../../context/CartProvider';
import ProductImageCarousel from './ProductImageCarousel';
import VariantSelectionModal from './VariantSelectionModal';

const ProductGrid = ({ list = [], textColor = 'white' }) => {
  const {
    content: { common },
  } = useTranslationContext();
  const { currency, rates } = useCurrency();
  const queryClient = useQueryClient();
  const { addProductToCart } = useCart();
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [variantModalSkus, setVariantModalSkus] = useState([]);
  const [variantModalLoading, setVariantModalLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  const prefetchProductDetails = (productId) => {
    queryClient.prefetchQuery({
      queryKey: ['product-details', productId],
      queryFn: () => getSingleProduct(productId),
      staleTime: 60000,
    });
    queryClient.prefetchQuery({
      queryKey: ['product-skus', productId],
      queryFn: () => getProductSkus(productId),
      staleTime: 60000,
    });
  };

  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);


  const getProductName = (product) =>
    product?.translated?.productName ||
    product?.productName?.en ||
    product?.productName ||
    common.itemUnavailable;

  const getProductImage = (product) =>
    product?.thumbnail || product?.image || product?.images?.[0] || '';

  const getProductImages = (product) => {
    const primaryImage = product?.image;
    const primaryDisplayImage = product?.thumbnail || primaryImage;
    const images = [
      primaryDisplayImage,
      ...(Array.isArray(product?.images)
        ? product.images.filter((image) => image !== primaryImage && image !== product?.thumbnail)
        : []),
    ].filter(Boolean);

    return [...new Set(images)];
  };

  const productHasVariants = (product) =>
    (Array.isArray(product?.filters) && product.filters.length > 0) ||
    (Array.isArray(product?.skus) && product.skus.length > 0);

  const getProductStockStatus = (product) =>
    Number(product?.quantity || 0) <= 0 || product?.status === 'Out of stock';

  const productsById = useMemo(() => {
    return list.reduce((acc, product) => {
      if (product?._id) acc[product._id] = product;
      return acc;
    }, {});
  }, [list]);

  const loadProductSkus = async (product) => {
    if (Array.isArray(product?.skus) && product.skus.length > 0) {
      return product.skus;
    }

    return queryClient.fetchQuery({
      queryKey: ['product-skus', product._id],
      queryFn: () => getProductSkus(product._id),
      staleTime: 60000,
    });
  };

  const handleAddToCartClick = async (product) => {
    if (!product?._id || addingProductId) return;

    if (getProductStockStatus(product)) {
      message.warning(common.outOfStock || 'Sold out');
      return;
    }

    setAddingProductId(product._id);
    try {
      if (productHasVariants(product)) {
        setVariantModalProduct(product);
        setVariantModalLoading(true);
        const skus = await loadProductSkus(product);
        setVariantModalSkus(Array.isArray(skus) ? skus : []);
        setVariantModalLoading(false);
        return;
      }

      const added = await addProductToCart({
        productId: product._id,
        sku: undefined,
        quantity: 1,
        showMessage: true,
        productData: product,
      });

      if (!added) {
        message.error(common.addToCartFailed || 'Failed to add item to cart');
      }
    } catch (err) {
      
      message.error(err?.response?.data?.message || common.addToCartFailed || 'Failed to add item to cart');
      setVariantModalLoading(false);
    } finally {
      setAddingProductId(null);
    }
  };

  const handleVariantAddToCart = async ({ sku, quantity }) => {
    if (!variantModalProduct?._id || !sku || addingProductId) return;

    setAddingProductId(variantModalProduct._id);
    try {
      const added = await addProductToCart({
        productId: variantModalProduct._id,
        sku,
        quantity,
        showMessage: true,
      });

      if (added) {
        setVariantModalProduct(null);
        setVariantModalSkus([]);
      } else {
        message.error(common.addToCartFailed || 'Failed to add item to cart');
      }
    } catch (err) {
      
      message.error(err?.response?.data?.message || common.addToCartFailed || 'Failed to add item to cart');
    } finally {
      setAddingProductId(null);
    }
  };

  const closeVariantModal = () => {
    if (addingProductId) return;
    setVariantModalProduct(null);
    setVariantModalSkus([]);
    setVariantModalLoading(false);
  };

  const handleAddWishList = async (id) => {
    const userId = getStoredUserId();
    if (!userId) {
      notification.error({
        message: common.signInToContinue || 'Please sign in to continue',
        placement: 'topRight',
      });
      navigate('/auth', { state: { from: window.location.pathname } });
      return null;
    }

    try {
      await addItemToWishList({
        productId: id,
        userId,
      });
      notification.success({
        message: common.wishlistAdded,
        placement: 'topRight',
      });
    } catch (err) {
      
      notification.error({
        message: common.wishlistAddFailed,
        placement: 'topRight',
      });
    }
  };

  const navigate = useNavigate();
  return list?.length > 0 ? (
    <>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {list.map((product, index) => (
          <div
            key={product._id}
            onMouseEnter={() => prefetchProductDetails(product._id)}
            className="relative border border-white p-2 text-white sm:p-4"
          >
            <button
              type="button"
              title={common.addToWishlist}
              onClick={() => {
                handleAddWishList(product._id);
              }}
              aria-label={`${common.addToWishlist} ${getProductName(product)}`}
              className="absolute top-2 right-2 z-20"
            >
              <FiHeart className="absolute right-1 top-1 h-5 w-5 text-red-500 sm:right-4 sm:top-2 sm:h-6 sm:w-6" />
            </button>

            <div className="flex flex-col gap-2 text-center">
              {/* Fixed image container */}
              <div className="h-[210px] overflow-hidden bg-gray-800 flex items-center justify-center sm:h-[300px] md:h-[350px]">
                {getProductImage(product) ? (
                  <ProductImageCarousel
                    images={getProductImages(product)}
                    alt={getProductName(product)}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    fetchPriority={index < 4 ? 'high' : 'auto'}
                  />
                ) : (
                  <div className="text-gray-500 text-xs italic">{common.itemUnavailable}</div>
                )}
              </div>

              {/* Price */}
              {product.price && product.websitePrice ? (
                <p className="flex flex-wrap items-center justify-center gap-1 text-white sm:gap-2 sm:font-medium">
                  <span className="text-xs line-through sm:text-sm">
                    {formatConvertedPrice(product?.price)}
                  </span>
                  <span className="text-sm font-semibold sm:text-lg md:text-xl">
                    {formatConvertedPrice(product?.websitePrice)}
                  </span>
                </p>
              ) : (
                <p className="text-white">{common.itemUnavailable}</p>
              )}

              {/* Product Name */}
              <h3
                title={getProductName(product)}
                className={`truncate text-sm sm:text-base md:text-xl font-bold text-${textColor}`}
              >
                {getProductName(product)}
              </h3>

              {/* Brand */}
              {product.brand && (
                <p className={`text-sm font-bold text-${textColor}`}>
                  {product.brand}
                </p>
              )}

              {/* Buy Now Button */}
              <Button4
                onClick={() => navigate(`/product-details/${product._id}`)}
                className="!top-0 !border !px-2 !py-1 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
              >
                {getProductStockStatus(product)
                  ? common.soldOut
                  : common.buyNow}
              </Button4>

              <Button4
                type="button"
                disabled={getProductStockStatus(product) || addingProductId === product._id}
                onClick={() => handleAddToCartClick(product)}
                className="!top-0 !border !px-2 !py-1 !text-xs disabled:!cursor-not-allowed disabled:!opacity-50 sm:!px-4 sm:!py-2 sm:!text-sm"
              >
                {addingProductId === product._id
                  ? common.adding || 'Adding...'
                  : getProductStockStatus(product)
                    ? common.soldOut
                    : common.addToCart}
              </Button4>
            </div>
          </div>
        ))}
      </div>

      <VariantSelectionModal
        open={Boolean(variantModalProduct)}
        product={productsById[variantModalProduct?._id] || variantModalProduct}
        variants={variantModalSkus}
        loading={variantModalLoading}
        addLoading={Boolean(addingProductId && addingProductId === variantModalProduct?._id)}
        onCancel={closeVariantModal}
        onAddToCart={handleVariantAddToCart}
        formatPrice={formatConvertedPrice}
        common={common}
      />
    </>
  ) : (
    <div className="text-center font-semibold text-lg py-20">
      {common.noResultsFound}
    </div>
  );
};

export default ProductGrid;
