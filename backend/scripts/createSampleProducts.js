const mongoose = require('mongoose');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const connectDB = require('../Config/db');
require('dotenv').config();

const woodProducts = [
  {
    name: 'Classic Wooden Dining Table',
    description: 'Elegant dining table made from solid oak wood, perfect for family gatherings.',
    price: 899.99,
    images: ['image-1750148699216.jpg', 'image-1750663340990.png'],
    filters: ['Oak', 'Dining Room'],
    quantity: 10,
    weight: 45,
    brand: 'WoodCraft Elite'
  },
  {
    name: 'Modern Coffee Table',
    description: 'Contemporary design coffee table with walnut finish and glass top.',
    price: 299.99,
    images: ['image-1750663369647.png', 'image-1750663388408.png'],
    filters: ['Walnut', 'Living Room'],
    quantity: 15,
    weight: 20,
    brand: 'ModernWood'
  },
  {
    name: 'Wooden Bedside Cabinet',
    description: 'Compact bedside cabinet with two drawers, made from premium pine wood.',
    price: 149.99,
    images: ['image-1750663424518.jpeg', 'image-1750663782606.png'],
    filters: ['Pine', 'Bedroom'],
    quantity: 25,
    weight: 12,
    brand: 'SleepWell Furniture'
  },
  {
    name: 'Rustic Bookshelf',
    description: 'Five-tier bookshelf with rustic finish, perfect for home libraries.',
    price: 399.99,
    images: ['image-1750665017935.png', 'image-1750665043213.jpg'],
    filters: ['Rustic', 'Study Room'],
    quantity: 8,
    weight: 35,
    brand: 'BookNest'
  },
  {
    name: 'Kitchen Storage Cabinet',
    description: 'Versatile kitchen storage solution with adjustable shelves.',
    price: 599.99,
    images: ['image-1750665249434.png', 'image-1750673501901.jpg'],
    filters: ['Maple', 'Kitchen'],
    quantity: 12,
    weight: 40,
    brand: 'KitchenPro'
  },

  {
    name: 'Wooden TV Stand',
    description: 'Modern TV stand with cable management system.',
    price: 449.99,
    images: ['image-1750673577713.jpg', 'image-1750673636311.jpg'],
    filters: ['Oak', 'Living Room'],
    quantity: 10,
    weight: 30,
    brand: 'MediaWood'
  },
  {
    name: 'Corner Display Unit',
    description: 'Space-saving corner display unit with LED lighting.',
    price: 299.99,
    images: ['image-1750673745238.jpg', 'image-1750673812191.jpg'],
    filters: ['Pine', 'Living Room'],
    quantity: 8,
    weight: 25,
    brand: 'CornerCraft'
  },
  // Bedroom Furniture
  {
    name: 'Queen Size Bed Frame',
    description: 'Solid wood bed frame with headboard storage.',
    price: 799.99,
    images: ['image-1750675296092.jpg', 'image-1750678281733.jpg'],
    filters: ['Mahogany', 'Bedroom'],
    quantity: 5,
    weight: 65,
    brand: 'DreamWood'
  },
  {
    name: 'Wardrobe with Mirror',
    description: 'Three-door wardrobe with full-length mirror.',
    price: 899.99,
    images: ['image-1752322440782.jpg', 'image-1752322463814.jpg'],
    filters: ['Oak', 'Bedroom'],
    quantity: 6,
    weight: 85,
    brand: 'WardrobePro'
  },
  // Dining Room Furniture
  {
    name: 'Dining Chairs Set',
    description: 'Set of 6 dining chairs with comfortable cushioning.',
    price: 599.99,
    images: ['image-1752322489488.jpg', 'image-1752322516300.jpg'],
    filters: ['Teak', 'Dining Room'],
    quantity: 8,
    weight: 30,
    brand: 'DineWell'
  },
  {
    name: 'Buffet Cabinet',
    description: 'Large buffet cabinet with wine rack.',
    price: 749.99,
    images: ['image-1752322540599.jpg', 'image-1752322587748.jpg'],
    filters: ['Walnut', 'Dining Room'],
    quantity: 4,
    weight: 70,
    brand: 'WineDine'
  },
  // Office Furniture
  {
    name: 'Executive Desk',
    description: 'Large executive desk with built-in drawers.',
    price: 899.99,
    images: ['image-1752322618185.jpg', 'image-1752322638887.jpg'],
    filters: ['Maple', 'Office'],
    quantity: 5,
    weight: 75,
    brand: 'OfficePro'
  },
  {
    name: 'Filing Cabinet',
    description: 'Four-drawer filing cabinet with lock system.',
    price: 299.99,
    images: ['image-1752322661894.jpg', 'image-1752322686032.jpg'],
    filters: ['Oak', 'Office'],
    quantity: 12,
    weight: 45,
    brand: 'FileMaster'
  },
  // Outdoor Furniture
  {
    name: 'Garden Bench',
    description: 'Weather-resistant wooden garden bench.',
    price: 249.99,
    images: ['image-1752323327965.jpg', 'image-1752323363103.jpg'],
    filters: ['Teak', 'Outdoor'],
    quantity: 15,
    weight: 25,
    brand: 'OutdoorLife'
  },
  {
    name: 'Patio Table Set',
    description: 'Table with 4 chairs for outdoor dining.',
    price: 699.99,
    images: ['image-1752323382018.jpg', 'image-1752323399230.jpg'],
    filters: ['Teak', 'Outdoor'],
    quantity: 6,
    weight: 50,
    brand: 'PatioPlus'
  }
];

const createSampleProducts = async () => {
  try {
    // Connect to database
    await connectDB();

    // Create or find furniture category
    const category = await Category.findOneAndUpdate(
      { 'name.en': 'Furniture' },
      {
        name: {
          en: 'Furniture',
          ar: 'أثاث',
          fr: 'Meubles',
          ru: 'Мебель',
          zh: '家具',
          es: 'Muebles'
        },
        image: 'image-1750148699216.jpg',
        subcategories: [
          { en: 'Living Room' },
          { en: 'Bedroom' },
          { en: 'Dining Room' },
          { en: 'Office' },
          { en: 'Outdoor' }
        ],
        filters: [
          { name: 'Oak' },
          { name: 'Pine' },
          { name: 'Walnut' },
          { name: 'Teak' },
          { name: 'Mahogany' },
          { name: 'Maple' }
        ]
      },
      { upsert: true, new: true }
    );

    console.log('Category created/updated successfully');

    // Create products
    for (const product of woodProducts) {
      const newProduct = new Product({
        category: category._id,
        images: product.images,
        image: product.images[0],
        quantity: product.quantity,
        weight: product.weight,
        brand: product.brand,
        status: 'Active',
        productName: {
          en: product.name,
          ar: product.name, // You might want to add translations here
          fr: product.name,
          ru: product.name,
          zh: product.name,
          es: product.name
        },
        productDescription: {
          en: product.description,
          ar: product.description,
          fr: product.description,
          ru: product.description,
          zh: product.description,
          es: product.description
        },
        filters: product.filters,
        price: product.price,
        websitePrice: product.price,
        discount: 0,
        showOnHomepage: Math.random() < 0.3, // 30% chance to show on homepage
        homePageBottomSection: Math.random() < 0.2, // 20% chance to show in bottom section
      });

      await newProduct.save();
      console.log(`Created product: ${product.name}`);
    }

    console.log('All products created successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating products:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createSampleProducts();