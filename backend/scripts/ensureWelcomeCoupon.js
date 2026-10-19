const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ensureCoupon = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmmk');
    console.log('Connected to MongoDB');

    const Coupon = require('../Models/coupon');
    const NewsletterPopupSettings = require('../Models/NewsletterPopupSettings');

    const settings = await NewsletterPopupSettings.getSettings();
    const code = settings.discountCode || 'WELCOME15';

    let coupon = await Coupon.findOne({ couponCode: code });
    if (!coupon) {
      coupon = await Coupon.create({
        couponName: `Newsletter VIP Voucher (${code})`,
        couponCode: code,
        discount: settings.discountValue || 15,
        discountType: settings.discountType || 'percentage',
        showToUsers: true,
        applyToProducts: true,
        applyToDelivery: false,
        scope: 'All',
        perUserLimit: 1,
        maxUsage: null,
        expiryDate: null,
      });
      console.log(`Created coupon in DB: ${coupon.couponCode}`);
    } else {
      console.log(`Coupon already exists in DB: ${coupon.couponCode}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error ensuring coupon:', error);
    process.exit(1);
  }
};

ensureCoupon();
