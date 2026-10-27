import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslationContext } from '../../context/TranslationContext';
import { FiHeart, FiPlus } from 'react-icons/fi';
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

  const hoverTimeoutRef = useRef(null);

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

  const handleCardMouseEnter = (productId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      prefetchProductDetails(productId);
    }, 200);
  };

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
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

    // Limit to 3 images per product card in the listing grid to prevent excessive memory & network stalls
    return [...new Set(images)].slice(0, 3);
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
            onMouseEnter={() => handleCardMouseEnter(product._id)}
            onMouseLeave={handleCardMouseLeave}
            onClick={() => navigate(`/product-details/${product._id}`)}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '300px 450px' }}
            className="group relative border border-white p-2 text-white sm:p-4 cursor-pointer transition-all duration-300 hover:border-white/80 hover:bg-white/[0.04]"
          >
            <button
              type="button"
              title={common.addToWishlist}
              onClick={(e) => {
                e.stopPropagation();
                handleAddWishList(product._id);
              }}
              aria-label={`${common.addToWishlist} ${getProductName(product)}`}
              className="absolute top-2 right-2 z-20"
            >
              <FiHeart className="absolute right-1 top-1 h-5 w-5 text-red-500 sm:right-4 sm:top-2 sm:h-6 sm:w-6 transition-transform hover:scale-110" />
            </button>

            <div className="flex flex-col gap-2 text-center">
              {/* Fixed image container */}
              <div className="h-[210px] overflow-hidden bg-gray-800 flex items-center justify-center sm:h-[300px] md:h-[350px] cursor-pointer">
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

              {/* Details (Title & Brand) + Pure borderless '+' Add to Cart Icon (Zara style) */}
              <div className="flex items-center justify-between gap-2 text-left pt-1">
                <div className="min-w-0 flex-1">
                  <h3
                    title={getProductName(product)}
                    className={`truncate text-xs sm:text-sm font-semibold text-${textColor} group-hover:underline transition-colors tracking-wide`}
                  >
                    {getProductName(product)}
                  </h3>
                </div>

                <button
                  type="button"
                  title={getProductStockStatus(product) ? common.soldOut : common.addToCart}
                  disabled={getProductStockStatus(product) || addingProductId === product._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCartClick(product);
                  }}
                  className="shrink-0 p-1 text-white hover:text-white/70 transition-transform hover:scale-125 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none"
                  aria-label={common.addToCart}
                >
                  <FiPlus size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Price / MRP */}
              {product.price && product.websitePrice ? (
                <div className="flex flex-wrap items-center justify-start gap-1.5 text-left text-white">
                  <span className="text-xs font-semibold sm:text-sm">
                    {formatConvertedPrice(product?.websitePrice)}
                  </span>
                  {product?.price > product?.websitePrice && (
                    <span className="text-[11px] text-gray-400 line-through sm:text-xs">
                      {formatConvertedPrice(product?.price)}
                    </span>
                  )}
                  {getProductStockStatus(product) && (
                    <span className="text-[10px] sm:text-[11px] text-red-400 font-medium ml-1">
                      {common.soldOut}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-white text-left">{common.itemUnavailable}</p>
              )}
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
