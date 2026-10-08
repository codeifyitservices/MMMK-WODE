const EditPage = require("../../../../Models/editPage");
const deleteFile = require("../../../../utils/deleteFile");
const { getUploadedFileName } = require("../../../../utils/requestUploads");

const updateSection11 = async (req, res) => {
  try {
    const {
      subTitleArabic,
      subTitleFrench,
      subTitleRussian,
      subTitleEnglish,
      titleArabic,
      titleFrench,
      titleRussian,
      titleEnglish,
    } = req.body;

    // fetching home data
    const homeData = await EditPage.findOne({}).select("home");
    const nextImage = getUploadedFileName(req, "image");

    const dataToSave = {
      title: {
        en: titleEnglish,
        ar: titleArabic,
        fr: titleFrench,
        ru: titleRussian,
      },
      subtitle: {
        en: subTitleEnglish,
        ar: subTitleArabic,
        fr: subTitleFrench,
        ru: subTitleRussian,
      },
      image: nextImage || homeData.home?.section11?.image,
    };

    // deleting old file if new comming
    if (nextImage && nextImage !== homeData?.home?.section11?.image) {
      deleteFile(homeData?.home?.section11?.image);
    }

    homeData.home.section11 = dataToSave;

    await homeData.save();

    res.status(201).json({
      success: true,
      message: "Home section11 updated successfully",
      data: homeData,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSection11 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Section11 Fetched Successfully!",
      data: data?.home?.section11,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateSection11, getSection11 };
