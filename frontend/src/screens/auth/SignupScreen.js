
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";
import { styles } from "../../styles/signup.styles";
import { createAdvisor } from "../../services/advisorService";
import { sendOTP } from "../../services/otpService.js";


export default function SignupScreen({ navigation }) {
  /* =========================
     FORM STATES
  ========================= */

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* =========================
     UI STATES
  ========================= */

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [accepted, setAccepted] = useState(false);

  /* =========================
     PASSWORD RULES
  ========================= */

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordScore =
    Object.values(passwordRules).filter(Boolean).length;

  /* =========================
     PASSWORD STRENGTH
  ========================= */

  const getPasswordStrength = () => {
    if (password.length === 0) {
      return {
        label: "",
        color: COLORS.border,
      };
    }

    if (passwordScore <= 1) {
      return {
        label: "Weak",
        color: COLORS.danger,
      };
    }

    if (passwordScore <= 3) {
      return {
        label: "Medium",
        color: COLORS.warning,
      };
    }

    return {
      label: "Strong",
      color: COLORS.primary,
    };
  };

  const passwordStrength = getPasswordStrength();

  /* =========================
     PASSWORD INPUT STYLE
  ========================= */

  const passwordInputStyle = [
    styles.inputWrapper,
    password.length > 0 && {
      borderWidth: 1.5,
      borderColor: passwordStrength.color,
      backgroundColor:
        passwordScore === 4
          ? COLORS.lightGreen
          : COLORS.white,
    },
  ];



  const handleCreateAccount = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !mobile ||
      !password
    ) {
      Alert.alert(
        "Required Fields",
        "Please fill all required fields."
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid 10 digit mobile number."
      );
      return;
    }

    if (passwordScore < 4) {
      Alert.alert(
        "Weak Password",
        "Please create a strong password."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Password and confirm password do not match."
      );
      return;
    }

    if (!accepted) {
      Alert.alert(
        "Terms Required",
        "Please accept the terms and conditions."
      );
      return;
    }

    try {
      const response = await sendOTP(normalizedEmail, "signup");

      if (response?.success) {
        navigation.navigate("VerifyOTP", {
          email: normalizedEmail,
          fullName: fullName.trim(),
          mobile: mobile.trim(),
          employeeId: employeeId.trim(),
          designation: designation.trim(),
          password,
        });
      } else {
        Alert.alert(
          "Verification Code Failed",
          response?.message || "Unable to send verification code."
        );
      }
    } catch (error) {
      console.error(
        "Send OTP Error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Registration Error",
        error.response?.data?.message ||
        "Unable to send verification code. Please check your network and try again."
      );
    }
  };



  /* =========================
     UI
  ========================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================= HERO ================= */}

          <View style={styles.hero}>
            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.subtitle}>
              Register with your work email to access field
              {"\n"}
              verification & reporting tools.
            </Text>
          </View>

          {/* ================= FORM CARD ================= */}

          <View style={styles.formCard}>
            {/* ================= FULL NAME ================= */}

            <View style={styles.fieldHeader}>
              <Text style={styles.label}>Full Name</Text>

              {fullName.length > 2 && (
                <Text style={styles.verifiedText}>
                  ✓ Verified
                </Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Rahul Sharma"
                placeholderTextColor={COLORS.muted}
              />

              {fullName.length > 2 && (
                <Text style={styles.successIcon}>✓</Text>
              )}
            </View>

            {/* ================= WORK EMAIL ================= */}

            <Text style={styles.label}>Work Email</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="rahul.sharma@aryansbuildcon.com"
                placeholderTextColor={COLORS.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {email.length > 0 && (
                <Text style={styles.successIcon}>✓</Text>
              )}
            </View>

            {/* ================= MOBILE ================= */}

            <Text style={styles.label}>Mobile Number</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇮🇳</Text>

                <Text style={styles.countryText}>+91</Text>
              </View>

              <TextInput
                style={styles.mobileInput}
                value={mobile}
                onChangeText={(value) =>
                  setMobile(
                    value.replace(/[^0-9]/g, "").slice(0, 10)
                  )
                }
                placeholder="98765 43210"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* ================= EMPLOYEE ID ================= */}

            <View style={styles.fieldHeader}>
              <Text style={styles.label}>
                Employee ID / Designation
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="AB-409"
                placeholderTextColor={COLORS.muted}
              />
            </View>

            {/* ================= PASSWORD ================= */}

            <Text style={styles.label}>Password</Text>

            <View style={passwordInputStyle}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? "◉" : "◌"}
                </Text>
              </Pressable>
            </View>


            {/* ================= CONFIRM PASSWORD ================= */}

            <Text style={styles.label}>
              Confirm Password
            </Text>

            <View
              style={[
                styles.inputWrapper,
                confirmPassword.length > 0 &&
                password === confirmPassword && {
                  borderWidth: 1.5,
                  borderColor: COLORS.primary,
                },
                confirmPassword.length > 0 &&
                password !== confirmPassword && {
                  borderWidth: 1.5,
                  borderColor: COLORS.danger,
                },
              ]}
            >
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />

              <Pressable
                onPress={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? "◉" : "◌"}
                </Text>
              </Pressable>
            </View>

            {confirmPassword.length > 0 &&
              confirmPassword === password && (
                <Text style={styles.matchedText}>
                  ✓ Password Matched
                </Text>
              )}

            {confirmPassword.length > 0 &&
              confirmPassword !== password && (
                <Text style={styles.passwordError}>
                  Passwords do not match
                </Text>
              )}

            {/* ================= TERMS ================= */}

            <Pressable
              style={styles.termsRow}
              onPress={() => setAccepted(!accepted)}
            >
              <View
                style={[
                  styles.checkbox,
                  accepted && styles.checkboxActive,
                ]}
              >
                {accepted && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>

              <Text style={styles.termsText}>
                I agree to Aryans Buildcon{" "}
                <Text style={styles.termsLink}>
                  Field Safety Policies
                </Text>{" "}
                &{" "}
                <Text style={styles.termsLink}>
                  Device Geo-tracking
                </Text>{" "}
                protocols for site attendance.
              </Text>
            </Pressable>

            {/* ================= CREATE ACCOUNT ================= */}

            <Pressable
              onPress={handleCreateAccount}
              style={[
                styles.createButton,
                !accepted && styles.createButtonDisabled,
              ]}
            >
              <Text style={styles.createButtonText}>
                Create Account
              </Text>

              <Text style={styles.createArrow}>→</Text>
            </Pressable>

            {/* ================= LOGIN ================= */}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
              </Text>

              <Pressable
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.loginLink}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================
   PASSWORD RULE COMPONENT
========================= */

function Rule({ active, text }) {
  return (
    <View
      style={[
        styles.rule,
        active && styles.ruleActive,
      ]}
    >
      <Text
        style={[
          styles.ruleCheck,
          active && styles.ruleCheckActive,
        ]}
      >
        {active ? "✓" : "○"}
      </Text>

      <Text
        style={[
          styles.ruleText,
          active && styles.ruleTextActive,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

