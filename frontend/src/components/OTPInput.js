import React, { useRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAppTheme } from "../theme";

const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);
  const { colors, radius } = useAppTheme();
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");

  const updateDigit = (digit, index) => {
    const next = value.split("");
    next[index] = digit.replace(/[^0-9]/g, "").slice(-1);
    const joined = next.join("").slice(0, 6);
    onChange(joined);

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <Pressable key={index} onPress={() => inputs.current[index]?.focus()}>
          <TextInput
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            value={digit}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => updateDigit(text, index)}
            style={[
              styles.box,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radius.md,
              },
            ]}
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  box: {
    width: 48,
    height: 58,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
});

export default OTPInput;
