
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

import { advisorLogin } from "../../services/advisorService";
import { adminLogin } from "../../services/adminService";

const COLORS = {
  primary: "#007949",
  primaryDark: "#005C38",
  background: "#F3FAF6",
  white: "#FFFFFF",
  text: "#17211D",
  secondaryText: "#66736D",
  muted: "#8A9690",
  border: "#DCE5E0",
  inputBackground: "#FFFFFF",
  lightGreen: "#E8F5EF",
  footerBackground: "#EDF7F1",
};

export default function AdvisorLoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("advisor");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert(
        "Required",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        role === "admin"
          ? await adminLogin(cleanEmail, password)
          : await advisorLogin(cleanEmail, password);

      if (!result?.success || !result?.user) {
        Alert.alert(
          "Login Failed",
          result?.message || "Unable to sign in. Please try again."
        );
        return;
      }

      // Prefer parent-controlled authentication navigation.
      if (typeof onLogin === "function") {
        onLogin(result.user, result.token);
        return;
      }
 if (navigation?.getState()?.routeNames?.includes("Dashboard")) {
        navigation.replace("Dashboard", {
          user: result.user,
        });
      } else {
        Alert.alert(
          "Login Successful",
          `Welcome, ${result.user.name}! Your account is authenticated, but the advisor dashboard has not been connected to this navigator yet.`
        );
      }
    } catch (error) {
      console.log("Advisor login failed:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        baseURL: error.config?.baseURL,
        requestURL: error.config?.url,
      });

      Alert.alert(
        "Login Failed",
        error.response?.data?.message ||
        "Unable to connect to the server. Please try again."
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

        {/* Login Heading */}
        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          {role === "admin"
            ? "Sign in to the Admin Console"
            : "Sign in to your advisor account"}
        </Text>

        {/* Role Toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#E2ECE6",
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
            width: "100%",
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9,
              alignItems: "center",
              backgroundColor:
                role === "advisor" ? COLORS.primary : "transparent",
            }}
            onPress={() => setRole("advisor")}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color:
                  role === "advisor" ? COLORS.white : COLORS.secondaryText,
              }}
            >
              Field Advisor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9,
              alignItems: "center",
              backgroundColor:
                role === "admin" ? COLORS.primaryDark : "transparent",
            }}
            onPress={() => setRole("admin")}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: role === "admin" ? COLORS.white : COLORS.secondaryText,
              }}
            >
              Administrator
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Card */}
        <View style={styles.loginCard}>
          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email Address</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword((previous) => !previous)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Text style={styles.showPassword}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>
                SIGN IN
              </Text>
            )}
          </TouchableOpacity>

          {/* Security Footer */}
          <View style={styles.securityFooter}>
            <Text style={styles.securityIcon}>✓</Text>
            <Text style={styles.securityText}>
              Secure access for authorized advisors only.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} Aryan's Buildcon
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
    paddingTop: 18,
    paddingBottom: 18,
  },

  // Logo
  brandContainer: {
    width: "100%",
    height: 76,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  logo: {
    width: 155,
    height: 70,
  },

  // Heading
  title: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 2,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondaryText,
    textAlign: "center",
    marginBottom: 18,
  },

  // Login Card
  loginCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingTop: 17,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#E7EEEA",
    shadowColor: "#173B2D",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Form Fields
  fieldContainer: {
    width: "100%",
    marginBottom: 14,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 7,
  },

  inputWrapper: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: "#E5EBE7",
    borderRadius: 9,
    paddingHorizontal: 11,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 0,
  },

  passwordToggle: {
    minWidth: 38,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },

  showPassword: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Button
  loginButton: {
    width: "100%",
    height: 48,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 3,
  },

  loginButtonDisabled: {
    backgroundColor: COLORS.primaryDark,
    opacity: 0.75,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Security Notice
  securityFooter: {
    width: "100%",
    minHeight: 37,
    backgroundColor: COLORS.footerBackground,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginTop: 12,
  },

  securityIcon: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    marginRight: 6,
  },

  securityText: {
    flexShrink: 1,
    fontSize: 9,
    lineHeight: 13,
    color: COLORS.secondaryText,
    textAlign: "center",
  },

  // Footer
  footer: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 22,
  },
});
