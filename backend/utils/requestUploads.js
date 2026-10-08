const DEFAULT_PUBLIC_UPLOAD_BASE_URL = "https://node.projects.codenap.in/mmk";

const parseBodyValue = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const parseJsonBodyField = (value, fallback, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    const parseError = new Error(`Invalid ${fieldName || "JSON"} payload`);
    parseError.statusCode = 400;
    parseError.fieldName = fieldName || null;
    throw parseError;
  }
};

const getPublicUploadBaseUrl = (req) => {
  const configuredBaseUrl = process.env.UPLOAD_PUBLIC_BASE_URL?.replace(
    /\/$/,
    ""
  );

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return DEFAULT_PUBLIC_UPLOAD_BASE_URL;
};

const buildUploadedFileUrl = (req, fileName) => {
  return fileName || null;
};

const getUploadedFileName = (req, fieldName) => {
  if (req.file?.filename && (!fieldName || req.file.fieldname === fieldName)) {
    return buildUploadedFileUrl(req, req.file.filename);
  }

  if (req.files?.[fieldName]?.[0]?.filename) {
    return buildUploadedFileUrl(req, req.files[fieldName][0].filename);
  }

  const bodyValue = parseBodyValue(req.body?.[fieldName], null);
  if (
    typeof bodyValue === "string" &&
    !bodyValue.includes("[object Object]")
  ) {
    return bodyValue;
  }
  return null;
};

const getUploadedFileNames = (req, fieldName) => {
  if (Array.isArray(req.files?.[fieldName]) && req.files[fieldName].length) {
    return req.files[fieldName]
      .map((file) => buildUploadedFileUrl(req, file.filename))
      .filter(Boolean);
  }

  const bodyValue = parseBodyValue(req.body?.[fieldName], []);

  if (Array.isArray(bodyValue)) {
    return bodyValue.filter(
      (value) =>
        typeof value === "string" && value && !value.includes("[object Object]")
    );
  }

  if (
    typeof bodyValue === "string" &&
    bodyValue &&
    !bodyValue.includes("[object Object]")
  ) {
    return [bodyValue];
  }

  return [];
};

module.exports = {
  parseBodyValue,
  parseJsonBodyField,
  getUploadedFileName,
  getUploadedFileNames,
};
