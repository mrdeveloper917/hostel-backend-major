import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme";

const AppButton = ({ title, onPress, loading, variant = "primary", disabled }) => {
  const { colors, radius } = useAppTheme();
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: isSecondary ? colors.surfaceAlt : colors.primary,
          borderRadius: radius.md,
          opacity: disabled || loading ? 0.7 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.text : "#fff"} />
      ) : (
        <Text style={[styles.label, { color: isSecondary ? colors.text : "#fff" }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AppButton;
