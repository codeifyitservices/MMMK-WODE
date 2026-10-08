import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import video from '../../../../../assets/video.mp4';
import Section12Form from './Section12Form';
import { getHomeSection12 } from '../../../../../apis/admin/editPage';
import { useQuery } from '@tanstack/react-query';
import PageTitle from '../../../../UI/PageTitle';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';

const Section12 = () => {
  const [dataSource, setDataSource] = useState([]);

  const query = useQuery({
    queryKey: ['homeSection12'],
    queryFn: () => getHomeSection12(),
  });

  useEffect(() => {
    if (query.data) {
      setDataSource(() =>
        query.data?.data?.videos.map((video, index) => ({
          id: index,
          videoSrc: resolveAssetUrl(video),
        }))
      );
    }
  }, [query.data]);

  const VideoPlayer = ({ videoSrc }) => (
    <video
      className="w-full h-full object-cover"
      src={videoSrc}
      controls
      muted
      playsInline
    />
  );

  return (
    <>
      <PageTitle title="Section 12" />
      <Section12Form data={query.data?.data} query={query} />
      <div className="w-full max-w-6xl mx-auto px-4">
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={24}
          slidesPerView="auto"
          centeredSlides={true}
          loop={true}
          pagination={{ clickable: true }}
          navigation={true}
          className="py-8"
        >
          {dataSource?.map((slide, index) => (
            <SwiperSlide key={index} className="flex justify-center w-auto">
              <div className="relative w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-md md:max-w-sm">
                <div className="relative flex items-center justify-center aspect-video md:aspect-[16/9]">
                  <VideoPlayer videoSrc={slide.videoSrc} />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-medium md:text-xl">
                    Slide {slide.id}
                  </h3>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export default Section12;
