const EditPage = require("../../../../Models/editPage");
const deleteFile = require("../../../../utils/deleteFile");
const { getUploadedFileName } = require("../../../../utils/requestUploads");

const updateFooter = async (req, res) => {
  try {
    const { footerLinks, footerContent, socialLinks } = req.body;

    // fetching home data
    const editPage = await EditPage.findOne({}).select("footer");
    const nextImage = getUploadedFileName(req, "image");

    const dataToSave = {
      footerLinks: JSON.parse(footerLinks).map((link) => {
        return {
          text: {
            en: link.text,
            ar: link.arabicText,
          },
          link: link.link,
        };
      }),
      footerContent: {
        en: JSON.parse(footerContent).en,
        ar: JSON.parse(footerContent).ar,
      },
      socialLinks: JSON.parse(socialLinks),
      image: nextImage || editPage?.footer?.image,
    };

    // deleting old file if new comming
    if (nextImage && nextImage !== editPage?.footer?.image) {
      deleteFile(editPage?.footer?.image);
    }

    editPage.footer = dataToSave;

    await editPage.save();

    res.status(201).json({
      success: true,
      message: "Footer updated successfully",
      data: editPage,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFooter = async (req, res) => {
  try {
    const data = await EditPage.findOne({}).select("footer");
    res.status(200).json({
      message: "Footer Fetched Successfully!",
      data: data?.footer,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateFooter, getFooter };
