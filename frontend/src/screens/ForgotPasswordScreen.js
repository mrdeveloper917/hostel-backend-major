import React, { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import OTPInput from "../components/OTPInput";
import { showToast } from "../components/toast";
import {
  forgotPasswordRequest,
  resetPasswordRequest,
  verifyOtpRequest,
} from "../services/authService";
import { useAppTheme } from "../theme";
import { getPasswordStrength } from "../utils/passwordStrength";

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors, radius } = useAppTheme();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  React.useEffect(() => {
    if (step !== 2 || timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((value) => value - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const strength = useMemo(() => getPasswordStrength(passwords.newPassword), [passwords.newPassword]);

  const sendOtp = async () => {
    try {
      setLoading(true);
      await forgotPasswordRequest(email.trim());
      setStep(2);
      setTimer(30);
      showToast({ text1: "OTP sent", text2: "Check your email for the 6-digit code." });
    } catch (error) {
      showToast({ type: "error", text1: "Unable to send OTP", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      await verifyOtpRequest({ email: email.trim(), otp });
      setStep(3);
      showToast({ text1: "OTP verified", text2: "You can now set a new password." });
    } catch (error) {
      showToast({ type: "error", text1: "Verification failed", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      setLoading(true);
      await resetPasswordRequest({
        email: email.trim(),
        otp,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      setStep(4);
    } catch (error) {
      showToast({ type: "error", text1: "Reset failed", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Follow the steps below to reset your hostel account password.</Text>

        <View style={styles.steps}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.stepDot, { backgroundColor: step >= item ? colors.primary : colors.surfaceAlt }]} />
          ))}
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <AppButton title="Send OTP" onPress={sendOtp} loading={loading} />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.form}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Enter OTP</Text>
            <OTPInput value={otp} onChange={setOtp} />
            <Text style={{ color: colors.textMuted, textAlign: "center" }}>
              {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive the code?"}
            </Text>
            <AppButton title="Verify OTP" onPress={verifyOtp} loading={loading} />
            <AppButton title="Resend OTP" variant="secondary" onPress={sendOtp} disabled={timer > 0} />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.form}>
            <AppInput label="New Password" value={passwords.newPassword} onChangeText={(value) => setPasswords((prev) => ({ ...prev, newPassword: value }))} secureTextEntry />
            <View>
              <View style={[styles.strengthTrack, { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill }]}>
                <View style={[styles.strengthFill, { width: `${strength.progress * 100}%`, backgroundColor: strength.color, borderRadius: radius.pill }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label} password</Text>
            </View>
            <AppInput label="Confirm Password" value={passwords.confirmPassword} onChangeText={(value) => setPasswords((prev) => ({ ...prev, confirmPassword: value }))} secureTextEntry />
            <AppButton title="Reset Password" onPress={resetPassword} loading={loading} />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.successWrap}>
            <Text style={[styles.successTitle, { color: colors.text }]}>Password Reset Complete</Text>
            <Text style={[styles.successText, { color: colors.textMuted }]}>You can now sign in with your new password.</Text>
            <AppButton title="Back to Login" onPress={() => navigation.goBack()} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  card: { padding: 20 },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 8, marginBottom: 18 },
  steps: { flexDirection: "row", gap: 8, marginBottom: 22 },
  stepDot: { flex: 1, height: 6, borderRadius: 999 },
  form: { gap: 16 },
  sectionTitle: { textAlign: "center", fontSize: 18, fontWeight: "700" },
  strengthTrack: { height: 8, overflow: "hidden" },
  strengthFill: { height: 8 },
  strengthLabel: { marginTop: 8, fontSize: 12, fontWeight: "700" },
  successWrap: { gap: 14, alignItems: "center", paddingVertical: 24 },
  successTitle: { fontSize: 22, fontWeight: "700" },
  successText: { fontSize: 14, textAlign: "center" },
});

export default ForgotPasswordScreen;
