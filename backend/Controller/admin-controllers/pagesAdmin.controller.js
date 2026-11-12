const Page = require("../../Models/Page");
const SeoSettings = require("../../Models/SeoSettings");
const {
  generatePageSchema,
  normalizeJsonLd,
} = require("../../utils/schemaGenerator");

const slugify = (text = "") =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * @desc    Get all pages (Admin)
 * @route   GET /api/v1/admin/pages
 * @access  Private/Admin
 */
exports.getAllPages = async (req, res) => {
  try {
    const { search, status, footerPlacement } = req.query;
    const filter = {};

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
      filter.$or = [{ title: regex }, { slug: regex }];
    }

    if (status && ["Published", "Draft"].includes(status)) {
      filter.status = status;
    }

    if (footerPlacement && typeof footerPlacement === "string") {
      filter.footerPlacement = footerPlacement;
    }

    const pages = await Page.find(filter).sort({ updatedAt: -1 });
    const total = await Page.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      pages,
    });
  } catch (error) {
    console.error("[PagesAdminController] getAllPages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pages.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single page by ID (Admin)
 * @route   GET /api/v1/admin/pages/:id
 * @access  Private/Admin
 */
exports.getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await Page.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found.",
      });
    }

    return res.status(200).json({
      success: true,
      page,
    });
  } catch (error) {
    console.error("[PagesAdminController] getPageById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page.",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new page (Admin)
 * @route   POST /api/v1/admin/pages
 * @access  Private/Admin
 */
exports.createPage = async (req, res) => {
  try {
    const {
      title,
      slug: rawSlug,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      seoSchema,
      status,
      footerPlacement,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Page title is required.",
      });
    }

    const cleanSlug = slugify(rawSlug || title);
    if (!cleanSlug) {
      return res.status(400).json({
        success: false,
        message: "A valid URL slug is required.",
      });
    }

    // Check slug collision
    const existing = await Page.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A page with slug "${cleanSlug}" already exists. Please choose a unique slug.`,
      });
    }

    let finalSchema = "";
    if (seoSchema !== undefined && String(seoSchema).trim()) {
      try {
        finalSchema = normalizeJsonLd(seoSchema, "Page schema");
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Invalid JSON in page schema.",
        });
      }
    } else {
      // Auto-generate initial schema
      const seoSettings = await SeoSettings.findOne();
      finalSchema = generatePageSchema(
        { title, slug: cleanSlug, metaTitle, metaDescription, content, canonicalUrl },
        seoSettings || {}
      );
    }

    const newPage = new Page({
      title: String(title).trim(),
      slug: cleanSlug,
      content: content || "",
      metaTitle: metaTitle ? String(metaTitle).trim() : String(title).trim(),
      metaDescription: metaDescription ? String(metaDescription).trim() : "",
      metaKeywords: metaKeywords ? String(metaKeywords).trim() : "",
      canonicalUrl: canonicalUrl ? String(canonicalUrl).trim() : "",
      ogTitle: ogTitle ? String(ogTitle).trim() : metaTitle || title,
      ogDescription: ogDescription ? String(ogDescription).trim() : metaDescription || "",
      ogImage: ogImage ? String(ogImage).trim() : "",
      seoSchema: finalSchema,
      status: status === "Published" ? "Published" : "Draft",
      footerPlacement: [
        "footer_column_1",
        "footer_column_2",
        "footer_column_3",
      ].includes(footerPlacement)
        ? footerPlacement
        : "none",
      updatedBy: req.admin?._id,
    });

    await newPage.save();

    return res.status(201).json({
      success: true,
      message: "Page created successfully.",
      page: newPage,
    });
  } catch (error) {
    console.error("[PagesAdminController] createPage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create page.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing page (Admin)
 * @route   PATCH /api/v1/admin/pages/:id
 * @access  Private/Admin
 */
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await Page.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found.",
      });
    }

    const {
      title,
      slug: rawSlug,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      seoSchema,
      status,
      footerPlacement,
    } = req.body;

    if (title !== undefined) page.title = String(title).trim();

    if (rawSlug !== undefined) {
      const cleanSlug = slugify(rawSlug);
      if (!cleanSlug) {
        return res.status(400).json({
          success: false,
          message: "URL slug cannot be empty.",
        });
      }
      if (cleanSlug !== page.slug) {
        const collision = await Page.findOne({ slug: cleanSlug, _id: { $ne: page._id } });
        if (collision) {
          return res.status(400).json({
            success: false,
            message: `A page with slug "${cleanSlug}" already exists.`,
          });
        }
        page.slug = cleanSlug;
      }
    }

    if (content !== undefined) page.content = content;
    if (metaTitle !== undefined) page.metaTitle = String(metaTitle).trim();
    if (metaDescription !== undefined) page.metaDescription = String(metaDescription).trim();
    if (metaKeywords !== undefined) page.metaKeywords = String(metaKeywords).trim();
    if (canonicalUrl !== undefined) page.canonicalUrl = String(canonicalUrl).trim();
    if (ogTitle !== undefined) page.ogTitle = String(ogTitle).trim();
    if (ogDescription !== undefined) page.ogDescription = String(ogDescription).trim();
    if (ogImage !== undefined) page.ogImage = String(ogImage).trim();

    if (status !== undefined && ["Published", "Draft"].includes(status)) {
      page.status = status;
    }

    if (
      footerPlacement !== undefined &&
      ["none", "footer_column_1", "footer_column_2", "footer_column_3"].includes(footerPlacement)
    ) {
      page.footerPlacement = footerPlacement;
    }

    if (seoSchema !== undefined) {
      try {
        page.seoSchema = normalizeJsonLd(seoSchema, "Page schema");
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Invalid JSON in page schema.",
        });
      }
    }

    page.updatedBy = req.admin?._id;
    await page.save();

    return res.status(200).json({
      success: true,
      message: "Page updated successfully.",
      page,
    });
  } catch (error) {
    console.error("[PagesAdminController] updatePage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update page.",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete page (Admin)
 * @route   DELETE /api/v1/admin/pages/:id
 * @access  Private/Admin
 */
exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await Page.findByIdAndDelete(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Page deleted successfully.",
    });
  } catch (error) {
    console.error("[PagesAdminController] deletePage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete page.",
      error: error.message,
    });
  }
};

/**
 * @desc    Generate Page Schema (Admin)
 * @route   POST /api/v1/admin/pages/generate-schema
 * @access  Private/Admin
 */
exports.generatePageSchema = async (req, res) => {
  try {
    const pageData = req.body || {};
    const settings = await SeoSettings.findOne();
    const schema = generatePageSchema(pageData, settings || {});

    return res.status(200).json({
      success: true,
      schema,
    });
  } catch (error) {
    console.error("[PagesAdminController] generatePageSchema error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate page schema.",
      error: error.message,
    });
  }
};

