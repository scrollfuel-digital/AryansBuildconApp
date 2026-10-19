
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  ImageBackground,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";

export default function EmployeeFieldReportScreen({
  navigation,
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#17211D"
      />

      <ImageBackground
        source={require("../../../assets/site.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* ================= DARK OVERLAY ================= */}

        <View style={styles.overlay} />

        {/* ================= CONTENT ================= */}

        <View style={styles.content}>

          {/* ================= LOGO ================= */}

          <View style={styles.logoContainer}>
            <ImageBackground
              source={require("../../../assets/authentication/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* ================= HERO ================= */}

          <View style={styles.hero}>

            <View style={styles.badge}>
              <View style={styles.badgeDot} />

              <Text style={styles.badgeText}>
                FIELD OPERATIONS SUITE
              </Text>
            </View>

            <Text style={styles.title}>
              Site Visit Manager
            </Text>

            <Text style={styles.description}>
              Manage your site visits, field activities
              {"\n"}
              and daily reports with ease.
            </Text>

          </View>

          {/* ================= SPACER ================= */}

          <View style={styles.spacer} />

          {/* ================= BUTTONS ================= */}

          <View style={styles.buttonsContainer}>

            {/* GET STARTED */}

            <Pressable
              style={({ pressed }) => [
                styles.getStartedButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.getStartedText}>
                Get Started
              </Text>

              <Text style={styles.arrow}>
                →
              </Text>
            </Pressable>

            {/* LOGIN */}

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginIcon}>
                ♙
              </Text>

              <Text style={styles.loginText}>
                Sign In / Login
              </Text>
            </Pressable>

          </View>

        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  /* ================= SCREEN ================= */

  safeArea: {
    flex: 1,
    backgroundColor: "#17211D",
  },

  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  /* ================= OVERLAY ================= */

  overlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: COLORS.overlay,
  },

  /* ================= CONTENT ================= */

  content: {
    flex: 1,

    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 25,
  },

  /* ================= LOGO ================= */

  logoContainer: {
    width: 250,
    height: 100,
    right: 20,
    borderRadius: 12,

    alignSelf: "center",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 1,
   
  },

  logo: {
    width: 195,
    height: 195,
  },

  /* ================= HERO ================= */

  hero: {
    alignItems: "center",

    paddingHorizontal: 10,
  },

  /* ================= BADGE ================= */

  badge: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: COLORS.lightGreen,

    borderRadius: 20,

    paddingHorizontal: 12,
    paddingVertical: 6,

    marginBottom: 12,
  },

  badgeDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: COLORS.primary,

    marginRight: 6,
  },

  badgeText: {
    color: COLORS.primaryDark,

    fontSize: 8,

    fontWeight: "800",

    letterSpacing: 0.7,
  },

  /* ================= TITLE ================= */

  title: {
    color: COLORS.primaryDark,

    fontSize: 32,

    fontWeight: "900",

    textAlign: "center",

    marginBottom: 9,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  /* ================= DESCRIPTION ================= */

  description: {
    color: "black",

    fontSize: 14,

    lineHeight: 21,

    textAlign: "center",

    fontWeight: "400",
  },

  /* ================= SPACER ================= */

  spacer: {
    flex: 1,
  },

  /* ================= BUTTON CONTAINER ================= */

  buttonsContainer: {
    width: "100%",
  },

  /* ================= GET STARTED ================= */

  getStartedButton: {
    height: 52,

    backgroundColor: COLORS.primary,

    borderRadius: 8,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    marginBottom: 10,

    elevation: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },

  getStartedText: {
    color: COLORS.white,

    fontSize: 17,

    fontWeight: "800",
  },

  arrow: {
    color: COLORS.white,

    fontSize: 20,

    fontWeight: "900",

    marginLeft: 8,
  },

  /* ================= LOGIN ================= */

  loginButton: {
    height: 52,

    backgroundColor: "rgba(255,255,255,0.94)",

    borderRadius: 8,

    borderWidth: 1,

    borderColor: COLORS.border,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    elevation: 3,
  },

  loginIcon: {
    color: COLORS.primary,

    fontSize: 20,

    marginRight: 7,
  },

  loginText: {
    color: COLORS.primaryDark,

    fontSize: 17,

    fontWeight: "700",
  },

  /* ================= PRESS ================= */

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
