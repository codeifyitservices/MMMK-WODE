const EditPage = require("../../../../Models/editPage");
const deleteFile = require("../../../../utils/deleteFile");
const { getUploadedFileName } = require("../../../../utils/requestUploads");

const updateBanner = async (req, res) => {
  try {
    const {
      titleEnglish,
      titleArabic,
      titleFrench,
      titleRussian,

      subTitleEnglish,
      subTitleArabic,
      subTitleFrench,
      subTitleRussian,

      buttonTextEnglish,
      buttonTextArabic,
      buttonTextFrench,
      buttonTextRussian,

      bubbleEnabled,
      bubbleText,
      bubbleLink,
    } = req.body;

    let homeBanner = await EditPage.findOne({});
    if (!homeBanner) {
      homeBanner = new EditPage({
        home: {
          banner: {}
        }
      });
    }
    const nextImage = getUploadedFileName(req, "image");

    const dataToSave = {
      title: {
        en: titleEnglish !== undefined ? titleEnglish : homeBanner.home?.banner?.title?.en,
        ar: titleArabic !== undefined ? titleArabic : homeBanner.home?.banner?.title?.ar,
        fr: titleFrench !== undefined ? titleFrench : homeBanner.home?.banner?.title?.fr,
        ru: titleRussian !== undefined ? titleRussian : homeBanner.home?.banner?.title?.ru,
      },
      subtitle: {
        en: subTitleEnglish !== undefined ? subTitleEnglish : homeBanner.home?.banner?.subtitle?.en,
        ar: subTitleArabic !== undefined ? subTitleArabic : homeBanner.home?.banner?.subtitle?.ar,
        fr: subTitleFrench !== undefined ? subTitleFrench : homeBanner.home?.banner?.subtitle?.fr,
        ru: subTitleRussian !== undefined ? subTitleRussian : homeBanner.home?.banner?.subtitle?.ru,
      },
      buttonText: {
        en: buttonTextEnglish !== undefined ? buttonTextEnglish : homeBanner.home?.banner?.buttonText?.en,
        ar: buttonTextArabic !== undefined ? buttonTextArabic : homeBanner.home?.banner?.buttonText?.ar,
        fr: buttonTextFrench !== undefined ? buttonTextFrench : homeBanner.home?.banner?.buttonText?.fr,
        ru: buttonTextRussian !== undefined ? buttonTextRussian : homeBanner.home?.banner?.buttonText?.ru,
      },
      image: nextImage || homeBanner.home?.banner?.image,
      bubbleEnabled: bubbleEnabled !== undefined ? (bubbleEnabled === "true" || bubbleEnabled === true) : homeBanner.home?.banner?.bubbleEnabled,
      bubbleText: bubbleText !== undefined ? bubbleText : homeBanner.home?.banner?.bubbleText,
      bubbleLink: bubbleLink !== undefined ? bubbleLink : homeBanner.home?.banner?.bubbleLink,
    };

    // deleting old image if new comming
    if (nextImage && nextImage !== homeBanner?.home?.banner?.image) {
      deleteFile(homeBanner?.home?.banner?.image);
    }

    homeBanner.home.banner = dataToSave;

    await homeBanner.save();

    res.status(201).json({
      success: true,
      message: "Home banner updated successfully",
      data: homeBanner,
    });
  } catch (err) {
    console.error("ERROR IN updateBanner:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const getBanner = async (req, res) => {
  try {
    const data = await EditPage.find({}).select("home.banner");
    res.status(200).json({ message: "Banner Fetched Successfully!", data });
  } catch (err) {
    console.error("ERROR IN getBanner:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = { updateBanner, getBanner };
