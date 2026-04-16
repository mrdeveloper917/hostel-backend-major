import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";
import AvatarPicker from "../components/AvatarPicker";
import { showToast } from "../components/toast";
import { updateProfileRequest } from "../services/authService";
import { useAppTheme } from "../theme";

const EditProfileScreen = ({ route, navigation }) => {
  const { colors, radius } = useAppTheme();
  const { user, onProfileUpdated } = route.params;
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    hostelName: user.hostelName || "",
    roomNumber: user.roomNumber || "",
    floorNumber: user.floorNumber || "",
    branch: user.branch || "",
    course: user.course || "",
    rollNo: user.rollNo || "",
    image: null,
  });
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Valid email is required";
    if (form.phone && form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number";
    if (user.role === "student" && !form.hostelName.trim()) next.hostelName = "Hostel name is required";
    return next;
  }, [form, user.role]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (Object.keys(errors).length) {
      showToast({ type: "error", text1: "Fix form errors", text2: "Please review the highlighted fields." });
      return;
    }

    try {
      setSaving(true);
      const response = await updateProfileRequest(form);
      onProfileUpdated?.(response.user);
      showToast({ text1: "Profile updated", text2: "Your details were saved successfully." });
      navigation.goBack();
    } catch (error) {
      showToast({ type: "error", text1: "Update failed", text2: error.message });
    } finally {
      setSaving(false);
    }
  };

  const imageUri = form.image?.uri || user.profileImage;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg, shadowColor: colors.shadow }]}> 
            <AvatarPicker imageUri={imageUri} onChange={(asset) => handleChange("image", asset)} />
            <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Update your contact details and hostel information.</Text>

            <View style={styles.form}>
              <AppInput label="Name" value={form.name} onChangeText={(value) => handleChange("name", value)} error={errors.name} />
              <AppInput label="Email" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => handleChange("email", value)} error={errors.email} />
              <AppInput label="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={(value) => handleChange("phone", value)} error={errors.phone} />
              {user.role === "student" ? (
                <>
                  <AppInput label="Hostel Name" value={form.hostelName} onChangeText={(value) => handleChange("hostelName", value)} error={errors.hostelName} />
                  <AppInput label="Room Number" value={form.roomNumber} onChangeText={(value) => handleChange("roomNumber", value)} />
                  <AppInput label="Floor Number" value={form.floorNumber} onChangeText={(value) => handleChange("floorNumber", value)} />
                  <AppInput label="Branch" value={form.branch} onChangeText={(value) => handleChange("branch", value)} />
                  <AppInput label="Course" value={form.course} onChangeText={(value) => handleChange("course", value)} />
                  <AppInput label="Roll Number" value={form.rollNo} onChangeText={(value) => handleChange("rollNo", value)} />
                </>
              ) : null}
            </View>

            <AppButton title="Save Changes" onPress={handleSave} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18 },
  card: {
    padding: 20,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 6,
  },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 20 },
  form: { gap: 14, marginBottom: 20 },
});

export default EditProfileScreen;
