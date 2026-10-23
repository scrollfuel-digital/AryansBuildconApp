import React, { useState, useEffect } from "react";
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

import { sendOTP, resendOTP, resetPassword } from "../../services/otpService";

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
};

export default function ForgotPasswordScreen({ navigation, route }) {
  const initialEmail = route?.params?.initialEmail || "";

  // Step 1: "request_otp", Step 2: "reset_password"
  const [step, setStep] = useState("request_otp");

  const [identifier, setIdentifier] = useState(initialEmail);
  const [targetEmail, setTargetEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const interval = setInterval(() => {
      setResendSeconds((sec) => Math.max(0, sec - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendSeconds]);

  // Handle Step 1: Send OTP to email / ID
  const handleSendOTP = async () => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      Alert.alert("Required", "Please enter your registered email address or employee ID.");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOTP(cleanId, "reset_password");

      if (res?.success) {
        setTargetEmail(res.email || cleanId);
        setMaskedEmail(res.maskedEmail || res.email || cleanId);
        setResendSeconds(res.resendAfter || 60);
        setStep("reset_password");
        Alert.alert(
          "Code Sent",
          res.message || "A 5-digit verification code has been sent to your email."
        );
      } else {
        Alert.alert("Request Failed", res?.message || "Unable to send verification code.");
      }
    } catch (err) {
      console.log("Forgot password send OTP error:", err);
      Alert.alert(
        "Request Failed",
        err.response?.data?.message ||
          "Could not send verification code. Please check your email/ID and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendSeconds > 0 || resending) return;

    try {
      setResending(true);
      const emailToUse = targetEmail || identifier.trim();
      const res = await resendOTP(emailToUse, "reset_password");

      if (res?.success) {
        setResendSeconds(res.resendAfter || 60);
        Alert.alert("Code Resent", "A new verification code has been sent to your email.");
      } else {
        Alert.alert("Resend Failed", res?.message || "Unable to resend code.");
      }
    } catch (err) {
      Alert.alert(
        "Resend Failed",
        err.response?.data?.message || "Failed to resend code. Please wait and try again."
      );
    } finally {
      setResending(false);
    }
  };

  // Handle Step 2: Verify OTP and Reset Password
  const handleResetPassword = async () => {
    const cleanOtp = otp.trim();
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOtp || cleanOtp.length !== 5) {
      Alert.alert("Required", "Please enter the 5-digit verification code sent to your email.");
      return;
    }

    if (!cleanPass) {
      Alert.alert("Required", "Please enter your new password.");
      return;
    }

    if (cleanPass.length < 6) {
      Alert.alert("Password Weak", "Password must be at least 6 characters long.");
      return;
    }

    if (cleanPass !== cleanConfirm) {
      Alert.alert("Mismatch", "New password and confirmation password do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await resetPassword({
        email: targetEmail || identifier.trim(),
        otp: cleanOtp,
        password: cleanPass,
      });

      if (res?.success) {
        Alert.alert(
          "Password Reset Successful",
          "Your password has been reset successfully! Please sign in with your new password.",
          [
            {
              text: "Sign In Now",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        Alert.alert("Reset Failed", res?.message || "Unable to reset password.");
      }
    } catch (err) {
      console.log("Reset password error:", err);
      Alert.alert(
        "Reset Failed",
        err.response?.data?.message ||
          "Unable to reset password. Please verify the code and try again."
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
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back to Sign In</Text>
        </TouchableOpacity>

        {/* Brand Logo */}
        <View style={styles.brandContainer}>
          <Image
            source={require("../../../assets/authentication/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔐 PASSWORD RECOVERY</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>
          {step === "request_otp" ? "Forgot Password" : "Set New Password"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "request_otp"
            ? "Enter your registered email or employee ID to receive a verification code."
            : `Enter the 5-digit code sent to ${maskedEmail || "your email"} and your new password.`}
        </Text>

        {/* Card */}
        <View style={styles.card}>
          {step === "request_otp" ? (
            /* STEP 1: Enter email / ID */
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email or Employee ID</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. name@gmail.com or ADV001"
                    placeholderTextColor={COLORS.muted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOTP}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>SEND VERIFICATION CODE</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* STEP 2: Enter OTP + New Password */
            <>
              {/* Target Email Notice with change button */}
              <View style={styles.targetEmailNotice}>
                <Text style={styles.targetEmailText}>
                  Code sent to: <Text style={styles.targetEmailBold}>{maskedEmail}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setStep("request_otp")}
                  disabled={loading}
                >
                  <Text style={styles.changeEmailText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* OTP Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>5-Digit Verification Code</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="12345"
                    placeholderTextColor={COLORS.muted}
                    value={otp}
                    onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, "").slice(0, 5))}
                    keyboardType="number-pad"
                    maxLength={5}
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>

                {/* Resend Timer */}
                <View style={styles.resendRow}>
                  {resendSeconds > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend code in {resendSeconds}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={resending || loading}
                    >
                      <Text style={styles.resendLinkText}>
                        {resending ? "Sending..." : "Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* New Password */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password (min. 6 chars)"
                    placeholderTextColor={COLORS.muted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowNewPassword((p) => !p)}
                    disabled={loading}
                  >
                    <Text style={styles.showPassword}>
                      {showNewPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor={COLORS.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword((p) => !p)}
                    disabled={loading}
                  >
                    <Text style={styles.showPassword}>
                      {showConfirmPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>RESET PASSWORD</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Footer inside card */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerPrompt}>Remember your password? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <Text style={styles.footerText}>
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
    paddingTop: 24,
    paddingBottom: 20,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  brandContainer: {
    width: "100%",
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  logo: {
    width: 145,
    height: 60,
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
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondaryText,
    textAlign: "center",
    paddingHorizontal: 15,
    marginBottom: 16,
  },

  card: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },

  fieldContainer: {
    marginBottom: 12,
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

  otpInput: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 6,
    textAlign: "center",
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

  targetEmailNotice: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.lightGreen,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },

  targetEmailText: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  targetEmailBold: {
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  changeEmailText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    textDecorationLine: "underline",
  },

  resendRow: {
    alignItems: "flex-end",
    marginTop: 5,
  },

  resendTimerText: {
    fontSize: 11.5,
    color: COLORS.muted,
  },

  resendLinkText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.primary,
  },

  primaryButton: {
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

  buttonDisabled: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  footerPrompt: {
    fontSize: 12.5,
    color: COLORS.secondaryText,
  },

  footerLink: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.primary,
  },

  footerText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 16,
  },
});