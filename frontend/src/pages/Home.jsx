/* eslint-disable no-unused-vars */
import { lazy, Suspense } from 'react';
import BannerVideo from '../components/global/BannerVideo';
import { CommonButton } from '../components/global/UIButtons';
import { useTranslationContext } from '../context/TranslationContext';
import LazySection from '../components/global/LazySection';

import Section8 from '../components/home/Section8';
import Slider from '../components/global/Slider';

import { useQuery } from '@tanstack/react-query';
import { getHomeBanner } from '../apis/nonAuth/editPage';
import BannerBubble from '../components/global/BannerBubble';

const Section2 = lazy(() => import('../components/home/Section2').catch(() => { window.location.reload(); }));
const Section3 = lazy(() => import('../components/home/Section3').catch(() => { window.location.reload(); }));
const Section6 = lazy(() => import('../components/home/Section6').catch(() => { window.location.reload(); }));
const Section7 = lazy(() => import('../components/home/Section7').catch(() => { window.location.reload(); }));
const Enquiry = lazy(() => import('../components/home/Enquiry').catch(() => { window.location.reload(); }));
const NewsLetter = lazy(() => import('../components/global/NewsLetter').catch(() => { window.location.reload(); }));
const ShopInstant = lazy(() => import('../components/home/ShopInstant').catch(() => { window.location.reload(); }));
const RecommendedSection = lazy(() => import('../components/home/RecommendedSection').catch(() => { window.location.reload(); }));
const BannerSection = lazy(() => import('../components/home/BannerSection').catch(() => { window.location.reload(); }));
const BikiniSection = lazy(() => import('../components/home/BikiniSection').catch(() => { window.location.reload(); }));
const Section10 = lazy(() => import('../components/home/Section10').catch(() => { window.location.reload(); }));
const LuxurySection = lazy(() => import('../components/home/LuxurySection').catch(() => { window.location.reload(); }));
const Section11 = lazy(() => import('../components/home/Section11').catch(() => { window.location.reload(); }));
const ComingSoonSection = lazy(
  () => import('../components/home/ComingSoonSection').catch(() => { window.location.reload(); })
);
const VideoCard = lazy(() => import('../components/home/VideoCard').catch(() => { window.location.reload(); }));

const Home = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();

  const bannerQuery = useQuery({
    queryKey: ['homeBanner'],
    queryFn: getHomeBanner,
  });

  const bannerData = bannerQuery.data?.data?.home?.banner;

  return (
    <div className="w-full">
      <BannerVideo bg="/heroSectionBg1.mp4" poster="/bannerSectionImage.jpg">
        <div className="flex min-h-[520px] flex-col items-center justify-center px-4 py-24 text-center text-white sm:min-h-[620px] md:min-h-[70vh] md:mt-16">
          <BannerBubble
            text={bannerData?.bubbleText}
            link={bannerData?.bubbleLink}
            enabled={bannerData?.bubbleEnabled}
          />
          <h1 className="my-4 max-w-full text-4xl font-semibold leading-tight text-orange-200 sm:text-6xl md:text-8xl lg:text-7xl sm:my-6 md:my-10">
            {homepage.section1Heading1 || common.mmmk}
          </h1>
          <CommonButton variant={1} size="md" isLink to="/product-listings">
            {common.shopNow}
          </CommonButton>
        </div>
      </BannerVideo>
      <div style={{ minHeight: '420px' }}>
        <Section8 />
      </div>
      <div style={{ minHeight: '520px' }}>
        <Slider />
      </div>
      <LazySection minHeight="420px">
        <Suspense fallback={<div className="h-[420px]" />}>
          <Section2 />
        </Suspense>
      </LazySection>
      <LazySection minHeight="55wishlist will still require 0px">
        <Suspense fallback={<div className="h-[900px]" />}>
          <BikiniSection />
        </Suspense>
      </LazySection>
        <Suspense fallback={<div className="h-[680px]" />}>
          <RecommendedSection />
        </Suspense>
      <LazySection minHeight="500px">
        <Suspense fallback={<div className="h-[700px]" />}>
          <BannerSection />
        </Suspense>
      </LazySection>
      <LazySection minHeight="220px">
        <Suspense fallback={<div className="h-[220px]" />}>
          <ShopInstant />
        </Suspense>
      </LazySection>
      <LazySection minHeight="520px">
        <Suspense fallback={<div className="h-[520px]" />}>
          <Section6 />
        </Suspense>
      </LazySection>
      {/* <LazySection minHeight="680px"> */}
        <Suspense fallback={<div className="h-[680px]" />}>
          <VideoCard />
        </Suspense>
      {/* </LazySection> */}
      {/* <Section9 /> */}
      <LazySection minHeight="520px">
        <Suspense fallback={<div className="h-[520px]" />}>
          <Section3 />
        </Suspense>
      </LazySection>
      <LazySection minHeight="260px">
        <Suspense fallback={<div className="h-[260px]" />}>
          <Enquiry />
        </Suspense>
      </LazySection>
      <LazySection minHeight="600px">
        <Suspense fallback={<div className="h-[600px]" />}>
          <ComingSoonSection />
        </Suspense>
      </LazySection>
      <LazySection minHeight="700px">
        <Suspense fallback={<div className="h-[700px]" />}>
          <Section7 />
        </Suspense>
      </LazySection>
      <LazySection minHeight="100vh">
        <Suspense fallback={<div className="min-h-[560px] md:min-h-screen" />}>
          <LuxurySection />
        </Suspense>
      </LazySection>
      {/* <LazySection minHeight="720px"> */}
        <Suspense fallback={<div className="h-[720px]" />}>
          <Section10 />
        </Suspense>
      {/* </LazySection> */}
      {/* <LazySection minHeight="720px"> */}
        <Suspense fallback={<div className="h-[720px]" />}>
          <Section11 />
        </Suspense>
      {/* </LazySection> */}
      <LazySection minHeight="240px">
        <Suspense fallback={<div className="h-[240px]" />}>
          <NewsLetter />
        </Suspense>
      </LazySection>
    </div>
  );
};

export default Home;
