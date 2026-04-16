export const getPasswordStrength = (password = "") => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { label: "Weak", color: "#ef4444", progress: 0.33 };
  }

  if (score <= 4) {
    return { label: "Medium", color: "#f59e0b", progress: 0.66 };
  }

  return { label: "Strong", color: "#16a34a", progress: 1 };
};
