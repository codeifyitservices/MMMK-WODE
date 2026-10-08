const EditPage = require("../../../../Models/editPage");
const deleteFile = require("../../../../utils/deleteFile");
const { getUploadedFileName } = require("../../../../utils/requestUploads");

const updateSection2 = async (req, res) => {
  try {
    const { titleEnglish, titleArabic, subtitleEnglish, subtitleArabic } =
      req.body;

    const homeData = await EditPage.findOne({}).select("home");
    const nextLeftImage = getUploadedFileName(req, "leftImage");
    const nextRightImage = getUploadedFileName(req, "rightImage");

    const dataToSave = {
      title: {
        en: titleEnglish,
        ar: titleArabic,
        fr: titleFrench,
        ru: titleRussian,
      },
      subtitle: {
        en: subtitleEnglish,
        ar: subtitleArabic,
        fr: subtitleFrench,
        ru: subtitleRussian,
      },
      leftImage: nextLeftImage || homeData?.home?.section2?.leftImage,
      rightImage: nextRightImage || homeData?.home?.section2?.rightImage,
    };

    if (nextLeftImage && nextLeftImage !== homeData?.home?.section2?.leftImage) {
      deleteFile(homeData.home.section2.leftImage);
    }

    if (nextRightImage && nextRightImage !== homeData?.home?.section2?.rightImage) {
      deleteFile(homeData.home.section2.rightImage);
    }

    homeData.home.section2 = dataToSave;

    await homeData.save();

    res.status(201).json({
      success: true,
      message: "Home section2 updated successfully",
      data: homeData,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSection2 = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("home");
    res.status(200).json({
      message: "Banner Fetched Successfully!",
      data: data?.home?.section2,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateSection2, getSection2 };
