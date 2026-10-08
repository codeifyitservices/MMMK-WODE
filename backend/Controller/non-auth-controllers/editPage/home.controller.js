const EditPage = require("../../../Models/editPage");

// Banner
const getBanner = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home.banner");
    res.status(200).json({ message: "Banner Fetched Successfully!", data });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 2
const getSection2 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Banner Fetched Successfully!",
      data: data?.home?.section2,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// section product
const getSectionProducts = async (req, res) => {
  try {
    const resData = await EditPage.findOne({})
      .select("home")
      .populate("home.sectionProducts.section3_product")
      .populate("home.sectionProducts.section7_product");

    res.status(201).json({
      success: true,
      message: "Section products updated successfully",
      data: resData.home.sectionProducts,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to update section products",
    });
  }
};

// section 8
const getSection8 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Banner Fetched Successfully!",
      data: data?.home?.section8,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 9
const getSection9 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Section9 Fetched Successfully!",
      data: data?.home?.section9,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 11
const getSection11 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Section11 Fetched Successfully!",
      data: data?.home?.section11,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 12
const getSection12 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Section12 Fetched Successfully!",
      data: data?.home?.section12,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFooter = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("footer");
    res.status(200).json({
      message: "Footer Fetched Successfully!",
      data: data?.footer,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getBanner,
  getSection2,
  getSectionProducts,
  getSection8,
  getSection9,
  getSection11,
  getSection12,
  getFooter,
};
