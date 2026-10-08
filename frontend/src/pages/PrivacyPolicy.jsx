import bgImg from '../assets/bg.png';

const PrivacyPolicy = () => {
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
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Privacy Policy</h1>
          <p className="mt-6 text-base leading-8 text-white/75 md:text-lg">
            At MMMK WODE, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or make a purchase.
          </p>

          <div className="mt-12 space-y-12 text-base leading-8 text-white/80 md:text-lg">
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Information We Collect</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                  <p>We may collect:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Full Name</li><li>Email Address</li><li>Phone Number</li><li>Billing Address</li><li>Shipping Address</li><li>Date of Birth</li><li>Account Credentials</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Order Information</h3>
                  <p>We may collect:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Purchase history</li><li>Order details</li><li>Transaction information</li><li>Delivery information</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Technical Information</h3>
                  <p>We may automatically collect:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>IP Address</li><li>Browser Type</li><li>Device Information</li><li>Operating System</li><li>Website Usage Data</li><li>Cookies and Tracking Information</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="grid list-disc grid-cols-1 gap-x-12 gap-y-1 pl-6 md:grid-cols-2">
                <li>Process orders</li><li>Deliver products</li><li>Provide customer support</li><li>Manage accounts</li><li>Improve website functionality</li><li>Send order updates</li><li>Prevent fraud</li><li>Comply with legal obligations</li><li>Send marketing communications (with consent)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">Payment Information</h2>
              <p>Payments are processed through secure third-party payment providers. We do not store complete credit card or debit card details on our servers.</p>
            </section>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Marketing Communications</h2>
                <p>With your permission, we may send:</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>Promotional offers</li><li>New product announcements</li><li>Newsletters</li><li>Exclusive discounts</li>
                </ul>
                <p>You may unsubscribe at any time using the link provided in our emails.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Cookies</h2>
                <p>Our website uses cookies to:</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>Improve user experience</li><li>Remember preferences</li><li>Analyze website traffic</li><li>Personalize content</li>
                </ul>
                <p>You may disable cookies through your browser settings, although some website functionality may be affected.</p>
              </section>
            </div>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Sharing Information</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Service Providers</h3>
                  <p>We may share information with:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Payment processors</li><li>Shipping companies</li><li>Marketing service providers</li><li>Hosting providers</li><li>Analytics providers</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Legal Requirements</h3>
                  <p>We may disclose information if required by law or governmental authorities. We do not sell, rent, or trade personal information to third parties.</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">Data Security</h2>
              <p>We implement reasonable technical and organizational measures to protect your information from unauthorized access, misuse, loss, disclosure, and alteration. However, no method of transmission over the internet is completely secure.</p>
            </section>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Data Retention</h2>
                <p>We retain personal information only for as long as necessary to:</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>Fulfill business purposes</li><li>Meet legal obligations</li><li>Resolve disputes</li><li>Enforce agreements</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Your Rights</h2>
                <p>Depending on your jurisdiction, you may have the right to:</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>Access your personal information</li><li>Correct inaccurate information</li><li>Request deletion of personal data</li><li>Restrict processing</li><li>Withdraw consent</li><li>Request data portability</li>
                </ul>
                <p>To exercise these rights, contact us using the information below.</p>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Children's Privacy</h2>
                <p>Our website is not intended for children under the age of 18. We do not knowingly collect personal information from minors.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Third-Party Services</h2>
                <p>Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of those external websites.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">Changes to This Policy</h2>
                <p>We may update this Privacy Policy periodically. Updated versions will be posted on this page with the revised date.</p>
              </section>
            </div>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please reach out:</p>
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

export default PrivacyPolicy;
