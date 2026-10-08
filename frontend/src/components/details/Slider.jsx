import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import { FreeMode, Thumbs } from 'swiper/modules';

import product1 from '../../assets/Home/model1.png';
import product2 from '../../assets/Home/model6.png';
import product3 from '../../assets/Home/model7.png';
import product4 from '../../assets/Home/model3.png';
import { resolveAssetUrl } from '../../utils/assetUrl';

export default function Slider({ images }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="max-w-screen-xl mx-auto slider-container">
      {/* Main Slider */}
      <Swiper
        style={{
          '--swiper-pagination-color': '#fff',
        }}
        spaceBetween={10}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        modules={[FreeMode, Thumbs]}
        className="mySwiper2"
        breakpoints={{
          640: {
            slidesPerView: 1, // For mobile screens, show one slide
            spaceBetween: 5,
          },
          768: {
            slidesPerView: 1, // Tablets, one slide per view
            spaceBetween: 10,
          },
          1024: {
            slidesPerView: 1, // For desktops, default one slide
            spaceBetween: 10,
          },
        }}
        onActiveIndexChange={(swiper) => {
          const currentIndex = swiper.activeIndex;
          setActiveImage(currentIndex);
        }}
      >
        {images?.map((img, index) => (
          <SwiperSlide key={`main-slide-${index}`}>
          <img
            src={resolveAssetUrl(img)}
            alt={`Slide ${index + 1}`}
            width="1200"
            height="1200"
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="object-cover max-h-[400px] w-auto shadow-md mx-auto"
          />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbs Slider */}
      <Swiper
        onSwiper={setThumbsSwiper}
        spaceBetween={8}
        slidesPerView={3} // Default for small screens (phones)
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Thumbs]}
        className="w-full mx-auto mt-4 mySwiper lg:w-[100%] lg:ml-12"
        breakpoints={{
          640: {
            slidesPerView: 3, // Small screens (phones), show 3 thumbnails
            spaceBetween: 8,
          },
          768: {
            slidesPerView: 4, // Medium screens (tablets), show 4 thumbnails
            spaceBetween: 10,
          },
          1024: {
            slidesPerView: 5, // Larger screens (desktops), show 5 thumbnails
            spaceBetween: 12,
          },
        }}
      >
        {images?.map((img, index) => (
          <SwiperSlide key={`thumb-slide-${index}`}>
          <img
            src={resolveAssetUrl(img)}
            alt={`Thumbnail ${index + 1}`}
            width="200"
            height="200"
            loading="lazy"
            decoding="async"
            className="object-contain w-full h-[70px] shadow-sm cursor-pointer relative"
            style={{
              opacity: activeImage === index ? 1 : 0.8,
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
