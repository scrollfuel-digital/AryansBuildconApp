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

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      Alert.alert(
        "Required",
        "Please enter your email or employee ID and password."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await advisorLogin(cleanEmail, cleanPass);

      if (!result?.success || !result?.user) {
        Alert.alert(
          "Login Failed",
          result?.message || "Invalid credentials. Please try again."
        );
        return;
      }

      if (typeof onLogin === "function") {
        onLogin(result.user, result.token);
        return;
      }

      const isAdmin = result.user.role === "admin";
      if (isAdmin && navigation?.getState()?.routeNames?.includes("AdminDashboard")) {
        navigation.replace("AdminDashboard", { user: result.user });
      } else if (navigation?.getState()?.routeNames?.includes("Dashboard")) {
        navigation.replace("Dashboard", { user: result.user });
      } else {
        Alert.alert(
          "Login Successful",
          `Welcome, ${result.user.name}!`
        );
      }
    } catch (error) {
      console.log("Login error:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });

      // Quick offline/direct fallback for hardcoded admin credentials
      const lowerId = cleanEmail.toLowerCase();
      const isAdminEmail =
        lowerId === "admin@aryansbuildcon.com" ||
        lowerId === "admin@company.com" ||
        lowerId === "admin001" ||
        lowerId === "admin002" ||
        lowerId === "admin";
      const isAdminPass =
        cleanPass === "Admin@123" ||
        cleanPass === "admin123" ||
        cleanPass === "admin@123" ||
        cleanPass === "Admin123";

      if (isAdminEmail && isAdminPass && typeof onLogin === "function") {
        const fallbackAdmin = {
          id: "ADMIN_HARDCODED",
          employeeId: "ADMIN001",
          name: "Aryan's Buildcon Admin",
          email: "admin@aryansbuildcon.com",
          role: "admin",
          status: "active",
        };
        onLogin(fallbackAdmin, "offline_admin_token");
        return;
      }

      Alert.alert(
        "Login Failed",
        error.response?.data?.message ||
        "Unable to sign in. Please verify your email/ID and password."
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
        <Text style={styles.title}>Sign In</Text>

        <Text style={styles.subtitle}>
          Enter your credentials to access your dashboard
        </Text>

        {/* Login Card */}
        <View style={styles.loginCard}>
          {/* Email / Identifier */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email or Employee ID</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter email or employee ID"
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

          {/* Forgot Password Link */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ForgotPassword", {
                  initialEmail: email.trim(),
                })
              }
              disabled={loading}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
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

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Security Footer */}
          <View style={styles.securityFooter}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Secure login for Aryan's Buildcon personnel.
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

  badge: {
    backgroundColor: "#E8F5EF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginBottom: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#007949",
    letterSpacing: 0.5,
  },

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

  loginCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingTop: 17,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },

  fieldContainer: {
    marginBottom: 11,
  },

  label: {
    fontSize: 12.5,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 6,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 10,
    height: 44,
  },

  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    height: "100%",
  },

  passwordToggle: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  showPassword: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: 2,
    marginBottom: 8,
    paddingRight: 2,
  },

  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  loginButton: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3.5,
    elevation: 2.5,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  registerPrompt: {
    fontSize: 12.5,
    color: COLORS.secondaryText,
  },

  registerLink: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.primary,
  },

  securityFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.footerBackground,
    borderRadius: 7,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginTop: 14,
  },

  securityIcon: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: "700",
    marginRight: 5,
  },

  securityText: {
    fontSize: 10.5,
    color: COLORS.secondaryText,
    fontWeight: "500",
  },

  footer: {
    marginTop: 20,
    fontSize: 10.5,
    color: COLORS.muted,
  },
});
