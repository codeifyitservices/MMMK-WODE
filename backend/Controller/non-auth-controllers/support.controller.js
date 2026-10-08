const Support = require("../../Models/Support");

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

const addController = async (req, res) => {
  try {
    const dataToSave = normalizeSupportPayload(req.body);

    if (!dataToSave.name || !dataToSave.email || !dataToSave.phoneNumber || !dataToSave.query) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone number, and query are required",
      });
    }

    const data = await Support.create(dataToSave);
    res.status(201).json({
      success: true,
      message: "Support added successfully",
      data,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to add support",
    });
  }
};

module.exports = { addController };
