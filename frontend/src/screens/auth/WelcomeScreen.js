
import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  ImageBackground,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";

export default function WelcomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallPhone = height < 700 || width < 360;
  const isTablet = width >= 768;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ImageBackground
        source={require("../../../assets/site.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* High-Contrast Dark Gradient/Overlay for 100% Text Readability */}
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 24) + (isSmallPhone ? 8 : 18),
              paddingBottom: Math.max(insets.bottom, 20) + (isSmallPhone ? 12 : 22),
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* ================= BRAND LOGO ================= */}
          <View style={styles.topSection}>
            <View
              style={[
                styles.brandCard,
                isSmallPhone && styles.brandCardSmall,
              ]}
            >
              <Image
                source={require("../../../assets/authentication/logo.png")}
                style={[
                  styles.logoImage,
                  isSmallPhone && styles.logoImageSmall,
                ]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ================= HERO CONTENT ================= */}
          <View style={styles.heroSection}>
            {/* Status Pill Badge */}
            <View style={styles.badgePill}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>FIELD OPERATIONS SUITE</Text>
            </View>

            {/* Main Title - Responsive & Highly Legible */}
            <Text
              style={[
                styles.title,
                { fontSize: isSmallPhone ? 24 : isTablet ? 34 : 27 },
              ]}
              maxFontSizeMultiplier={1.2}
            >
              Site Visit & Field Manager
            </Text>

            {/* Subtitle / Description */}
            <Text
              style={[
                styles.description,
                { fontSize: isSmallPhone ? 13 : 14.5 },
              ]}
              maxFontSizeMultiplier={1.2}
            >
              Manage your site visits, record live GPS locations, and submit daily field reports with ease.
            </Text>

            {/* Quick Highlights Card */}
            <View style={styles.featuresCard}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <Text style={styles.featureIcon}>📍</Text>
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Live GPS Verification</Text>
                  <Text style={styles.featureDesc}>Accurate location capture during site visits</Text>
                </View>
              </View>

              <View style={styles.featureDivider} />

              <View style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <Text style={styles.featureIcon}>📸</Text>
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Instant Cloud Photos</Text>
                  <Text style={styles.featureDesc}>Secure cloud photo documentation</Text>
                </View>
              </View>

              <View style={styles.featureDivider} />

              <View style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <Text style={styles.featureIcon}>📊</Text>
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Lead & Report Tracking</Text>
                  <Text style={styles.featureDesc}>Real-time activity sync with admin dashboard</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= BUTTONS & FOOTER ================= */}
          <View style={styles.bottomSection}>
            {/* Get Started Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => navigation.navigate("Signup")}
              accessibilityRole="button"
              accessibilityLabel="Get Started with registration"
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>

            {/* Sign In Button */}
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="button"
              accessibilityLabel="Sign in to your account"
            >
              <Text style={styles.secondaryButtonIcon}>👤</Text>
              <Text style={styles.secondaryButtonText}>Sign In / Login</Text>
            </Pressable>

            {/* Trust Footer */}
            <Text style={styles.footerText}>
              Aryans Buildcon • A Tradition of Trust
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1A14",
  },

  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  /* Solid dark contrast overlay so all text stands out sharply */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 22, 16, 0.78)",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  /* ================= TOP SECTION ================= */
  topSection: {
    alignItems: "center",
    marginBottom: 8,
  },

  brandCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },

  brandCardSmall: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },

  logoImage: {
    width: 170,
    height: 62,
  },

  logoImageSmall: {
    width: 145,
    height: 52,
  },

  /* ================= HERO SECTION ================= */
  heroSection: {
    alignItems: "center",
    marginVertical: 12,
  },

  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5EF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary || "#007949",
    marginRight: 7,
  },

  badgeText: {
    color: COLORS.primaryDark || "#005C38",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  title: {
    color: "#FFFFFF",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  description: {
    color: "#E5ECE8",
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 8,
    marginBottom: 14,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* Features Glassmorphism Card */
  featuresCard: {
    width: "100%",
    backgroundColor: "rgba(18, 36, 27, 0.72)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.22)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },

  featureIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  featureIcon: {
    fontSize: 16,
  },

  featureTextBox: {
    flex: 1,
  },

  featureTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 1,
  },

  featureDesc: {
    color: "#B7C8C0",
    fontSize: 11,
    fontWeight: "400",
  },

  featureDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 4,
  },

  /* ================= BOTTOM SECTION ================= */
  bottomSection: {
    width: "100%",
    marginTop: 14,
  },

  primaryButton: {
    height: 52,
    backgroundColor: COLORS.primary || "#007949",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  primaryButtonArrow: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    marginLeft: 8,
  },

  secondaryButton: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE5E0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  secondaryButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  secondaryButtonText: {
    color: COLORS.primaryDark || "#005C38",
    fontSize: 15.5,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },

  footerText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 12,
    letterSpacing: 0.3,
  },
});
