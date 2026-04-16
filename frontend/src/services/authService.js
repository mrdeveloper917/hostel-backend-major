import { api } from "./api";

export const loginRequest = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const updateProfileRequest = async (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (key === "image" && value?.uri) {
      formData.append("image", {
        uri: value.uri,
        type: value.type || "image/jpeg",
        name: value.fileName || `profile-${Date.now()}.jpg`,
      });
      return;
    }

    formData.append(key, String(value));
  });

  const { data } = await api.put("/auth/update-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};

export const changePasswordRequest = async (payload) => {
  const { data } = await api.put("/auth/change-password", payload);
  return data;
};

export const forgotPasswordRequest = async (email) => {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
};

export const verifyOtpRequest = async (payload) => {
  const { data } = await api.post("/auth/verify-otp", payload);
  return data;
};

export const resetPasswordRequest = async (payload) => {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
};
