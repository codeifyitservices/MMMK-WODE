const Support = require("../../../Models/Support");

const normalizeSupportPayload = (body = {}) => {
  const phoneCountryCode = String(body.phoneCountryCode || "").trim();
  const phoneNumber = String(body.phoneNumber || body.phone || "").trim();
  const phone = [phoneCountryCode, phoneNumber].filter(Boolean).join(" ").trim();
  const query = String(body.query || body.description || "").trim();

  return {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phoneCountryCode,
    phoneNumber,
    phone,
    subject: String(body.subject || "Contact Us").trim(),
    description: query,
    query,
    locale: String(body.locale || "en").trim().toLowerCase(),
    source: String(body.source || "contact-us").trim(),
  };
};

const createSupport = async (req, res) => {
  try {
    const data = normalizeSupportPayload(req.body);
    const savedData = await Support.create(data);
    res.status(201).json({
      success: true,
      message: "Support created successfully",
      data: savedData,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllSupports = async (req, res) => {
  try {
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    const matchStage = {};

    if (searchKey && searchValue) {
      switch (searchKey) {
        case "name":
          matchStage.name = { $regex: searchValue, $options: "i" };
          break;
        case "email":
          matchStage.email = { $regex: searchValue, $options: "i" };
          break;
        case "phone":
          matchStage.phone = { $regex: searchValue, $options: "i" };
          break;
        case "query":
          matchStage.query = { $regex: searchValue, $options: "i" };
          break;
        case "subject":
          matchStage.subject = { $regex: searchValue, $options: "i" };
          break;
        case "source":
          matchStage.source = { $regex: searchValue, $options: "i" };
          break;
        case "locale":
          matchStage.locale = { $regex: searchValue, $options: "i" };
          break;
      }
    }
    const data = await Support.find(matchStage)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const total = await Support.countDocuments(matchStage);

    res.status(201).json({
      success: true,
      message: "Support fetched successfully",
      data,
      total,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deleteSupport = async (req, res) => {
  try {
    const id = req.params.id;
    await Support.findByIdAndDelete(id);
    res.status(201).json({
      success: true,
      message: "Support deleted successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const addReplyToSupport = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const updatedData = await Support.findByIdAndUpdate(id, data, {
      new: true,
    });
    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      updatedData,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createSupport,
  addReplyToSupport,
  deleteSupport,
  getAllSupports,
};
