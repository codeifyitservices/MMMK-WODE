const mongoose = require('mongoose');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const connectDB = require('../Config/db');
require('dotenv').config();

// Define Sku model once at the top level
const skuSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String, required: true },
  filters: { type: Object, default: {} },
  quantity: { type: Number, default: 0 },
});

// Check if model exists before creating
const Sku = mongoose.models.Sku || mongoose.model('Sku', skuSchema);

const categories = [
  {
    name: {
      en: 'Kitchen Accessories',
      ar: 'اكسسوارات المطبخ',
      fr: 'Accessoires de Cuisine',
      ru: 'Кухонные принадлежности',
      zh: '厨房配件',
      es: 'Accesorios de Cocina'
    },
    image: 'image-1750673501901.jpg',
    subcategories: [
      { en: 'Cutting Boards' },
      { en: 'Utensil Holders' },
      { en: 'Spice Racks' }
    ],
    products: [
      {
        name: 'Premium Wooden Cutting Board',
        description: 'Handcrafted cutting board made from sustainable bamboo wood.',
        price: 49.99,
        images: ['image-1752323448059.jpg', 'image-1752323508096.jpg'],
        quantity: 30,
        weight: 2.5,
        brand: 'KitchenCraft'
      },
      {
        name: 'Wooden Utensil Organizer',
        description: 'Elegant utensil holder with multiple compartments.',
        price: 39.99,
        images: ['image-1752387312055.jpg', 'image-1752387365521.jpg'],
        quantity: 25,
        weight: 1.8,
        brand: 'KitchenCraft'
      }
    ]
  },
  {
    name: {
      en: 'Decorative Items',
      ar: 'عناصر الديكور',
      fr: 'Objets Décoratifs',
      ru: 'Декоративные предметы',
      zh: '装饰物品',
      es: 'Artículos Decorativos'
    },
    image: 'image-1752387394975.jpg',
    subcategories: [
      { en: 'Wall Art' },
      { en: 'Sculptures' },
      { en: 'Vases' }
    ],
    products: [
      {
        name: 'Wooden Wall Clock',
        description: 'Modern wooden wall clock with silent movement.',
        price: 79.99,
        images: ['image-1752387425967.jpg', 'image-1752387538844.jpg'],
        quantity: 20,
        weight: 1.2,
        brand: 'ArtWood'
      },
      {
        name: 'Decorative Wooden Vase',
        description: 'Hand-carved wooden vase for dried flowers.',
        price: 59.99,
        images: ['image-1752830960352.jpg', 'image-1752831007238.jpg'],
        quantity: 15,
        weight: 1.5,
        brand: 'ArtWood'
      }
    ]
  },
  {
    name: {
      en: 'Storage Solutions',
      ar: 'حلول التخزين',
      fr: 'Solutions de Rangement',
      ru: 'Решения для хранения',
      zh: '储物解决方案',
      es: 'Soluciones de Almacenamiento'
    },
    image: 'image-1750673745238.jpg',
    subcategories: [
      { en: 'Boxes' },
      { en: 'Shelves' },
      { en: 'Organizers' }
    ],
    products: [
      {
        name: 'Wooden Storage Box Set',
        description: 'Set of 3 nesting storage boxes with lids.',
        price: 89.99,
        images: ['image-1750673812191.jpg', 'image-1750675296092.jpg'],
        quantity: 18,
        weight: 4.5,
        brand: 'StoragePro'
      },
      {
        name: 'Floating Wall Shelves',
        description: 'Set of 3 wooden floating shelves with hidden brackets.',
        price: 69.99,
        images: ['image-1750678281733.jpg', 'image-1752322440782.jpg'],
        quantity: 22,
        weight: 3.2,
        brand: 'StoragePro'
      }
    ]
  },
  {
    name: {
      en: 'Kids Furniture',
      ar: 'أثاث الأطفال',
      fr: 'Meubles pour Enfants',
      ru: 'Детская мебель',
      zh: '儿童家具',
      es: 'Muebles para Niños'
    },
    image: 'image-1752322463814.jpg',
    subcategories: [
      { en: 'Study Tables' },
      { en: 'Toy Storage' },
      { en: 'Beds' }
    ],
    products: [
      {
        name: 'Kids Study Table and Chair',
        description: 'Height-adjustable wooden study set for children.',
        price: 199.99,
        images: ['image-1752322489488.jpg', 'image-1752322516300.jpg'],
        quantity: 12,
        weight: 15,
        brand: 'KidsWood'
      },
      {
        name: 'Wooden Toy Box',
        description: 'Safety-hinged wooden toy box with name customization.',
        price: 129.99,
        images: ['image-1752322540599.jpg', 'image-1752322587748.jpg'],
        quantity: 16,
        weight: 8,
        brand: 'KidsWood'
      }
    ]
  },
  {
    name: {
      en: 'Pet Furniture',
      ar: 'أثاث الحيوانات الأليفة',
      fr: 'Meubles pour Animaux',
      ru: 'Мебель для питомцев',
      zh: '宠物家具',
      es: 'Muebles para Mascotas'
    },
    image: 'image-1752322618185.jpg',
    subcategories: [
      { en: 'Pet Beds' },
      { en: 'Cat Trees' },
      { en: 'Pet Houses' }
    ],
    products: [
      {
        name: 'Wooden Pet Bed',
        description: 'Elevated wooden pet bed with washable cushion.',
        price: 149.99,
        images: ['image-1752322638887.jpg', 'image-1752322661894.jpg'],
        quantity: 20,
        weight: 6,
        brand: 'PetComfort'
      },
      {
        name: 'Indoor Pet House',
        description: 'Stylish wooden indoor pet house with removable roof.',
        price: 189.99,
        images: ['image-1752322686032.jpg', 'image-1752323327965.jpg'],
        quantity: 15,
        weight: 12,
        brand: 'PetComfort'
      }
    ]
  }
];

const createMoreCategories = async () => {
  try {
    // Connect to database
    await connectDB();

    for (const category of categories) {
      // Create category
      const newCategory = await Category.findOneAndUpdate(
        { 'name.en': category.name.en },
        {
          name: category.name,
          image: category.image,
          subcategories: category.subcategories,
          filters: [{ name: 'Premium' }, { name: 'Standard' }]
        },
        { upsert: true, new: true }
      );

      console.log(`Created/Updated category: ${category.name.en}`);

      // Create products for this category
      for (const product of category.products) {
        const newProduct = new Product({
          category: newCategory._id,
          images: product.images,
          image: product.images[0],
          quantity: product.quantity,
          weight: product.weight,
          brand: product.brand,
          status: 'Active',
          productName: {
            en: product.name,
            ar: product.name,
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
          filters: ['Size', 'Color'],
          price: product.price,
          websitePrice: product.price,
          discount: 0,
          showOnHomepage: Math.random() < 0.3,
          homePageBottomSection: Math.random() < 0.2,
        });

        const savedProduct = await newProduct.save();
        console.log(`Created product: ${product.name}`);

        // Create SKUs for the product
        const sizes = ['Small', 'Medium', 'Large'];
        const colors = ['Natural', 'Dark Brown', 'Light Brown'];
        
        for (const size of sizes) {
          for (const color of colors) {
            await Sku.create({
              product: savedProduct._id,
              sku: `${savedProduct._id.toString().substr(-6)}-${size.charAt(0)}${color.charAt(0)}`,
              filters: {
                Size: size,
                Color: color
              },
              quantity: Math.floor(Math.random() * 20) + 5 // Random quantity between 5 and 25
            });
          }
        }
        
        console.log(`Created SKUs for product: ${product.name}`);
      }
    }

    console.log('All categories and products created successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating categories and products:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createMoreCategories();