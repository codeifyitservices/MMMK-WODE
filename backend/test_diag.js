const mongoose = require("mongoose");
const EditPage = require("./Models/editPage");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected successfully");

    const data = await EditPage.findOne({});
    console.log("Found EditPage document:", data ? "YES" : "NO");
    if (data) {
      console.log("home.banner:", JSON.stringify(data.home?.banner, null, 2));
    } else {
      console.log("No documents in EditPage collection. Creating a default document...");
      const newPage = new EditPage({
        home: {
          banner: {
            title: { en: "Welcome to MMMK WODE", ar: "مرحبا بكم في MMMK WODE", fr: "Bienvenue à MMMK WODE", ru: "Добро пожаловать в MMMK WODE" },
            subtitle: { en: "Elegance & Style", ar: "الأناقة والأسلوب", fr: "Élégance & Style", ru: "Элегантность и стиль" },
            buttonText: { en: "Shop Now", ar: "تسوق الآن", fr: "Acheter Maintenant", ru: "Купить Сейчас" },
            image: "default_banner.jpg",
            bubbleEnabled: false,
            bubbleText: "",
            bubbleLink: ""
          }
        }
      });
      await newPage.save();
      console.log("Default EditPage document created successfully!");
    }
  } catch (err) {
    console.error("Error in diagnostics:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
