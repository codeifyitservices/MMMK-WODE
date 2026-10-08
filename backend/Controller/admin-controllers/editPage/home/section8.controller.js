const EditPage = require("../../../../Models/editPage");
const deleteFile = require("../../../../utils/deleteFile");
const { getUploadedFileName } = require("../../../../utils/requestUploads");

const updateSection8 = async (req, res) => {
  try {
    const {
      centerTitleArabic,
      centerTitleEnglish,
      centerTitleFrench,
      centerTitleRussian,

      leftSubtitleArabic,
      leftSubtitleEnglish,
      leftSubtitleFrench,
      leftSubtitleRussian,

      leftTitleArabic,
      leftTitleEnglish,
      leftTitleFrench,
      leftTitleRussian,

      rightSubtitleArabic,
      rightSubtitleEnglish,
      rightSubtitleFrench,
      rightSubtitleRussian,

      rightTitleArabic,
      rightTitleEnglish,
      rightTitleFrench,
      rightTitleRussian,
    } = req.body;

    const homeData = await EditPage.findOne({}).select("home");
    const nextLeftImage = getUploadedFileName(req, "leftImage");
    const nextRightImage = getUploadedFileName(req, "rightImage");

    const dataToSave = {
      leftTitle: {
        en: leftTitleEnglish,
        ar: leftTitleArabic,
        fr: leftTitleFrench,
        ru: leftTitleRussian,
      },
      leftSubtitle: {
        en: leftSubtitleEnglish,
        ar: leftSubtitleArabic,
        fr: leftSubtitleFrench,
        ru: leftSubtitleRussian,
      },
      rightTitle: {
        en: rightTitleEnglish,
        ar: rightTitleArabic,
        fr: rightTitleFrench,
        ru: rightTitleRussian,
      },
      rightSubtitle: {
        en: rightSubtitleEnglish,
        ar: rightSubtitleArabic,
        fr: rightSubtitleFrench,
        ru: rightSubtitleRussian,
      },
      centerTitle: {
        en: centerTitleEnglish,
        ar: centerTitleArabic,
        fr: centerTitleFrench,
        ru: centerTitleRussian,
      },

      leftImage: nextLeftImage || homeData?.home?.section8?.leftImage,
      rightImage: nextRightImage || homeData?.home?.section8?.rightImage,
    };

    if (nextLeftImage && nextLeftImage !== homeData?.home?.section8?.leftImage) {
      deleteFile(homeData.home.section8.leftImage);
    }

    if (nextRightImage && nextRightImage !== homeData?.home?.section8?.rightImage) {
      deleteFile(homeData.home.section8.rightImage);
    }

    homeData.home.section8 = dataToSave;

    await homeData.save();

    res.status(201).json({
      success: true,
      message: "Home section8 updated successfully",
      data: homeData,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSection8 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Banner Fetched Successfully!",
      data: data?.home?.section8,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateSection8, getSection8 };
