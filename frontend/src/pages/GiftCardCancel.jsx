import Banner from '../components/global/Banner';
import bg from '../assets/bg.png';
import { useTranslationContext } from '../context/TranslationContext';
import { CommonButton } from '../components/global/UIButtons';
import { FiGift } from 'react-icons/fi';
import { LuAlertCircle } from 'react-icons/lu';

const GiftCardCancel = () => {
  const {
    content: { common },
  } = useTranslationContext();

  return (
    <div className="w-full">
      <Banner minHeight={35} bg={bg} />

      <main className="w-full pb-20 text-black bg-transparent">
        <div className="w-full gap-5 px-5 py-12 text-center text-black bg-white border-t border-b md:px-20">
          
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 p-4 rounded-full relative">
               <FiGift size={64} className="text-black opacity-30" />
               <LuAlertCircle size={32} className="text-red-600 absolute bottom-2 right-2" />
            </div>
          </div>

          <h2 className="text-2xl font-bold md:text-4xl lg:text-5xl uppercase tracking-tight text-gray-900">
            Purchase Cancelled
          </h2>

          <p className="py-5 text-lg text-gray-600 max-w-2xl mx-auto">
            You have cancelled the gift card purchase process. No funds have been deducted from your account. 
            If you encountered any issues during payment, feel free to try again.
          </p>

          <div className="flex flex-col gap-4 justify-center mt-12 md:flex-row md:items-center">
            <CommonButton 
                variant={5} 
                size="md" 
                isLink 
                to="/gift-cards/buy"
            >
              Try Again
            </CommonButton>
            
            <CommonButton 
                variant={6} 
                size="md" 
                isLink 
                to="/gift-cards"
            >
              Back to Gift Cards
            </CommonButton>

            <CommonButton 
                variant={5} 
                size="md" 
                isLink 
                to="/product-listings"
                className="opacity-70"
            >
              {common.continueShopping}
            </CommonButton>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GiftCardCancel;
