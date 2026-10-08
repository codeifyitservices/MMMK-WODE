import bgImg from '../assets/bg.png';

const TermsConditions = () => {
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
          <p className="text-sm uppercase tracking-[0.35em] text-white/50">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Terms & Conditions</h1>
          <p className="mt-6 text-base leading-8 text-white/75 md:text-lg">
            Welcome to MMMK WODE. These Terms & Conditions govern your use of our website 
            and the purchase of our products. By accessing or using our site, you agree 
            to be bound by these terms.
          </p>

          <div className="mt-12 space-y-12 text-base leading-8 text-white/80 md:text-lg">

            {/* 1. General Conditions */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">1. General Conditions</h2>
              <p>
                We reserve the right to refuse service to anyone for any reason at any time. 
                You understand that your content (not including credit card information) 
                may be transferred unencrypted and involve transmissions over various networks.
              </p>
            </section>

            {/* 2. Products and Pricing */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">2. Products and Pricing</h2>
              <p>
                Prices for our products are subject to change without notice. We reserve the 
                right at any time to modify or discontinue the Service (or any part or content 
                thereof) without notice. We have made every effort to display as accurately 
                as possible the colors and images of our products that appear at the store.
              </p>
            </section>

            {/* 3. Accuracy of Billing and Account Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">3. Accuracy of Billing</h2>
              <p>
                You agree to provide current, complete, and accurate purchase and account 
                information for all purchases made at our store. You agree to promptly 
                update your account and other information, including your email address 
                and credit card numbers and expiration dates, so that we can complete 
                your transactions and contact you as needed.
              </p>
            </section>

            {/* 4. Third-Party Tools and Links */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">4. Third-Party Links</h2>
              <p>
                Certain content, products, and services available via our Service may 
                include materials from third-parties. Third-party links on this site may 
                direct you to third-party websites that are not affiliated with us. We 
                are not responsible for examining or evaluating the content or accuracy.
              </p>
            </section>

            {/* 5. User Comments and Feedback */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">5. User Feedback</h2>
              <p>
                If, at our request, you send certain specific submissions or without a 
                request from us you send creative ideas, suggestions, proposals, plans, 
                or other materials, you agree that we may, at any time, without 
                restriction, edit, copy, publish, distribute, translate and otherwise 
                use in any medium any comments that you forward to us.
              </p>
            </section>

            {/* 6. Prohibited Uses */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">6. Prohibited Uses</h2>
              <p>
                In addition to other prohibitions as set forth in the Terms & Conditions, 
                you are prohibited from using the site or its content: (a) for any unlawful 
                purpose; (b) to solicit others to perform or participate in any unlawful 
                acts; (c) to violate any international, federal, provincial or state 
                regulations, rules, laws, or local ordinances.
              </p>
            </section>

            {/* 7. Disclaimer of Warranties; Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">7. Limitation of Liability</h2>
              <p>
                We do not guarantee, represent or warrant that your use of our service 
                will be uninterrupted, timely, secure or error-free. You expressly 
                agree that your use of, or inability to use, the service is at your 
                sole risk.
              </p>
            </section>

            {/* 8. Governing Law */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">8. Governing Law</h2>
              <p>
                These Terms & Conditions and any separate agreements whereby we provide 
                you Services shall be governed by and construed in accordance with the 
                laws of the United Arab Emirates.
              </p>
            </section>

            {/* 9. Changes to Terms & Conditions */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">9. Changes to Terms</h2>
              <p>
                You can review the most current version of the Terms & Conditions at any 
                time at this page. We reserve the right, at our sole discretion, to 
                update, change or replace any part of these Terms & Conditions by 
                posting updates and changes to our website.
              </p>
            </section>

            {/* Contact Us */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
              <p>Questions about the Terms & Conditions should be sent to us at:</p>
              <ul className="space-y-1 pl-6">
                <li>
                  <span className="font-medium">Email: legal@mmmk-wode.com</span>
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

export default TermsConditions;
