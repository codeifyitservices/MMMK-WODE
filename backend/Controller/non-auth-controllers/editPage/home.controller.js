const EditPage = require("../../../Models/editPage");
const cache = require("../../../utils/cache");

// Banner
const getBanner = async (req, res) => {
  try {
    const cached = cache.get("home_banner");
    if (cached) return res.status(200).json(cached);

    const data = await EditPage.findOne({}).select("home.banner").lean();
    const payload = { message: "Banner Fetched Successfully!", data };
    cache.set("home_banner", payload, 600);
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 2
const getSection2 = async (req, res) => {
  try {
    const cached = cache.get("home_section2");
    if (cached) return res.status(200).json(cached);

    const data = await EditPage.findOne({}).select("home.section2").lean();
    const payload = {
      message: "Banner Fetched Successfully!",
      data: data?.home?.section2,
    };
    cache.set("home_section2", payload, 600);
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// section product
const getSectionProducts = async (req, res) => {
  try {
    const cached = cache.get("home_sectionProducts");
    if (cached) return res.status(200).json(cached);

    const resData = await EditPage.findOne({})
      .select("home.sectionProducts")
      .populate("home.sectionProducts.section3_product")
      .populate("home.sectionProducts.section7_product")
      .lean();

    const payload = {
      success: true,
      message: "Section products updated successfully",
      data: resData?.home?.sectionProducts,
    };
    cache.set("home_sectionProducts", payload, 600);
    res.status(200).json(payload);
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
    const cached = cache.get("home_section8");
    if (cached) return res.status(200).json(cached);

    const data = await EditPage.findOne({}).select("home.section8").lean();
    const payload = {
      message: "Banner Fetched Successfully!",
      data: data?.home?.section8,
    };
    cache.set("home_section8", payload, 600);
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 9
const getSection9 = async (req, res) => {
  try {
    const cached = cache.get("home_section9");
    if (cached) return res.status(200).json(cached);

    const data = await EditPage.findOne({}).select("home.section9").lean();
    const payload = {
      message: "Section9 Fetched Successfully!",
      data: data?.home?.section9,
    };
    cache.set("home_section9", payload, 600);
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 11
const getSection11 = async (req, res) => {
  try {
    const cached = cache.get("home_section11");
    if (cached) return res.status(200).json(cached);

    const data = await EditPage.findOne({}).select("home.section11").lean();
    const payload = {
      message: "Section11 Fetched Successfully!",
      data: data?.home?.section11,
    };
    cache.set("home_section11", payload, 600);
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// section 12
const getSection12 = async (req, res) => {
  try {
    const cached = cache.get("home_section12");
    if (cached) return res.status(200).json(cached);

    const data = await EditPage.findOne({}).select("home.section12").lean();
    const payload = {
      message: "Section12 Fetched Successfully!",
      data: data?.home?.section12,
    };
    cache.set("home_section12", payload, 600);
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFooter = async (req, res) => {
  try {
    const cached = cache.get("footer");
    if (cached) return res.status(200).json(cached);

    const data = await EditPage.findOne({}).select("footer").lean();
    const payload = {
      message: "Footer Fetched Successfully!",
      data: data?.footer,
    };
    cache.set("footer", payload, 600);
    res.status(200).json(payload);
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
