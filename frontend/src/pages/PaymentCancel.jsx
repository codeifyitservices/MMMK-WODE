import Banner from '../components/global/Banner';
import bg from '../assets/bg.png';
import { useTranslationContext } from '../context/TranslationContext';
import { CommonButton } from '../components/global/UIButtons';

const PaymentCancel = () => {
  const {
    content: { common },
  } = useTranslationContext();

  return (
    <div className="w-full">
      <Banner minHeight={40} bg={bg}>
        <div className="w-full">
          {/* main section */}
          <main className="w-full pt-20 text-black mt-20">
            <div className="w-full gap-5 px-5 py-12 text-center text-black bg- border-t border-b text-2nd md:px-20">
              <h2 className="text-xl font-bold text-white md:text-3xl lg:text-5xl uppercase tracking-wider">
                Payment Cancelled
              </h2>
              <p className="py-5 text-sm text-white/70 md:text-base lg:text-2xl">
                Your payment process was cancelled. No charges were made to your account.
              </p>
              <div className="flex flex-col gap-8 justify-center mt-10 md:flex-row">
                <CommonButton variant={1} isLink to="/checkout">
                  Back to Checkout
                </CommonButton>
                <CommonButton variant={1} isLink to="/product-listings">
                  {common.continueShopping}
                </CommonButton>
              </div>
            </div>
          </main>
        </div>
      </Banner>
    </div>
  );
};

export default PaymentCancel;
