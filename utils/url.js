export const getPublicBaseUrl = (req) => {
  const configuredBaseUrl = String(process.env.PUBLIC_BASE_URL || "").trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "http";
  const host = req.get("host");

  return `${protocol}://${host}`.replace(/\/+$/, "");
};

export const buildPublicFileUrl = (req, relativePath = "") => {
  const normalizedPath = String(relativePath || "").replace(/^\/+/, "");
  return `${getPublicBaseUrl(req)}/${normalizedPath}`;
};
