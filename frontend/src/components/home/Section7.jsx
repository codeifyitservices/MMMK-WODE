import { memo } from 'react';
import { Button4 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import { getHomePageBottomSection } from '../../apis/nonAuth/products';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { convertPrice, formatPrice } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import { resolveAssetUrl } from '../../utils/assetUrl';

const ProductItem = memo(({ product, translateLanguage, common, formatConvertedPrice, navigate, index }) => {
  const getProductName = (product) =>
    product?.translated?.productName ||
    product?.productName?.[translateLanguage] ||
    product?.productName?.en ||
    '';

  const productName = getProductName(product);

  return (
    <div className="relative p-4 text-white border border-white">
      <div className="flex min-h-[350px] flex-col text-center">
        <div className="aspect-square w-full overflow-hidden sm:aspect-[4/5] bg-gray-800">
          <img
            src={resolveAssetUrl(product?.image)}
            alt={productName || common.productImageAlt}
            width="400"
            height="500"
            loading={index < 4 ? 'eager' : 'lazy'}
            fetchPriority={index < 4 ? 'high' : 'auto'}
            decoding="async"
            className="h-full w-full object-cover transition-opacity duration-300"
            onLoad={(e) => {
              e.target.style.opacity = 1;
            }}
            style={{ opacity: 0 }}
          />
        </div>
        {product.price && product.websitePrice ? (
          <p className="mt-4 flex flex-wrap items-center justify-center gap-2 font-medium text-white">
            <span className="line-through text-sm">
              {formatConvertedPrice(product?.price)}
            </span>
            <span className="text-lg font-semibold md:text-xl">
              {formatConvertedPrice(product?.websitePrice)}
            </span>
          </p>
        ) : (
          <p className="mt-4">{common.itemUnavailable}</p>
        )}
        <h3 className="text-base md:text-xl font-bold text-white">
          {productName}
        </h3>

        {product.brand && (
          <p className="text-sm font-bold text-white">
            {product.brand}
          </p>
        )}

        <Button4
          onClick={() => navigate(`/product-details/${product._id}`)}
          className="!top-0 !py-2 !border"
          aria-label={`${common.view} ${productName}`}
        >
          {common.view}
        </Button4>
      </div>
    </div>
  );
});

const SkeletonItem = () => (
  <div className="relative p-4 text-white border border-white animate-pulse">
    <div className="flex min-h-[350px] flex-col text-center">
      <div className="aspect-square w-full sm:aspect-[4/5] bg-gray-700" />
      <div className="mt-4 h-6 w-3/4 mx-auto bg-gray-700 rounded" />
      <div className="mt-2 h-8 w-1/2 mx-auto bg-gray-700 rounded" />
      <div className="mt-4 h-10 w-full bg-gray-700 rounded" />
    </div>
  </div>
);

const Section7 = () => {
  const {
    translateLanguage,
    content: { common },
  } = useTranslationContext();
  const navigate = useNavigate();
  const { currency, rates } = useCurrency();
  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

  const productsQuery = useQuery({
    queryKey: ['home-bottomSection-products'],
    queryFn: () => getHomePageBottomSection(),
  });

  return (
    <div className="relative bg-[var(--primary-dark)] px-4 py-10 md:px-0">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {productsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)
          : productsQuery?.data?.map((product, index) => (
              <ProductItem
                key={product._id || index}
                product={product}
                translateLanguage={translateLanguage}
                common={common}
                formatConvertedPrice={formatConvertedPrice}
                navigate={navigate}
                index={index}
              />
            ))}
      </div>
    </div>
  );
};

export default Section7;
