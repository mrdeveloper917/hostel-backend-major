import React, { useState } from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import { showToast } from "../components/toast";
import { loginRequest } from "../services/authService";
import { setAuthToken } from "../services/api";
import { useAppTheme } from "../theme";

const LoginScreen = ({ navigation, onLoggedIn }) => {
  const { colors, radius } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await loginRequest({ email, password });
      setAuthToken(response.token);
      onLoggedIn?.(response);
    } catch (error) {
      showToast({ type: "error", text1: "Login failed", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}> 
        <Image source={{ uri: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80" }} style={styles.hero} />
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Sign in to manage hostel life with one dashboard.</Text>
        <View style={styles.form}>
          <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Text style={[styles.forgot, { color: colors.primary }]} onPress={() => navigation.navigate("ForgotPassword")}>Forgot Password?</Text>
          <AppButton title="Login" onPress={handleLogin} loading={loading} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18, justifyContent: "center" },
  card: { padding: 20 },
  hero: { width: "100%", height: 180, borderRadius: 18, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 8, marginBottom: 20 },
  form: { gap: 16 },
  forgot: { textAlign: "right", fontWeight: "700" },
});

export default LoginScreen;
