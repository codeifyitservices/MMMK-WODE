/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Link, useNavigate } from 'react-router-dom';

import { Button3, Button4 } from '../global/UIButtons';
import CustomCarousel from '../global/Carousal';
import { useTranslationContext } from '../../context/TranslationContext';
import { useGlobalContext } from '../../context/GlobalProvider';
import { convertPrice, formatPrice } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import { resolveAssetUrl } from '../../utils/assetUrl';
import RecommendedSkeleton from './RecommendedSkeleton';

export default function RecommendedSection() {
  const {
    translateLanguage,
    content: { common, homepage },
  } = useTranslationContext();
  const { recommendedProducts, isRecommendedLoading } = useGlobalContext();
  const { currency, rates } = useCurrency();
  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);
  const navigate = useNavigate();
  const isArabic = translateLanguage === 'ar';

  if (isRecommendedLoading && recommendedProducts.length === 0) {
    return <RecommendedSkeleton />;
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  const totalSlides = recommendedProducts.length;

  return (
    <section className="w-full py-12">
      <div className="container px-4 mx-auto">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:ml-12 md:flex-row">
          <h2 className="text-xl text-[#FFA500] font-bold text-center sm:text-3xl md:text-4xl lg:text-5xl">
            {homepage.section5Heading1}
          </h2>
          <Button3 isLink to="/product-listings" className="!text-sm !py-2">
            {common.viewAll}
          </Button3>
        </div>

        <CustomCarousel
          items={recommendedProducts}
          renderItem={(product, i) => (
            <div
              key={product._id}
              className="group relative mx-auto h-[320px] w-[82vw] flex-shrink-0 sm:w-[300px] md:h-[350px] md:w-[340px] lg:h-[400px] lg:w-[430px] bg-gray-800"
            >
              <img
                src={resolveAssetUrl(product.image)}
                alt={product.nameInLanguage?.[translateLanguage] || 'Product'}
                width="450"
                height="450"
                className="w-full h-full object-cover transition-opacity duration-300"
                loading={i < 3 ? 'eager' : 'lazy'}
                fetchPriority={i < 3 ? 'high' : 'auto'}
                decoding="async"
                onLoad={(e) => {
                  e.target.style.opacity = 1;
                }}
                style={{ opacity: 0 }}
              />

              <Link
                to={`/product-details/${product._id}`}
                className="absolute inset-0 z-[1]"
              >
                <span className="block w-full h-full opacity-0 border-4 border-white transition-all duration-500 group-hover:opacity-100"></span>
              </Link>

              <div
                className="absolute z-[2] bottom-0 left-0 right-0 text-white"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)',
                  padding: '48px 16px 16px',
                }}
              >
                {product.price && product.websitePrice ? (
                  <p
                    className="font-medium text-white flex justify-center items-center gap-2"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                  >
                    <span className="line-through text-sm opacity-75">
                      {formatConvertedPrice(product?.price)}
                    </span>
                    <span className="text-lg font-semibold md:text-xl">
                      {formatConvertedPrice(product?.websitePrice)}
                    </span>
                  </p>
                ) : (
                  <p
                    className="text-center text-sm"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                  >
                    {common.itemUnavailable}
                  </p>
                )}

                <p
                  className="px-2 text-center text-lg leading-snug sm:text-xl"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                >
                  {product.nameInLanguage?.[translateLanguage]}
                </p>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
}