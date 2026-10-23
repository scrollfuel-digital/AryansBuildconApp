
import React, { useRef, useState, useEffect } from "react";

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../constants/colors.js";

// Change this path if your OTP API service is in another folder.
import {
  verifyOTP,
  resendOTP,
} from "../../services/otpService.js";
import { advisorRegister } from "../../services/advisorService.js";

export default function VerifyOTPScreen({ navigation, route }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);

  const inputRef = useRef(null);
  const OTP_LENGTH = 5;

  // Params passed from SignupScreen.
  const email = route?.params?.email || "";
  const fullName = route?.params?.fullName || "";
  const mobile = route?.params?.mobile || "";
  const employeeId = route?.params?.employeeId || "";
  const designation = route?.params?.designation || "";
  const password = route?.params?.password || "";

  // Countdown timer for the resend button.
  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = setTimeout(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const getApiError = (err, fallback) => {
    return (
      err?.response?.data?.message ||
      err?.message ||
      fallback
    );
  };

  const handleOtpChange = (value) => {
    const numbersOnly = value.replace(/[^0-9]/g, "");

    setOtp(numbersOnly.slice(0, OTP_LENGTH));

    if (error) {
      setError("");
    }
  };

  // Verify OTP and complete registration if signup data is present.
  const handleVerify = async () => {
    if (!email) {
      setError("Email address is missing. Please sign up again.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the complete OTP.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const response = await verifyOTP(email, otp);

      if (response?.success) {
        // If registration parameters were passed from SignupScreen, save the user to MongoDB
        if (password) {
          try {
            await advisorRegister({
              name: fullName || "Advisor",
              email,
              mobile,
              employeeId,
              designation,
              password,
            });

            Keyboard.dismiss();

            Alert.alert(
              "Account Created",
              "Your advisor account has been created successfully! Please sign in with your email and password.",
              [
                {
                  text: "Sign In",
                  onPress: () => navigation.navigate("Login"),
                },
              ]
            );
            return;
          } catch (regError) {
            console.log(
              "Registration after OTP error:",
              regError?.response?.data || regError.message
            );
            setError(
              regError?.response?.data?.message ||
              regError?.message ||
              "Email verified, but failed to save account. Please try again."
            );
            return;
          }
        }

        Keyboard.dismiss();
        console.log("Email verified successfully.");
        navigation.navigate("Login");
      } else {
        setError(
          response?.message || "Unable to verify the code."
        );
      }
    } catch (err) {
      console.log(
        "OTP verification error:",
        err?.response?.data || err.message
      );

      setError(
        getApiError(
          err,
          "Unable to verify the code. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP through the backend API.
  const handleResend = async () => {
    if (!email) {
      setError("Email address is missing. Please sign up again.");
      return;
    }

    if (resending || resendSeconds > 0) return;

    try {
      setResending(true);
      setError("");

      const response = await resendOTP(email, "signup", mobile);

      if (response?.success) {
        setOtp("");
        inputRef.current?.clear();
        setResendSeconds(response.resendAfter ?? 60);

        Keyboard.dismiss();
      } else {
        setError(
          response?.message || "Unable to resend the code."
        );
      }
    } catch (err) {
      console.log(
        "Resend OTP error:",
        err?.response?.data || err.message
      );

      const serverMessage = getApiError(
        err,
        "Unable to resend the code. Please try again."
      );

      setError(serverMessage);

      // If the backend enforces a cooldown, wait before retrying.
      if (err?.response?.status === 429) {
        setResendSeconds((seconds) =>
          Math.max(seconds, 60)
        );
      }
    } finally {
      setResending(false);
    }
  };

  const openKeyboard = () => {
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.brandContainer}>
              <Image
                source={require("../../../assets/authentication/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* CENTER CONTENT */}

            <View style={styles.content}>
              <View style={styles.mailCircle}>
                <Text style={styles.mailIcon}>✉</Text>
              </View>

              <Text style={styles.title}>Verify Email</Text>

              <Text style={styles.description}>
                Enter the verification code sent to
              </Text>

              <Pressable
                style={styles.emailPill}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.emailText}>
                  {email || "Email not available"}
                </Text>

                <Text style={styles.editIcon}>✎</Text>
              </Pressable>

              {/* OTP INPUT BOXES */}

              <Pressable
                onPress={openKeyboard}
                style={styles.otpContainer}
              >
                {Array.from({ length: OTP_LENGTH }).map(
                  (_, index) => {
                    const value = otp[index];
                    const isActive = index === otp.length;

                    return (
                      <View
                        key={index}
                        style={[
                          styles.otpBox,
                          isActive && styles.activeOtpBox,
                          error && styles.errorOtpBox,
                        ]}
                      >
                        <Text style={styles.otpText}>
                          {value || ""}
                        </Text>
                      </View>
                    );
                  }
                )}
              </Pressable>

              {/* NATIVE KEYBOARD INPUT */}

              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                autoCorrect={false}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                showSoftInputOnFocus
                style={styles.hiddenInput}
              />

              {/* API ERRORS */}

              {error !== "" && (
                <Text style={styles.errorText}>
                  {error}
                </Text>
              )}

              {/* RESEND OTP */}

              <View style={styles.resendRow}>
                <View style={styles.timerRow}>
                  <Text style={styles.timerIcon}>◷</Text>

                  <Text style={styles.timerText}>
                    {resendSeconds > 0
                      ? `Resend code in ${formatTime(resendSeconds)}`
                      : "You can resend the code"}
                  </Text>
                </View>

                <Pressable
                  onPress={handleResend}
                  disabled={resendSeconds > 0 || resending}
                >
                  <Text style={styles.resendText}>
                    {resending ? "Sending..." : "Resend Code"}
                  </Text>
                </Pressable>
              </View>

              {/* VERIFY BUTTON */}

              <Pressable
                onPress={handleVerify}
                disabled={otp.length !== OTP_LENGTH || loading}
                style={[
                  styles.verifyButton,
                  otp.length !== OTP_LENGTH && styles.disabledButton,
                ]}
              >
                <Text style={styles.verifyText}>
                  {loading ? "Verifying..." : "Verify & Continue →"}
                </Text>
              </Pressable>

            
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  brandContainer: {
    width: "100%",
    height: 76,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },

  logo: {
    width: 155,
    height: 70,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  backButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 34,
    color: COLORS.text,
    fontWeight: "300",
    lineHeight: 34,
  },

  logoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 18,
  },

  logoText: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.primary,
    marginRight: 4,
  },

  logoTitle: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
  },

  logoSubtitle: {
    fontSize: 5,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },

  profileButton: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },

  profileIcon: {
    color: COLORS.white,
    fontSize: 11,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  mailCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  mailIcon: {
    fontSize: 22,
    color: COLORS.primary,
  },

  title: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 5,
  },

  description: {
    fontSize: 10,
    color: COLORS.secondaryText,
    marginBottom: 7,
  },

  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGreen,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 13,
    marginBottom: 18,
  },

  emailText: {
    fontSize: 9,
    color: COLORS.text,
  },

  editIcon: {
    fontSize: 10,
    color: COLORS.primary,
    marginLeft: 7,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    width: "100%",
  },

  otpBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  activeOtpBox: {
    backgroundColor: COLORS.lightGreen,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  errorOtpBox: {
    borderColor: COLORS.danger,
  },

  otpText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    left: 0,
    top: 0,
  },

  errorText: {
    width: "100%",
    color: COLORS.danger,
    fontSize: 10,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
  },

  resendRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 3,
    marginBottom: 12,
  },

  timerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timerIcon: {
    fontSize: 11,
    color: COLORS.primary,
    marginRight: 4,
  },

  timerText: {
    fontSize: 9,
    color: COLORS.secondaryText,
  },

  resendText: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: "700",
  },

  verifyButton: {
    width: "100%",
    height: 42,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#9ABDAA",
  },

  verifyText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  testHintText: {
    marginTop: 14,
    fontSize: 11.5,
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "600",
    backgroundColor: "#E8F5EF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    overflow: "hidden",
  },
});
