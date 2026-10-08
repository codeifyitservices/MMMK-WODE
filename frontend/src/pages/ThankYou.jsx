/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';

import Banner from '../components/global/Banner';
import NewsLetter from '../components/global/NewsLetter';
import bg from '../assets/bg.png';
import CategoryNavBar from '../components/global/CategoryNavBar';
import { Link, useParams } from 'react-router-dom';
import { useTranslationContext } from '../context/TranslationContext';
import { CommonButton } from '../components/global/UIButtons';

const ThankYou = () => {
  const params = useParams();
  const {
    content: { common, thankYou },
  } = useTranslationContext();

  return (
    <div className="w-full">
      <Banner minHeight={50} bg={bg}>
        <div className="w-full">

          {/* main section */}
          <main className="w-full py-20 text-black bg-white">
            <div className="w-full gap-5 px-5 py-12 text-center text-black bg-white border-t border-b text-2nd md:px-20">
              <h2 className="text-xl font-bold text-5th md:text-3xl lg:text-5xl">
                {common.thankYou}
              </h2>
              <p className="py-5 text-sm text-6th md:text-base lg:text-3xl">
                {thankYou.orderReceived}
              </p>
              <div className="flex flex-col gap-8 justify-center mt-6 md:flex-row">
                <CommonButton variant={6} isLink to="/product-listings">
                  {common.continueShopping}
                </CommonButton>
                <CommonButton variant={6} isLink to="/profile/my-account">
                  {common.myOrders}
                </CommonButton>
              </div>
            </div>
          </main>
        </div>
      </Banner>
    </div>
  );
};

export default ThankYou;
