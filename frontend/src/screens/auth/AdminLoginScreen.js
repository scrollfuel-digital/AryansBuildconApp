import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { adminLogin } from "../../services/adminService";

const COLORS = {
  primary: "#0B3B24", // Deep executive green for Admin
  primaryLight: "#14532D",
  accent: "#10B981",
  background: "#F0FDF4",
  white: "#FFFFFF",
  text: "#0F172A",
  secondaryText: "#475569",
  muted: "#94A3B8",
  border: "#CBD5E1",
  inputBackground: "#FFFFFF",
};

export default function AdminLoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert("Required", "Please enter administrator email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await adminLogin(cleanEmail, password);

      if (!result?.success || !result?.user) {
        Alert.alert(
          "Access Denied",
          result?.message || "Invalid administrator credentials."
        );
        return;
      }

      if (typeof onLogin === "function") {
        onLogin(result.user, result.token);
        return;
      }

      if (navigation?.getState()?.routeNames?.includes("AdminDashboard")) {
        navigation.replace("AdminDashboard", { user: result.user });
      }
    } catch (error) {
      console.log("Admin login error:", error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message ||
          "Unable to connect to the server. Please check administrator credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Logo */}
        <View style={styles.brandContainer}>
          <Image
            source={require("../../../assets/authentication/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Security Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🛡️ ADMINISTRATOR PORTAL</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Admin Console</Text>
        <Text style={styles.subtitle}>
          Sign in to access management dashboard & controls
        </Text>

        {/* Login Card */}
        <View style={styles.loginCard}>
          {/* Email / ID */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Admin Email / ID</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="admin@aryansbuildcon.com or Admin ID"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!loading}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Security Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter admin password"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleAdminLogin}
              />

              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword((p) => !p)}
                disabled={loading}
              >
                <Text style={styles.showPassword}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleAdminLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>SIGN IN AS ADMIN</Text>
            )}
          </TouchableOpacity>

          {/* Link back to Advisor Login */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              ← Back to Advisor Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityNoticeText}>
            🔒 Restricted access. All administrative sessions are logged and audited.
          </Text>
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Aryan's Buildcon Admin Suite
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  brandContainer: {
    width: "100%",
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 150,
    height: 65,
  },
  badge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#86EFAC",
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.secondaryText,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  loginCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    height: "100%",
  },
  passwordToggle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  showPassword: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryLight,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  switchButton: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  switchText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  securityNotice: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  securityNoticeText: {
    fontSize: 11,
    color: COLORS.secondaryText,
    textAlign: "center",
    lineHeight: 16,
  },
  footer: {
    marginTop: 20,
    fontSize: 11,
    color: COLORS.muted,
  },
});
