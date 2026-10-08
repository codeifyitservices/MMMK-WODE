const axios = require("axios");

const LIBRE_TRANSLATE_ENDPOINT = process.env.LIBRE_TRANSLATE_ENDPOINT;
const AZURE_TRANSLATOR_ENDPOINT =
  process.env.AZURE_TRANSLATOR_ENDPOINT || process.env.AZURE_ENDPOINT;
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;

function getProvider() {
  if (
    AZURE_TRANSLATOR_ENDPOINT &&
    AZURE_TRANSLATOR_KEY &&
    AZURE_TRANSLATOR_REGION
  ) {
    return "azure";
  }

  if (LIBRE_TRANSLATE_ENDPOINT) {
    return "libre";
  }

  return null;
}

async function translateWithAzure(textArray, toLang, fromLang) {
  const endpoint = AZURE_TRANSLATOR_ENDPOINT.replace(/\/$/, "");
  const url = `${endpoint}/translate`;

  const response = await axios.post(
    url,
    textArray.map(text => ({ Text: text })),
    {
      params: {
        "api-version": "3.0",
        from: fromLang,
        to: toLang,
      },
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.map(item => item?.translations?.[0]?.text ?? "");
}

async function translateWithLibre(textArray, toLang, fromLang) {
  const url = `${LIBRE_TRANSLATE_ENDPOINT.replace(/\/$/, "")}/translate`;

  const promises = textArray.map(text =>
    axios.post(
      url,
      {
        q: text,
        source: fromLang,
        target: toLang,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  );

  const responses = await Promise.all(promises);

  return responses.map(response => response.data.translatedText);
}

async function translate(textArray, toLang = "en", fromLang = "en") {
  if (!Array.isArray(textArray)) return [];
  if (toLang === fromLang) return textArray;
  if (!textArray.length) return [];

  const provider = getProvider();

  if (provider === "azure") {
    return translateWithAzure(textArray, toLang, fromLang);
  }

  if (provider === "libre") {
    return translateWithLibre(textArray, toLang, fromLang);
  }

  throw new Error(
    "Translation provider is not configured. Set Azure translator env vars or LIBRE_TRANSLATE_ENDPOINT."
  );
}

async function translateText(text, toLang = "en", fromLang = "en") {
  if (!text || typeof text !== "string") return text;
  if (toLang === fromLang) return text;

  const [translatedText] = await translate([text], toLang, fromLang);
  return translatedText;
}

module.exports = {
  translateText,
  translate,
};
