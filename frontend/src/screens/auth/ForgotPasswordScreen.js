import React from "react";
import {
  View,
  Text,
  Button,
} from "react-native";

export default function VerifyOTPScreen({ navigation }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          marginBottom: 20,
        }}
      >
        Verify OTP
      </Text>

      <Button
        title="OTP Verified → Login"
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
}