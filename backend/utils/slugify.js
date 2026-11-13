const sanitizeSlug = (value) => {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const generateUniqueSlug = async (
  Model,
  rawValue,
  excludeId = null,
  fallback = "item"
) => {
  const baseSlug = sanitizeSlug(rawValue) || fallback;
  let candidate = baseSlug;
  let suffix = 1;

  for (let i = 0; i < 50; i++) {
    const query = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    let exists = false;
    if (typeof Model?.exists === "function") {
      exists = Boolean(await Model.exists(query));
    } else if (typeof Model?.countDocuments === "function") {
      exists = (await Model.countDocuments(query)) > 0;
    } else if (typeof Model?.findOne === "function") {
      const res = Model.findOne(query);
      const doc = typeof res?.lean === "function" ? await res.lean() : await res;
      exists = Boolean(doc && (doc.slug === candidate || (doc._id && !doc.order)));
    }
    if (!exists) {
      return candidate;
    }
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
};

module.exports = {
  sanitizeSlug,
  generateUniqueSlug,
};
