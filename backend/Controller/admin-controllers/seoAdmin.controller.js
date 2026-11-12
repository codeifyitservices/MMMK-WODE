const SeoSettings = require("../../Models/SeoSettings");
const {
  generateGlobalSchema,
  normalizeJsonLd,
} = require("../../utils/schemaGenerator");

/**
 * @desc    Get SEO settings (Admin)
 * @route   GET /api/v1/admin/seo-settings
 * @access  Private/Admin
 */
exports.getSeoSettings = async (req, res) => {
  try {
    let settings = await SeoSettings.findOne();
    if (!settings) {
      settings = await SeoSettings.create({});
    }

    // If no schema was saved yet, prefill with default generated schema
    if (!settings.seoSchema) {
      settings.seoSchema = generateGlobalSchema(settings);
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("[SeoAdminController] getSeoSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch SEO settings.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update SEO settings (Admin)
 * @route   PATCH /api/v1/admin/seo-settings
 * @access  Private/Admin
 */
exports.updateSeoSettings = async (req, res) => {
  try {
    const { seoSchema, socialMediaLinks, ...otherData } = req.body;

    let settings = await SeoSettings.findOne();
    if (!settings) {
      settings = new SeoSettings(otherData);
    } else {
      Object.assign(settings, otherData);
    }

    if (Array.isArray(socialMediaLinks)) {
      settings.socialMediaLinks = socialMediaLinks
        .filter((item) => item && (item.platform || item.url))
        .map((item) => ({
          platform: String(item.platform || "").trim(),
          url: String(item.url || "").trim(),
        }));
    }

    if (seoSchema !== undefined) {
      try {
        settings.seoSchema = normalizeJsonLd(seoSchema, "Global schema");
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Invalid JSON in schema.",
        });
      }
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "SEO settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("[SeoAdminController] updateSeoSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update SEO settings.",
      error: error.message,
    });
  }
};

/**
 * @desc    Generate Global Schema (Admin)
 * @route   POST /api/v1/admin/seo-settings/generate-schema
 * @access  Private/Admin
 */
exports.generateSeoSchema = async (req, res) => {
  try {
    const settings = req.body || {};
    const generatedSchema = generateGlobalSchema(settings);

    return res.status(200).json({
      success: true,
      schema: generatedSchema,
    });
  } catch (error) {
    console.error("[SeoAdminController] generateSeoSchema error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate global schema.",
      error: error.message,
    });
  }
};

