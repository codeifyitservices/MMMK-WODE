const mongoose = require("mongoose");
const dayjs = require("dayjs");
const Order = require("../../../Models/Order");
const Product = require("../../../Models/Product");
const ProductView = require("../../../Models/ProductView");
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

    // Execute concurrently at database level
    const [summaryResult, countResult, mostSoldRaw, highestRevenueRaw] = await Promise.all([
      Order.aggregate(summaryPipeline),
      Order.aggregate(countPipeline),
      Order.aggregate(mostSoldPipeline),
      Order.aggregate(highestRevenuePipeline),
    ]);

    const summary = summaryResult[0] || {
      totalUnitsSold: 0,
      totalRevenue: 0,
      totalRevenueUSD: 0,
      validOrdersCount: 0,
    };

    const totalProducts = countResult[0]?.total || 0;

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

module.exports = {
  getSalesPerformance,
  getViewPerformance,
  getAnalyticsSummary,
};
