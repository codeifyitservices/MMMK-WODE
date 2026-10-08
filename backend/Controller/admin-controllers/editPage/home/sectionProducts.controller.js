const EditPage = require("../../../../Models/editPage");

const updateSectionProducts = async (req, res) => {
  try {
    const data = req.body;
    const resData = await EditPage.findOne({}).select("home");
    resData.home.sectionProducts = data;
    await resData.save();
    res.status(201).json({
      success: true,
      message: "Section products updated successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to update section products",
    });
  }
};

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

module.exports = { updateSectionProducts, getSectionProducts };
