import bgImg from '../assets/bg.png';

const ReturnPolicy = () => {
  return (
    <div
      className="relative pt-28"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <main className="relative z-10 px-5 py-16 text-white md:px-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm uppercase tracking-[0.35em] text-white/50">Service</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Return & Refund Policy</h1>
          <p className="mt-6 text-base leading-8 text-white/75 md:text-lg">
            At MMMK WODE, we strive to ensure your complete satisfaction with every purchase. 
            If you are not entirely satisfied with your order, we are here to help.
          </p>

          <div className="mt-12 space-y-12 text-base leading-8 text-white/80 md:text-lg">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Eligibility for Returns</h2>
              <p>To be eligible for a return, please ensure that:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>The item was purchased within the last 14 days.</li>
                <li>The product is in its original packaging.</li>
                <li>The product isn't used or damaged.</li>
                <li>You have the receipt or proof of purchase.</li>
              </ul>
              <p className="text-white/70 italic">
                Note: Fragrances and personal care items must be unopened with the original seal intact due to hygiene reasons.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Non-returnable Items</h2>
              <p>The following items cannot be returned:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Personalized or custom-made items.</li>
                <li>Items on final sale or clearance.</li>
                <li>Opened fragrances or beauty products.</li>
                <li>Intimate apparel (bikinis) where the hygiene seal has been removed.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">How to Initiate a Return</h2>
              <p>To start a return process, please follow these steps:</p>
              <ol className="list-decimal space-y-2 pl-6">
                <li>Contact our customer support team at support@mmmk-wode.com with your order number.</li>
                <li>Provide a brief explanation of the reason for the return.</li>
                <li>Our team will provide you with a Return Merchandise Authorization (RMA) number and instructions on where to send your package.</li>
              </ol>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Refunds</h2>
              <p>
                Once we receive your item, we will inspect it and notify you that we have received your returned item. 
                We will immediately notify you on the status of your refund after inspecting the item.
              </p>
              <p>
                If your return is approved, we will initiate a refund to your original method of payment. 
                You will receive the credit within a certain amount of days, depending on your card issuer's policies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Shipping Costs</h2>
              <p>
                You will be responsible for paying for your own shipping costs for returning your item. 
                Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
              <p>If you have any questions on how to return your item to us, contact us:</p>
              <ul className="space-y-1 pl-6">
                <li>
                  <span className="font-medium">Email: support@mmmk-wode.com</span>
                </li>
                <li>
                  <span className="font-medium">Phone: +971 582908669</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReturnPolicy;
