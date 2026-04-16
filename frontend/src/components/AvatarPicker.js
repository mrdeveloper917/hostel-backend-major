import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { launchImageLibrary } from "react-native-image-picker";
import { useAppTheme } from "../theme";

const AvatarPicker = ({ imageUri, onChange }) => {
  const { colors } = useAppTheme();

  const handlePick = async () => {
    const response = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.85,
      selectionLimit: 1,
    });

    const asset = response.assets?.[0];
    if (asset) {
      onChange(asset);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          imageUri
            ? { uri: imageUri }
            : { uri: "https://ui-avatars.com/api/?name=Hostel+User&background=1d4ed8&color=fff" }
        }
        style={[styles.avatar, { borderColor: colors.primarySoft }]}
      />
      <Pressable onPress={handlePick} style={[styles.editBadge, { backgroundColor: colors.primary }]}>
        <Icon name="camera-outline" size={16} color="#fff" />
      </Pressable>
      <Text style={[styles.caption, { color: colors.textMuted }]}>Tap to change photo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
  },
  editBadge: {
    position: "absolute",
    right: 4,
    bottom: 24,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default AvatarPicker;
