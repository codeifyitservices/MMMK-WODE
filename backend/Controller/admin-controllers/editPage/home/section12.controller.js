const EditPage = require("../../../../Models/editPage");
const deleteFile = require("../../../../utils/deleteFile");

const updateSection12 = async (req, res) => {
  try {
    const { deletedFiles } = req.body;
    const homeData = await EditPage.findOne({}).select("home");

    if (!homeData) {
      return res.status(404).json({
        success: false,
        message: "Home data not found",
      });
    }

    // Handle uploaded files
    const filesToAdd = req.files?.map((file) => file.filename) || [];

    // Ensure the videos array exists
    if (!homeData.home?.section12?.videos) {
      homeData.home.section12 = homeData.home.section12 || {};
      homeData.home.section12.videos = [];
    }

    // Append new files to the videos array
    homeData.home.section12.videos = [
      ...homeData.home.section12.videos,
      ...filesToAdd,
    ];

    // Delete deleted files
    JSON.parse(deletedFiles)?.forEach((filename) => {
      deleteFile(filename);
    });

    homeData.home.section12.videos = homeData.home.section12.videos.filter(
      (video) => !JSON.parse(deletedFiles).includes(video)
    );

    // Save the updated document
    await homeData.save();

    res.status(201).json({
      success: true,
      message: "Home section12 updated successfully",
      videos: homeData.home.section12.videos,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const getSection12 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Section12 Fetched Successfully!",
      data: data?.home?.section12,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateSection12, getSection12 };
