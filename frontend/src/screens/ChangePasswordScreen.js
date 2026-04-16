import React, { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import { showToast } from "../components/toast";
import { changePasswordRequest } from "../services/authService";
import { useAppTheme } from "../theme";
import { getPasswordStrength } from "../utils/passwordStrength";

const ChangePasswordScreen = ({ navigation }) => {
  const { colors, radius } = useAppTheme();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.newPassword), [form.newPassword]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.currentPassword) next.currentPassword = "Current password is required";
    if (form.newPassword.length < 8) next.newPassword = "Minimum 8 characters required";
    if (form.confirmPassword && form.confirmPassword !== form.newPassword) next.confirmPassword = "Passwords do not match";
    return next;
  }, [form]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (Object.keys(errors).length) {
      showToast({ type: "error", text1: "Validation error", text2: "Please fix the highlighted password fields." });
      return;
    }

    try {
      setLoading(true);
      await changePasswordRequest(form);
      showToast({ text1: "Password changed", text2: "Your password has been updated." });
      navigation.goBack();
    } catch (error) {
      showToast({ type: "error", text1: "Change failed", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Use a stronger password to keep your hostel account secure.</Text>

        <View style={styles.form}>
          <AppInput
            label="Current Password"
            value={form.currentPassword}
            onChangeText={(value) => handleChange("currentPassword", value)}
            secureTextEntry
            error={errors.currentPassword}
          />
          <AppInput
            label="New Password"
            value={form.newPassword}
            onChangeText={(value) => handleChange("newPassword", value)}
            secureTextEntry
            error={errors.newPassword}
          />
          <View>
            <View style={[styles.strengthTrack, { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill }]}>
              <View style={[styles.strengthFill, { width: `${strength.progress * 100}%`, backgroundColor: strength.color, borderRadius: radius.pill }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label} password</Text>
          </View>
          <AppInput
            label="Confirm Password"
            value={form.confirmPassword}
            onChangeText={(value) => handleChange("confirmPassword", value)}
            secureTextEntry
            error={errors.confirmPassword}
          />
        </View>

        <AppButton title="Update Password" onPress={handleSubmit} loading={loading} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  card: { padding: 20 },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 8, marginBottom: 20 },
  form: { gap: 16, marginBottom: 20 },
  strengthTrack: { height: 8, overflow: "hidden" },
  strengthFill: { height: 8 },
  strengthLabel: { marginTop: 8, fontSize: 12, fontWeight: "700" },
});

export default ChangePasswordScreen;
