/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import productImg from '../../assets/banner/product.jpeg';
import { useTranslationContext } from '../../context/TranslationContext';

const BannerSlider = () => {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const {
    content: { common },
  } = useTranslationContext();

  const data = [
    {
      id: 1,
      img: productImg,
      title: common.searchProductName1,
      description: common.searchProductDescription1,
    },
    {
      id: 2,
      img: productImg,
      title: common.searchProductName1,
      description: common.searchProductDescription1,
    },
    {
      id: 3,
      img: productImg,
      title: common.searchProductName1,
      description: common.searchProductDescription1,
    },
    {
      id: 4,
      img: productImg,
      title: common.searchProductName1,
      description: common.searchProductDescription1,
    },
  ];

  const handleChange = (index) => {
    setCurrentNumber(index);
  };

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentNumber((prevNumber) => (prevNumber + 1) % data.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [data.length, isHovered]);

  return (
    <div
      className="w-full flex flex-col lg:flex-row bg-[#59605c] py-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="w-full lg:w-[50%] text-center mb-10 lg:mb-0">
        <img
          src={data[currentNumber].img}
          alt={data[currentNumber].title}
          width="400"
          height="500"
          loading={currentNumber === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className="w-[80%] lg:w-[400px] mx-auto"
        />
        <div className="flex justify-center w-full gap-5 py-5 text-center lg:py-10">
          {data.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`block w-[20px] h-[20px] rounded-full border border-white cursor-pointer ${
                index === currentNumber ? 'bg-white' : ''
              }`}
              onClick={() => handleChange(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Text Section */}
      <div className="w-full lg:w-[50%] text-white text-center lg:text-left px-5 lg:px-0">
        <h3 className="text-xl text-4th lg:text-2xl">
          {data[currentNumber].title}
        </h3>
        <p className="my-5 text-2nd lg:my-10">
          {data[currentNumber].description}
        </p>
        <button type="button" className="px-10 py-2 font-bold text-black bg-white">
          {common.buyNow}
        </button>
      </div>
    </div>
  );
};

export default BannerSlider;
