const { translate, translateText } = require("../../services/translate");

const postTranslate = async (req, res) => {
  try {
    const { q, source = "en", target = "en" } = req.body || {};

    if (typeof q === "string") {
      const translatedText = await translateText(q, target, source);
      return res.status(200).json({ translatedText });
    }

    if (Array.isArray(q)) {
      const translatedText = await translate(q, target, source);
      return res.status(200).json({ translatedText });
    }

    return res.status(400).json({
      message: "`q` must be a string or an array of strings.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to translate content.",
    });
  }
};

module.exports = {
  postTranslate,
};
