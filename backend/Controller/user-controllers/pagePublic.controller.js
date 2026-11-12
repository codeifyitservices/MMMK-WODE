const Page = require("../../Models/Page");
const SeoSettings = require("../../Models/SeoSettings");
const { generateGlobalSchema } = require("../../utils/schemaGenerator");

/**
 * @desc    Get public SEO settings for storefront head
 * @route   GET /api/v1/seo-settings
 * @access  Public
 */
exports.getPublicSeoSettings = async (req, res) => {
  try {
    let settings = await SeoSettings.findOne().lean();
    if (!settings) {
      settings = await SeoSettings.create({});
      settings = settings.toObject();
    }

    if (!settings.seoSchema) {
      settings.seoSchema = generateGlobalSchema(settings);
    }

    return res.status(200).json({
      success: true,
      settings: {
        websiteName: settings.websiteName || "MMMK WODE",
        websiteUrl: settings.websiteUrl || "https://mmmk-wode.com",
        organizationName: settings.organizationName || "MMMK WODE",
        organizationDescription: settings.organizationDescription || "",
        logo: settings.logo || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        socialMediaLinks: settings.socialMediaLinks || [],
        seoSchema: settings.seoSchema || "",
      },
    });
  } catch (error) {
    console.error("[PagePublicController] getPublicSeoSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch SEO settings.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get public published page by slug
 * @route   GET /api/v1/pages/slug/:slug
 * @access  Public
 */
exports.getPublicPageBySlug = async (req, res) => {
  try {
    const rawSlug = String(req.params.slug || "")
      .trim()
      .toLowerCase()
      .replace(/^\/+/, "");

    if (!rawSlug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required.",
      });
    }

    const page = await Page.findOne({
      slug: rawSlug,
      status: "Published",
    }).lean();

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found or is not published.",
      });
    }

    return res.status(200).json({
      success: true,
      page: {
        _id: page._id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        metaTitle: page.metaTitle || page.title,
        metaDescription: page.metaDescription || "",
        metaKeywords: page.metaKeywords || "",
        canonicalUrl: page.canonicalUrl || "",
        ogTitle: page.ogTitle || page.metaTitle || page.title,
        ogDescription: page.ogDescription || page.metaDescription || "",
        ogImage: page.ogImage || "",
        seoSchema: page.seoSchema || "",
        updatedAt: page.updatedAt,
      },
    });
  } catch (error) {
    console.error("[PagePublicController] getPublicPageBySlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get published pages grouped by footer placement
 * @route   GET /api/v1/pages/footer
 * @access  Public
 */
exports.getPublicFooterPages = async (req, res) => {
  try {
    const pages = await Page.find({
      status: "Published",
      footerPlacement: { $in: ["footer_column_1", "footer_column_2", "footer_column_3"] },
    })
      .select("title slug footerPlacement")
      .sort({ title: 1 })
      .lean();

    const grouped = {
      column1: pages.filter((p) => p.footerPlacement === "footer_column_1"),
      column2: pages.filter((p) => p.footerPlacement === "footer_column_2"),
      column3: pages.filter((p) => p.footerPlacement === "footer_column_3"),
    };

    return res.status(200).json({
      success: true,
      footerPages: grouped,
    });
  } catch (error) {
    console.error("[PagePublicController] getPublicFooterPages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch footer pages.",
      error: error.message,
    });
  }
};

