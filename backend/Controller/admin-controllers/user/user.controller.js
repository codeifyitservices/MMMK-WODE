const User = require("../../../Models/User");

const addUser = async (req, res) => {
  try {
    const data = req.body;
    const savedData = await User.create(data);
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: savedData,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    

    const savedData = await User.findByIdAndUpdate(id, data, { new: true });
    res.status(201).json({
      success: true,
      message: "User updated successfully",
      data: savedData,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await User.findById(id);
    res.status(201).json({
      success: true,
      message: "User fetched successfully",
      data,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    let filters = {};
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    if (searchKey && searchValue) {
      switch (searchKey) {
        case "email":
          filters.email = { $regex: searchValue, $options: "i" };
          break;
        case "name":
          filters.firstName = { $regex: searchValue, $options: "i" };
          break;
        case "contactNumber":
          filters.contactNumber = { $regex: searchValue, $options: "i" };
          break;
        default:
          break;
      }
    }

    const data = await User.find(filters)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const total = await User.countDocuments(filters);
    res.status(201).json({
      success: true,
      message: "User's fetched successfully",
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

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    await User.findByIdAndDelete(id);
    res.status(201).json({
      success: true,
      message: "User's deleted successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  addUser,
  updateUser,
  getSingleUser,
  getAllUsers,
  deleteUser,
};
