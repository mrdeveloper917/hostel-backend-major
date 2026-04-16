import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useAppTheme } from "../theme";

const AppInput = ({
  label,
  error,
  secureTextEntry,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  const { colors, radius } = useAppTheme();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const canTogglePassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
          },
          style,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          secureTextEntry={canTogglePassword ? hidden : false}
          {...props}
        />
        {canTogglePassword ? (
          <Pressable onPress={() => setHidden((value) => !value)} hitSlop={10}>
            <Icon
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputContainer: {
    minHeight: 54,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default AppInput;
