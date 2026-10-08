const EditPage = require("../../../../Models/editPage");
const deleteFile = require("../../../../utils/deleteFile");
const { getUploadedFileName } = require("../../../../utils/requestUploads");

const updateSection9 = async (req, res) => {
  try {
    const {
      subTitleArabic,
      subTitleEnglish,
      subTitleFrench,
      subTitleRussian,
      titleArabic,
      titleEnglish,
      titleFrench,
      titleRussian,
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
      image: nextImage || homeData.home?.section9?.image,
    };

    // deleting old file if new comming
    if (nextImage && nextImage !== homeData?.home?.section9?.image) {
      deleteFile(homeData?.home?.section9?.image);
    }

    homeData.home.section9 = dataToSave;

    await homeData.save();

    res.status(201).json({
      success: true,
      message: "Home section9 updated successfully",
      data: homeData,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSection9 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Section9 Fetched Successfully!",
      data: data?.home?.section9,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateSection9, getSection9 };
