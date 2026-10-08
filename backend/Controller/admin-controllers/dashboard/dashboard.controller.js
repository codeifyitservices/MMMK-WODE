const dayjs = require("dayjs");
const Order = require("../../../Models/Order.js");
const Product = require("../../../Models/Product.js");
const User = require("../../../Models/User.js");
const { convertAmount, convertToCurrency } = require("../../../utils/currency");

const getOrderTotalInAED = (order) => {
  const total = Number(order?.price?.total || 0);
  const currency = order?.currency || "USD";
  if (currency === "AED") return total;

  const amountInUsd = convertAmount(total, currency, order?.currencyRate);
  return convertToCurrency(amountInUsd, "AED");
};

const RANGE_UNITS = {
  date: "day",
  week: "week",
  month: "month",
};

const getRangeUnit = (rangeType = "month") =>
  RANGE_UNITS[rangeType] || RANGE_UNITS.month;

const parseRangeInput = (rawRange) => {
  if (Array.isArray(rawRange)) return rawRange;
  if (rawRange && typeof rawRange === "object") {
    return [rawRange["0"], rawRange["1"]];
  }
  return null;
};

const getDefaultRange = (rangeType = "month") => {
  switch (rangeType) {
    case "date":
      return [
        dayjs().subtract(6, "day").startOf("day").toISOString(),
        dayjs().endOf("day").toISOString(),
      ];
    case "week":
      return [
        dayjs().subtract(6, "week").startOf("week").toISOString(),
        dayjs().endOf("week").toISOString(),
      ];
    case "month":
    default:
      return [
        dayjs().subtract(6, "month").startOf("month").toISOString(),
        dayjs().endOf("month").toISOString(),
      ];
  }
};

const normalizeDateRange = (rawRange, rangeType = "month") => {
  const parsedRange = parseRangeInput(rawRange) || getDefaultRange(rangeType);
  const unit = getRangeUnit(rangeType);
  let start = dayjs(parsedRange[0]);
  let end = dayjs(parsedRange[1]);

  if (!start.isValid() || !end.isValid()) return null;
  if (end.isBefore(start)) {
    const temp = start;
    start = end;
    end = temp;
  }

  return {
    start: start.startOf(unit),
    end: end.endOf(unit),
  };
};

const buildBuckets = (start, end, rangeType = "month") => {
  const unit = getRangeUnit(rangeType);
  const buckets = [];
  let cursor = dayjs(start).startOf(unit);
  const boundary = dayjs(end).endOf(unit);

  while (cursor.isBefore(boundary) || cursor.isSame(boundary, unit)) {
    buckets.push({
      key: cursor.toISOString(),
      date: cursor.toDate(),
      value: 0,
    });
    cursor = cursor.add(1, unit);
  }

  return buckets;
};

const getBucketStart = (value, rangeType = "month") =>
  dayjs(value).startOf(getRangeUnit(rangeType));

const aggregateSeries = (documents = [], rangeType = "month", getValue = () => 1) => {
  const groupedValues = new Map();

  documents.forEach((document) => {
    const bucketStart = getBucketStart(document.createdAt, rangeType);
    if (!bucketStart.isValid()) return;

    const key = bucketStart.toISOString();
    groupedValues.set(key, (groupedValues.get(key) || 0) + Number(getValue(document) || 0));
  });

  return groupedValues;
};

const mapBucketsWithValues = (buckets = [], groupedValues = new Map(), fieldName) =>
  buckets.map((bucket) => ({
    [fieldName]: bucket.date,
    value: groupedValues.get(bucket.key) || 0,
  }));

const getDashboardData = async (req, res) => {
  try {
    const rangeType = req.query.rangeType || "month";
    const rawRange = req.query.dateRange || req.query.monthRange;
    const normalizedRange = normalizeDateRange(rawRange, rangeType);

    if (!normalizedRange) {
      return res.status(400).json({ message: "Invalid date range provided" });
    }

    const startDate = normalizedRange.start.toDate();
    const endDate = normalizedRange.end.toDate();
    const buckets = buildBuckets(normalizedRange.start, normalizedRange.end, rangeType);
    const valueField =
      rangeType === "date" ? "day" : rangeType === "week" ? "week" : "month";

    const [totalOrders, totalUsers, totalProducts, paidOrdersAllTime] =
      await Promise.all([
        Order.countDocuments(),
        User.countDocuments(),
        Product.countDocuments(),
        Order.find({
          paymentStatus: "Paid",
          "price.total": { $exists: true, $ne: null },
        })
          .select("price.total currency currencyRate")
          .lean(),
      ]);

    const totalRevenue = paidOrdersAllTime.reduce(
      (sum, order) => sum + getOrderTotalInAED(order),
      0
    );

    const [ordersInRange, usersInRange, paidOrdersInRange, orderByStatusRaw] =
      await Promise.all([
        Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
          .select("createdAt")
          .lean(),
        User.find({ createdAt: { $gte: startDate, $lte: endDate } })
          .select("createdAt")
          .lean(),
        Order.find({
          paymentStatus: "Paid",
          createdAt: { $gte: startDate, $lte: endDate },
        })
          .select("createdAt price.total currency currencyRate")
          .lean(),
        Order.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const ordersGrouped = aggregateSeries(ordersInRange, rangeType);
    const usersGrouped = aggregateSeries(usersInRange, rangeType);
    const revenueGrouped = aggregateSeries(
      paidOrdersInRange,
      rangeType,
      (order) => getOrderTotalInAED(order)
    );

    const allStatuses = ["Pending", "Processing", "Complete", "Cancelled"];
    const orderByStatus = allStatuses.map((status) => ({
      status,
      count: orderByStatusRaw.find((item) => item._id === status)?.count || 0,
    }));

    const ordersSeries = mapBucketsWithValues(buckets, ordersGrouped, valueField);
    const usersSeries = mapBucketsWithValues(buckets, usersGrouped, valueField);
    const revenueSeries = mapBucketsWithValues(buckets, revenueGrouped, valueField);

    res.json({
      rangeType,
      startDate,
      endDate,
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue,
      newOrders: ordersInRange.length,
      newUsers: usersInRange.length,
      newRevenue: paidOrdersInRange.reduce(
        (sum, order) => sum + getOrderTotalInAED(order),
        0
      ),
      ordersByDay: rangeType === "date" ? ordersSeries : undefined,
      usersByDay: rangeType === "date" ? usersSeries : undefined,
      revenueByDay: rangeType === "date" ? revenueSeries : undefined,
      ordersByWeek: rangeType === "week" ? ordersSeries : undefined,
      usersByWeek: rangeType === "week" ? usersSeries : undefined,
      revenueByWeek: rangeType === "week" ? revenueSeries : undefined,
      ordersByMonth: rangeType === "month" ? ordersSeries : undefined,
      usersByMonth: rangeType === "month" ? usersSeries : undefined,
      revenueByMonth: rangeType === "month" ? revenueSeries : undefined,
      orderByStatus,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getDashboardData };