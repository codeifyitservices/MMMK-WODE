const mongoose = require("mongoose");
const dayjs = require("dayjs");
const Order = require("../../../Models/Order");
const Product = require("../../../Models/Product");
const ProductView = require("../../../Models/ProductView");
const TrafficVisit = require("../../../Models/TrafficVisit");
const { CURRENCY_CONFIG, convertAmount, convertToCurrency } = require("../../../utils/currency");

/**
 * Standard date range normalization for analytics
 */
const parseAnalyticsDateRange = (query = {}) => {
  const { rangeType = "last30days", startDate: customStart, endDate: customEnd } = query;
  const now = dayjs();

  let start;
  let end;

  switch (rangeType) {
    case "today":
      start = now.startOf("day");
      end = now.endOf("day");
      break;
    case "last7days":
      start = now.subtract(6, "day").startOf("day");
      end = now.endOf("day");
      break;
    case "last30days":
      start = now.subtract(29, "day").startOf("day");
      end = now.endOf("day");
      break;
    case "thisMonth":
      start = now.startOf("month");
      end = now.endOf("month");
      break;
    case "lastMonth":
      start = now.subtract(1, "month").startOf("month");
      end = now.subtract(1, "month").endOf("month");
      break;
    case "custom":
      if (customStart && customEnd) {
        start = dayjs(customStart).startOf("day");
        end = dayjs(customEnd).endOf("day");
        if (!start.isValid() || !end.isValid()) {
          start = now.subtract(29, "day").startOf("day");
          end = now.endOf("day");
        } else if (end.isBefore(start)) {
          const temp = start;
          start = end;
          end = temp;
        }
      } else {
        start = now.subtract(29, "day").startOf("day");
        end = now.endOf("day");
      }
      break;
    case "all":
    case "allTime":
      return {
        rangeType: "all",
        startDate: null,
        endDate: null,
      };
    default:
      start = now.subtract(29, "day").startOf("day");
      end = now.endOf("day");
      break;
  }

  return {
    rangeType,
    startDate: start.toDate(),
    endDate: end.toDate(),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

/**
 * Build valid order match condition
 */
const buildValidOrderMatch = (startDate, endDate) => {
  const match = {
    status: { $ne: "Cancelled" },
    $or: [
      { paymentStatus: "Paid" },
      {
        mode: "cod",
        status: { $in: ["Processing", "Complete"] },
        paymentStatus: { $ne: "Failed" },
      },
    ],
  };

  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return match;
};

/**
 * Common Product Lookup & Projection Stage for Aggregations
 */
const productLookupStages = [
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "productDoc",
    },
  },
  {
    $unwind: {
      path: "$productDoc",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "categories",
      localField: "productDoc.category",
      foreignField: "_id",
      as: "categoryDoc",
    },
  },
  {
    $unwind: {
      path: "$categoryDoc",
      preserveNullAndEmptyArrays: true,
    },
  },
];

/**
 * GET /api/v1/admin/analytics/sales-performance
 * Most Sold and Highest Revenue on the same page with pagination support
 */
const getSalesPerformance = async (req, res) => {
  try {
    const { rangeType, startDate, endDate } = parseAnalyticsDateRange(req.query);
    const currentPage = Math.max(1, parseInt(req.query.currentPage || req.query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(500, parseInt(req.query.pageSize || req.query.limit, 10) || 10));
    const skip = (currentPage - 1) * pageSize;
    const orderMatch = buildValidOrderMatch(startDate, endDate);

    // 1. Pipeline for Sales Aggregation per product
    const salesGroupPipeline = [
      { $match: orderMatch },
      { $unwind: "$products" },
      {
        $match: {
          "products.id": { $exists: true, $ne: null },
        },
      },
      {
        $addFields: {
          effectiveRate: {
            $cond: {
              if: { $gt: [{ $ifNull: ["$currencyRate", 0] }, 0] },
              then: "$currencyRate",
              else: {
                $switch: {
                  branches: Object.keys(CURRENCY_CONFIG).map((code) => ({
                    case: { $eq: [{ $ifNull: ["$currency", "USD"] }, code] },
                    then: CURRENCY_CONFIG[code].rate,
                  })),
                  default: 1,
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          lineAmountUSD: {
            $multiply: [
              { $ifNull: ["$products.amount", 0] },
              "$effectiveRate",
            ],
          },
        },
      },
      {
        $addFields: {
          lineAmountAED: {
            $round: [{ $divide: ["$lineAmountUSD", 0.27] }, 2],
          },
        },
      },
      {
        $group: {
          _id: "$products.id",
          unitsSold: { $sum: { $ifNull: ["$products.quantity", 0] } },
          revenue: { $sum: "$lineAmountAED" },
          revenueUSD: { $sum: "$lineAmountUSD" },
          rawProductName: { $first: "$products.name" },
          rawSku: { $first: "$products.sku" },
        },
      },
    ];

    // 2. Summary KPI Pipeline (Total Units Sold, Total Revenue)
    const summaryPipeline = [
      { $match: orderMatch },
      { $unwind: "$products" },
      {
        $match: {
          "products.id": { $exists: true, $ne: null },
        },
      },
      {
        $addFields: {
          effectiveRate: {
            $cond: {
              if: { $gt: [{ $ifNull: ["$currencyRate", 0] }, 0] },
              then: "$currencyRate",
              else: {
                $switch: {
                  branches: Object.keys(CURRENCY_CONFIG).map((code) => ({
                    case: { $eq: [{ $ifNull: ["$currency", "USD"] }, code] },
                    then: CURRENCY_CONFIG[code].rate,
                  })),
                  default: 1,
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          lineAmountUSD: {
            $multiply: [
              { $ifNull: ["$products.amount", 0] },
              "$effectiveRate",
            ],
          },
        },
      },
      {
        $addFields: {
          lineAmountAED: {
            $round: [{ $divide: ["$lineAmountUSD", 0.27] }, 2],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalUnitsSold: { $sum: { $ifNull: ["$products.quantity", 0] } },
          totalRevenue: { $sum: "$lineAmountAED" },
          totalRevenueUSD: { $sum: "$lineAmountUSD" },
          totalOrderCount: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          totalUnitsSold: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          totalRevenueUSD: { $round: ["$totalRevenueUSD", 2] },
          validOrdersCount: { $size: "$totalOrderCount" },
        },
      },
    ];

    // 3. Count total distinct products in sales
    const countPipeline = [
      ...salesGroupPipeline,
      { $count: "total" },
    ];

    // 4. Most Sold Ranking Pipeline with pagination ($skip, $limit)
    const mostSoldPipeline = [
      ...salesGroupPipeline,
      { $sort: { unitsSold: -1, revenue: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      ...productLookupStages,
      {
        $project: {
          _id: 0,
          productId: "$_id",
          unitsSold: 1,
          revenue: { $round: ["$revenue", 2] },
          revenueUSD: { $round: ["$revenueUSD", 2] },
          productName: {
            $ifNull: ["$productDoc.productName", { en: "$rawProductName" }],
          },
          image: { $ifNull: ["$productDoc.image", null] },
          thumbnail: { $ifNull: ["$productDoc.thumbnail", null] },
          sku: { $ifNull: ["$rawSku", "N/A"] },
          price: { $ifNull: ["$productDoc.price", 0] },
          category: { $ifNull: ["$categoryDoc.name", null] },
          status: { $ifNull: ["$productDoc.status", "Active"] },
        },
      },
    ];

    // 5. Highest Revenue Ranking Pipeline with pagination ($skip, $limit)
    const highestRevenuePipeline = [
      ...salesGroupPipeline,
      { $sort: { revenue: -1, unitsSold: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      ...productLookupStages,
      {
        $project: {
          _id: 0,
          productId: "$_id",
          revenue: { $round: ["$revenue", 2] },
          revenueUSD: { $round: ["$revenueUSD", 2] },
          unitsSold: 1,
          productName: {
            $ifNull: ["$productDoc.productName", { en: "$rawProductName" }],
          },
          image: { $ifNull: ["$productDoc.image", null] },
          thumbnail: { $ifNull: ["$productDoc.thumbnail", null] },
          sku: { $ifNull: ["$rawSku", "N/A"] },
          price: { $ifNull: ["$productDoc.price", 0] },
          category: { $ifNull: ["$categoryDoc.name", null] },
          status: { $ifNull: ["$productDoc.status", "Active"] },
        },
      },
    ];

    // Pipeline to fetch overall top product if current page skip > 0
    const topProductPipeline = [
      ...salesGroupPipeline,
      { $sort: { unitsSold: -1, revenue: -1 } },
      { $limit: 1 },
      ...productLookupStages,
      {
        $project: {
          _id: 0,
          productId: "$_id",
          revenue: { $round: ["$revenue", 2] },
          unitsSold: 1,
          productName: {
            $ifNull: ["$productDoc.productName", { en: "$rawProductName" }],
          },
          image: { $ifNull: ["$productDoc.image", null] },
          thumbnail: { $ifNull: ["$productDoc.thumbnail", null] },
        },
      },
    ];

    // Execute concurrently at database level
    const queries = [
      Order.aggregate(summaryPipeline),
      Order.aggregate(countPipeline),
      Order.aggregate(mostSoldPipeline),
      Order.aggregate(highestRevenuePipeline),
    ];
    if (skip > 0) {
      queries.push(Order.aggregate(topProductPipeline));
    }

    const results = await Promise.all(queries);
    const summaryResult = results[0];
    const countResult = results[1];
    const mostSoldRaw = results[2];
    const highestRevenueRaw = results[3];
    const topItem = skip > 0 ? results[4]?.[0] : mostSoldRaw[0];

    const summary = summaryResult[0] || {
      totalUnitsSold: 0,
      totalRevenue: 0,
      totalRevenueUSD: 0,
      validOrdersCount: 0,
    };

    const totalProducts = countResult[0]?.total || 0;
    summary.totalProducts = totalProducts;
    summary.topProduct = topItem
      ? {
          productId: topItem.productId,
          productName: topItem.productName,
          unitsSold: topItem.unitsSold,
          revenue: topItem.revenue,
          image: topItem.thumbnail || topItem.image,
        }
      : null;

    // Attach ranks accounting for pagination offset
    const mostSold = mostSoldRaw.map((item, index) => ({
      rank: skip + index + 1,
      ...item,
    }));

    const highestRevenue = highestRevenueRaw.map((item, index) => ({
      rank: skip + index + 1,
      ...item,
    }));

    return res.status(200).json({
      success: true,
      data: {
        rangeType,
        startDate,
        endDate,
        currency: "AED",
        summary,
        mostSold,
        highestRevenue,
        pagination: {
          currentPage,
          pageSize,
          total: totalProducts,
          totalPages: Math.ceil(totalProducts / pageSize) || 1,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching sales performance:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales performance analytics",
      error: err.message,
    });
  }
};

/**
 * GET /api/v1/admin/analytics/view-performance
 * Most Viewed Products on a dedicated page with pagination support
 */
const getViewPerformance = async (req, res) => {
  try {
    const { rangeType, startDate, endDate } = parseAnalyticsDateRange(req.query);
    const currentPage = Math.max(1, parseInt(req.query.currentPage || req.query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(500, parseInt(req.query.pageSize || req.query.limit, 10) || 10));
    const skip = (currentPage - 1) * pageSize;

    const viewMatch = {};
    if (startDate && endDate) {
      viewMatch.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 1. Summary KPI (Total Views, Unique Products Viewed)
    const summaryPipeline = [
      { $match: viewMatch },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueProducts: { $addToSet: "$productId" },
        },
      },
      {
        $project: {
          _id: 0,
          totalViews: 1,
          uniqueProductsCount: { $size: "$uniqueProducts" },
        },
      },
    ];

    // 2. Count total distinct products viewed
    const countPipeline = [
      { $match: viewMatch },
      {
        $group: {
          _id: "$productId",
        },
      },
      { $count: "total" },
    ];

    // 3. Most Viewed Ranking Pipeline with pagination
    const mostViewedPipeline = [
      { $match: viewMatch },
      {
        $group: {
          _id: "$productId",
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      ...productLookupStages,
      {
        $project: {
          _id: 0,
          productId: "$_id",
          views: 1,
          productName: {
            $ifNull: ["$productDoc.productName", { en: "Unknown Product" }],
          },
          image: { $ifNull: ["$productDoc.image", null] },
          thumbnail: { $ifNull: ["$productDoc.thumbnail", null] },
          sku: { $ifNull: ["$productDoc.sku", "N/A"] },
          price: { $ifNull: ["$productDoc.price", 0] },
          category: { $ifNull: ["$categoryDoc.name", null] },
          status: { $ifNull: ["$productDoc.status", "Active"] },
        },
      },
    ];

    const [summaryResult, countResult, mostViewedRaw] = await Promise.all([
      ProductView.aggregate(summaryPipeline),
      ProductView.aggregate(countPipeline),
      ProductView.aggregate(mostViewedPipeline),
    ]);

    const summary = summaryResult[0] || {
      totalViews: 0,
      uniqueProductsCount: 0,
    };

    const totalProducts = countResult[0]?.total || 0;

    const mostViewed = mostViewedRaw.map((item, index) => ({
      rank: skip + index + 1,
      ...item,
    }));

    return res.status(200).json({
      success: true,
      data: {
        rangeType,
        startDate,
        endDate,
        summary,
        mostViewed,
        pagination: {
          currentPage,
          pageSize,
          total: totalProducts,
          totalPages: Math.ceil(totalProducts / pageSize) || 1,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching view performance:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch view performance analytics",
      error: err.message,
    });
  }
};

/**
 * GET /api/v1/admin/analytics/summary
 */
const getAnalyticsSummary = async (req, res) => {
  try {
    const { rangeType, startDate, endDate } = parseAnalyticsDateRange(req.query);
    const orderMatch = buildValidOrderMatch(startDate, endDate);

    const viewMatch = {};
    if (startDate && endDate) {
      viewMatch.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [salesSummary, viewSummary] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$products" },
        {
          $match: {
            "products.id": { $exists: true, $ne: null },
          },
        },
        {
          $addFields: {
            effectiveRate: {
              $cond: {
                if: { $gt: [{ $ifNull: ["$currencyRate", 0] }, 0] },
                then: "$currencyRate",
                else: 1,
              },
            },
          },
        },
        {
          $addFields: {
            lineAmountUSD: {
              $multiply: [
                { $ifNull: ["$products.amount", 0] },
                "$effectiveRate",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalUnitsSold: { $sum: { $ifNull: ["$products.quantity", 0] } },
            totalRevenueUSD: { $sum: "$lineAmountUSD" },
          },
        },
        {
          $project: {
            _id: 0,
            totalUnitsSold: 1,
            totalRevenueAED: {
              $round: [{ $divide: ["$totalRevenueUSD", 0.27] }, 2],
            },
            totalRevenueUSD: { $round: ["$totalRevenueUSD", 2] },
          },
        },
      ]),
      ProductView.aggregate([
        { $match: viewMatch },
        {
          $group: {
            _id: null,
            totalViews: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalViews: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        rangeType,
        startDate,
        endDate,
        currency: "AED",
        totalUnitsSold: salesSummary[0]?.totalUnitsSold || 0,
        totalRevenue: salesSummary[0]?.totalRevenueAED || 0,
        totalRevenueUSD: salesSummary[0]?.totalRevenueUSD || 0,
        totalViews: viewSummary[0]?.totalViews || 0,
      },
    });
  } catch (err) {
    console.error("Error fetching analytics summary:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics summary",
      error: err.message,
    });
  }
};

/**
 * GET /api/v1/admin/analytics/traffic-sources
 * Read-only aggregation of traffic channels, share, and period-over-period change
 */
const getTrafficSources = async (req, res) => {
  try {
    const { rangeType, startDate, endDate } = parseAnalyticsDateRange(req.query);

    const matchQuery = {};
    let prevMatchQuery = null;

    if (startDate && endDate) {
      matchQuery.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };

      // Calculate previous comparison period of identical duration
      const durationMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      const prevEnd = new Date(new Date(startDate).getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      prevMatchQuery = {
        timestamp: {
          $gte: prevStart,
          $lte: prevEnd,
        },
      };
    }

    const [currentChannels, prevChannels, totalVisitsCount] = await Promise.all([
      TrafficVisit.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$channel",
            visits: { $sum: 1 },
          },
        },
        { $sort: { visits: -1 } },
      ]),
      prevMatchQuery
        ? TrafficVisit.aggregate([
            { $match: prevMatchQuery },
            {
              $group: {
                _id: "$channel",
                visits: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
      TrafficVisit.countDocuments(matchQuery),
    ]);

    const prevVisitsMap = new Map(
      prevChannels.map((item) => [item._id, item.visits])
    );

    const standardChannels = ["Direct", "Search", "Social", "Referral"];
    const channelMap = new Map(
      currentChannels.map((item) => [item._id, item.visits])
    );

    // Ensure all standard channels appear in the report
    const formattedChannels = standardChannels.map((channelName) => {
      const visits = channelMap.get(channelName) || 0;
      const prevVisits = prevVisitsMap.get(channelName) || 0;
      const share =
        totalVisitsCount > 0
          ? Number(((visits / totalVisitsCount) * 100).toFixed(1))
          : 0;

      let change = 0;
      if (prevVisits > 0) {
        change = Number(
          (((visits - prevVisits) / prevVisits) * 100).toFixed(1)
        );
      } else if (visits > 0 && prevVisits === 0) {
        change = 100;
      }

      return {
        channel: channelName,
        visits,
        share,
        change,
      };
    });

    // Add any other channels if present
    currentChannels.forEach((item) => {
      if (!standardChannels.includes(item._id) && item._id) {
        const visits = item.visits;
        const prevVisits = prevVisitsMap.get(item._id) || 0;
        const share =
          totalVisitsCount > 0
            ? Number(((visits / totalVisitsCount) * 100).toFixed(1))
            : 0;
        let change = 0;
        if (prevVisits > 0) {
          change = Number(
            (((visits - prevVisits) / prevVisits) * 100).toFixed(1)
          );
        } else if (visits > 0) {
          change = 100;
        }
        formattedChannels.push({
          channel: item._id,
          visits,
          share,
          change,
        });
      }
    });

    formattedChannels.sort((a, b) => b.visits - a.visits);

    return res.status(200).json({
      success: true,
      data: {
        rangeType,
        startDate,
        endDate,
        totalVisits: totalVisitsCount,
        summary: {
          totalVisits: totalVisitsCount,
        },
        hasData: totalVisitsCount > 0,
        channels: formattedChannels,
        distribution: formattedChannels,
      },
    });
  } catch (err) {
    console.error("Error fetching traffic sources:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch traffic sources analytics",
      error: err.message,
    });
  }
};

/**
 * Public traffic channel classifier and visitor logging endpoint
 */
const classifyTrafficChannel = (referrer = "", searchParams = {}) => {
  const ref = String(referrer || "").toLowerCase();
  const utmMedium = String(searchParams.utm_medium || "").toLowerCase();
  const utmSource = String(searchParams.utm_source || "").toLowerCase();

  if (
    utmMedium.includes("cpc") ||
    utmMedium.includes("ppc") ||
    utmMedium.includes("organic") ||
    utmMedium.includes("search")
  ) {
    return { channel: "Search", source: utmSource || "search" };
  }
  if (
    utmMedium.includes("social") ||
    utmSource.includes("facebook") ||
    utmSource.includes("instagram") ||
    utmSource.includes("tiktok") ||
    utmSource.includes("twitter")
  ) {
    return { channel: "Social", source: utmSource || "social" };
  }

  if (
    !ref ||
    ref === "direct" ||
    ref.includes("localhost") ||
    ref.includes("mmmk-wode.com") ||
    ref.includes("mmmkwode.com") ||
    ref.includes("vercel.app")
  ) {
    return { channel: "Direct", source: "direct" };
  }

  const searchEngines = [
    "google.",
    "bing.",
    "yahoo.",
    "duckduckgo.",
    "ecosia.",
    "baidu.",
    "yandex.",
  ];
  if (searchEngines.some((engine) => ref.includes(engine))) {
    let sourceHost = "search";
    try {
      sourceHost = new URL(ref).hostname;
    } catch (_) {}
    return { channel: "Search", source: sourceHost };
  }

  const socialPlatforms = [
    "facebook.com",
    "instagram.com",
    "t.co",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "tiktok.com",
    "pinterest.com",
    "youtube.com",
    "reddit.com",
    "snapchat.com",
    "whatsapp.com",
    "telegram.me",
    "t.me",
  ];
  if (socialPlatforms.some((soc) => ref.includes(soc))) {
    let sourceHost = "social";
    try {
      sourceHost = new URL(ref).hostname;
    } catch (_) {}
    return { channel: "Social", source: sourceHost };
  }

  let domain = "referral";
  try {
    domain = new URL(ref).hostname;
  } catch (_) {
    domain = ref;
  }
  return { channel: "Referral", source: domain };
};

const recordTrafficVisit = async (req, res) => {
  try {
    const {
      sessionId,
      referrer,
      landingPage,
      utm_source,
      utm_medium,
      utm_campaign,
    } = req.body || {};

    if (!sessionId) {
      return res.status(200).json({ success: false, message: "No session ID" });
    }

    // Debounce duplicate visits in same session within last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingVisit = await TrafficVisit.findOne({
      sessionId,
      timestamp: { $gte: thirtyMinsAgo },
    }).select("_id");

    if (existingVisit) {
      return res.status(200).json({
        success: true,
        recorded: false,
        message: "Session already active",
      });
    }

    const { channel, source } = classifyTrafficChannel(referrer, {
      utm_medium,
      utm_source,
    });

    await TrafficVisit.create({
      sessionId,
      channel,
      source: utm_source || source || "direct",
      medium: utm_medium || "none",
      campaign: utm_campaign || "",
      referrer: referrer || "",
      landingPage: landingPage || "/",
      timestamp: new Date(),
    });

    return res.status(201).json({ success: true, recorded: true, channel });
  } catch (err) {
    // Non-blocking for client
    return res.status(200).json({ success: false, error: err.message });
  }
};

module.exports = {
  getSalesPerformance,
  getViewPerformance,
  getAnalyticsSummary,
  getTrafficSources,
  recordTrafficVisit,
};
