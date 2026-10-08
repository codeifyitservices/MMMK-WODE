const { LANGUAGECODES } = require("./staticData");

const normalizeLanguage = (lang) => {
  if (typeof lang !== "string") {
    return "en";
  }

  const normalized = lang.toLowerCase().split(",")[0].split("-")[0].trim();
  return LANGUAGECODES.includes(normalized) ? normalized : "en";
};

const localizeValue = (value, lang = "en") => {
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const normalizedLang = normalizeLanguage(lang);

  return (
    value[normalizedLang] ||
    value.en ||
    Object.values(value).find(
      (entry) => typeof entry === "string" && entry.trim().length > 0
    ) ||
    ""
  );
};

module.exports = {
  normalizeLanguage,
  localizeValue,
};
