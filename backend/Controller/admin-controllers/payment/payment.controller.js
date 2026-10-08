const Payment = require("../../../Models/payment");

const createPayment = async (req, res) => {
  try {
    const data = req.body;
    const savedData = await Payment.create(data);
    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: savedData,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllPayments = async (req, res) => {
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
        case "paymentId":
          matchStage.paymentId = { $regex: searchValue, $options: "i" };
          break;
        case "payerName":
          matchStage.fullName = { $regex: searchValue, $options: "i" };
          break;
        case "payerEmail":
          matchStage["user.email"] = { $regex: searchValue, $options: "i" };
          break;
        case "payType":
          matchStage.payType = { $regex: searchValue, $options: "i" };
          break;
      }
    }

    const data = await Payment.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          fullName: {
            $concat: [
              { $ifNull: ["$user.firstName", ""] },
              " ",
              { $ifNull: ["$user.lastName", ""] },
            ],
          },
        },
      },
      {
        $match: matchStage,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          data: [
            { $skip: (parseInt(currentPage) - 1) * parseInt(pageSize) },
            { $limit: parseInt(pageSize) },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);
    
    const total = data[0]?.totalCount[0]?.count || 0;
    const finalData = data[0]?.data || [];
    res.status(201).json({
      success: true,
      message: "Payment fetched successfully",
      data: finalData,
      total,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deletePayment = async (req, res) => {
  try {
    const id = req.params.id;
    await Payment.findByIdAndDelete(id);
    res.status(201).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = { createPayment, getAllPayments, deletePayment };
