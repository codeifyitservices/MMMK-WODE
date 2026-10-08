/* eslint-disable no-unused-vars */
import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import VideoPlayer from '../global/VideoPlayer';
import video from '../../assets/video.mp4';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

// import required modules
import { Pagination } from 'swiper/modules';

const VideoSection = () => {
  return (
    <div className="py-[50px] videoSwiper bg-white my-10">
      <div className="w-full flex justify-between py-[50px]">
        {/* Left */}
        <div className="px-4 text-black md:px-20">
          <h2 className="text-6th font-[700]">
            What Our Customers Are Saying?
          </h2>
          <hr className="w-[50%] bg-black h-[5px]" />
        </div>
      </div>
      <Swiper
        slidesPerView={1} // Default to 1 for mobile
        spaceBetween={30}
        pagination={{
          clickable: true,
        }}
        modules={[Pagination]}
        className="mySwiper"
        breakpoints={{
          640: {
            slidesPerView: 2, // 2 slides for small devices
          },
          768: {
            slidesPerView: 3, // 3 slides for medium devices
          },
          1024: {
            slidesPerView: 4, // 4 slides for large devices
          },
          1280: {
            slidesPerView: 5, // 5 slides for extra-large devices
          },
        }}
      >
        {dataSource.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative flex items-center justify-center w-full border border-black ">
              <VideoPlayer videoSrc={slide.videoSrc} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default VideoSection;

const dataSource = [
  {
    id: 1,
    videoSrc: video,
    title: 'PARFUME',
  },
  {
    id: 2,
    videoSrc: video,
    title: 'PARFUME',
  },
  {
    id: 3,
    videoSrc: video,
    title: 'PARFUME',
  },
  {
    id: 4,
    videoSrc: video,
    title: 'PARFUME',
  },
  {
    id: 5,
    videoSrc: video,
    title: 'PARFUME',
  },
  {
    id: 6,
    videoSrc: video,
    title: 'PARFUME',
  },
];
