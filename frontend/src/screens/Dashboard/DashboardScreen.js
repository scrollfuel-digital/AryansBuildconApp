import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import COLORS from "../../constants/colors";
import { styles } from "../../styles/dashboard.styles";
import {
  getAdvisorDashboardSummary,
  createSiteVisit,
  getActiveProjects,
  uploadSiteVisitPhoto,
} from "../../services/advisorDashboardService";
import {
  getAdvisorProfile,
  advisorLogout,
} from "../../services/advisorService";

export default function AdvisorDashboardScreen({ onLogout }) {
  /* =========================================================
     STATE
  ========================================================= */

  const [advisor, setAdvisor] = useState({
    name: "Advisor",
    employeeId: "",
    email: "",
    mobile: "",
    role: "advisor",
    designation: "Advisor",
    status: "active",
    createdAt: null,
  });

  const [stats, setStats] = useState({
    totalVisits: 0,
    todayVisits: 0,
    recentVisits: [],
  });

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [leadFormVisible, setLeadFormVisible] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [seniorName, setSeniorName] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  /* =========================================================
     INITIALS
  ========================================================= */

  const initials = advisor.name
    ? advisor.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "AD";

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [summaryRes, profileRes, projectsRes] = await Promise.allSettled([
        getAdvisorDashboardSummary(),
        getAdvisorProfile(),
        getActiveProjects(),
      ]);

      // 1. Process Dashboard summary
      if (summaryRes.status === "fulfilled" && summaryRes.value?.success) {
        const sData = summaryRes.value.data;
        setStats({
          totalVisits: sData?.totalVisits ?? 0,
          todayVisits: sData?.todayVisits ?? 0,
          recentVisits: sData?.recentVisits ?? [],
        });

        if (sData?.advisor) {
          setAdvisor((prev) => ({
            ...prev,
            ...sData.advisor,
          }));
        }
      }

      // 2. Process Profile data
      if (profileRes.status === "fulfilled" && profileRes.value?.success) {
        const pData = profileRes.value.data;
        setAdvisor((prev) => ({
          ...prev,
          name: pData?.name || prev.name,
          employeeId: pData?.employeeId || prev.employeeId,
          email: pData?.email || prev.email,
          mobile: pData?.mobile || prev.mobile,
          role: pData?.role || prev.role,
          designation: pData?.designation || prev.designation,
          status: pData?.status || prev.status,
          createdAt: pData?.createdAt || prev.createdAt,
        }));
      }

      // 3. Process Projects
      if (projectsRes.status === "fulfilled" && projectsRes.value?.success) {
        const pList = projectsRes.value.data || [];
        setProjects(pList);
        if (pList.length > 0 && !selectedProjectId) {
          setSelectedProjectId(pList[0]._id || pList[0].id);
        }
      }
    } catch (error) {
      console.log("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  /* =========================================================
     CAMERA & PHOTO
  ========================================================= */

  const capturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Camera Permission",
          "Please grant camera access to capture site photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0]);
      }
    } catch (err) {
      console.log("Camera error:", err);
      Alert.alert("Camera Error", "Unable to open camera.");
    }
  };

  /* =========================================================
     LIVE GPS LOCATION & REVERSE GEOCODING
  ========================================================= */

  const reverseGeocodeCoords = async (latitude, longitude) => {
    let addressText = "";
    try {
      const geoRes = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geoRes && geoRes.length > 0) {
        const g = geoRes[0];
        if (g.formattedAddress) {
          addressText = g.formattedAddress;
        } else {
          const parts = [
            g.name && g.name !== g.street ? g.name : null,
            g.streetNumber ? `${g.streetNumber} ${g.street || ""}`.trim() : g.street,
            g.district,
            g.subregion,
            g.city,
            g.region,
            g.postalCode,
          ].filter(Boolean);
          const uniqueParts = parts.filter((p, idx) => parts.indexOf(p) === idx);
          addressText = uniqueParts.join(", ");
        }
      }
    } catch (err) {
      console.log("Location.reverseGeocodeAsync error:", err);
    }

    // Fallback: OpenStreetMap Nominatim reverse geocode if needed
    if (!addressText) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "AryansBuildconMobileApp/1.0",
              "Accept-Language": "en",
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data?.display_name) {
            addressText = data.display_name;
          }
        }
      } catch (nomErr) {
        console.log("Nominatim reverse geocode error:", nomErr);
      }
    }

    return addressText;
  };

  const getLiveLocation = async () => {
    try {
      setLocating(true);
      const permission =
        await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Please grant location permission to tag site visit coordinates."
        );
        return;
      }

      const curPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = curPos.coords.latitude;
      const lng = curPos.coords.longitude;

      // Reverse geocode to convert coordinates to readable address
      const fetchedAddress = await reverseGeocodeCoords(lat, lng);

      const locData = {
        latitude: lat,
        longitude: lng,
        accuracy: curPos.coords.accuracy,
        address: fetchedAddress || "",
      };

      setLocation(locData);
    } catch (err) {
      console.log("Location error:", err);
      Alert.alert(
        "Location Error",
        "Could not detect your current GPS location. Please check GPS settings."
      );
    } finally {
      setLocating(false);
    }
  };

  /* =========================================================
     SUBMIT SITE VISIT / LEAD
  ========================================================= */

  const resetForm = () => {
    setCustomerName("");
    setCustomerMobile("");
    setCustomerAddress("");
    setSeniorName("");
    setNotes("");
    setPhoto(null);
    setLocation(null);
  };

  const handleSubmitSiteVisit = async () => {
    if (submittingLead) return;

    if (!photo) {
      Alert.alert(
        "Live Photo Mandatory",
        "Please take a live photo using camera before submitting the site visit."
      );
      return;
    }

    if (!customerName.trim()) {
      Alert.alert("Required", "Please enter customer name.");
      return;
    }

    const cleanMobile = customerMobile.replace(/[^0-9]/g, "");
    if (cleanMobile.length !== 10) {
      Alert.alert("Required", "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!customerAddress.trim()) {
      Alert.alert("Required", "Please enter customer address.");
      return;
    }
    if (!seniorName.trim()) {
      Alert.alert("Required", "Please enter Senior / Team Leader name.");
      return;
    }

    if (!location) {
      Alert.alert(
        "Location Required",
        "Please tap 'Get Location' to record GPS coordinates."
      );
      return;
    }

    try {
      setSubmittingLead(true);

      let finalPhotoUrl = "";
      if (photo?.uri) {
        try {
          setUploadingPhoto(true);
          const upRes = await uploadSiteVisitPhoto(photo.uri);
          if (upRes?.success && upRes?.photoUrl) {
            finalPhotoUrl = upRes.photoUrl;
          }
        } catch (uploadErr) {
          console.log("Upload endpoint failed, fallback to base64/uri:", uploadErr);
          if (photo.base64) {
            finalPhotoUrl = `data:image/jpeg;base64,${photo.base64}`;
          } else {
            finalPhotoUrl = photo.uri;
          }
        } finally {
          setUploadingPhoto(false);
        }
      }

      const payload = {
        customerName: customerName.trim(),
        customerMobile: cleanMobile,
        customerAddress: customerAddress.trim(),
        seniorName: seniorName.trim(),
        projectId: selectedProjectId || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        locationAddress: location.address || "",
        photoUrl: finalPhotoUrl,
        notes: notes.trim(),
      };

      const res = await createSiteVisit(payload);

      if (res?.success) {
        Alert.alert(
          "Site Visit Recorded",
          "New site visit has been submitted successfully."
        );
        resetForm();
        setLeadFormVisible(false);
        loadDashboardData(true);
      } else {
        Alert.alert(
          "Submission Failed",
          res?.message || "Could not save site visit."
        );
      }
    } catch (error) {
      console.log("Submit site visit error:", error);
      Alert.alert(
        "Submission Error",
        error.response?.data?.message ||
        error.message ||
        "Could not submit site visit. Please try again."
      );
    } finally {
      setSubmittingLead(false);
      setUploadingPhoto(false);
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setProfileVisible(false);
          if (typeof onLogout === "function") {
            onLogout();
          } else {
            await advisorLogout();
          }
        },
      },
    ]);
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 14, color: COLORS.textSecondary, fontWeight: "600" }}>
          Loading Advisor Dashboard...
        </Text>
      </View>
    );
  }

  /* =========================================================
     MAIN DASHBOARD RENDER
  ========================================================= */

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboardData(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.welcomeText}>Welcome back 👋</Text>
                <Text style={styles.title} numberOfLines={1}>
                  {advisor.name}
                </Text>
                <Text style={styles.subtitle}>
                  {advisor.employeeId ? `${advisor.employeeId} • ` : ""}
                  {advisor.designation || "Advisor Portal"}
                </Text>
              </View>

              {/* PROFILE AVATAR BUTTON */}
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => setProfileVisible(true)}
              >
                <Text style={styles.profileInitials}>{initials}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= OVERVIEW STATS ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview & Performance</Text>
            <View style={styles.statsGrid}>
              {/* TOTAL VISITS */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalVisits}</Text>
                <Text style={styles.statLabel}>Total Site Visits</Text>
              </View>

              {/* TODAY'S VISITS */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.todayVisits}</Text>
                <Text style={styles.statLabel}>Today's Visits</Text>
              </View>

              {/* ADVISOR STATUS */}
              <View style={styles.statCard}>
                <Text
                  style={[
                    styles.statValue,
                    {
                      fontSize: 18,
                      color:
                        advisor.status === "active"
                          ? COLORS.success
                          : COLORS.danger,
                    },
                  ]}
                >
                  {advisor.status === "active" ? "Active ✓" : "Inactive"}
                </Text>
                <Text style={styles.statLabel}>Account Status</Text>
              </View>

              {/* EMPLOYEE ID */}
              <View style={styles.statCard}>
                <Text
                  style={[
                    styles.statValue,
                    { fontSize: 18, color: COLORS.primary },
                  ]}
                  numberOfLines={1}
                >
                  {advisor.employeeId || "ADV"}
                </Text>
                <Text style={styles.statLabel}>Advisor Code</Text>
              </View>
            </View>
          </View>

          {/* ================= ADD NEW LEAD / SITE VISIT ================= */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setLeadFormVisible(true)}
          >
            <Text style={styles.primaryButtonText}>
              + Add New Site Visit / Lead
            </Text>
          </TouchableOpacity>

          {/* ================= RECENT SITE VISITS ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Site Visits</Text>

            {stats.recentVisits.length === 0 ? (
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: COLORS.textPrimary,
                  }}
                >
                  No Site Visits Logged Yet
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.textSecondary,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Tap "+ Add New Site Visit" above to record customer visits with GPS coordinates and photos.
                </Text>
              </View>
            ) : (
              stats.recentVisits.map((visit, index) => {
                const visitDate = visit.visitedAt || visit.createdAt;
                return (
                  <TouchableOpacity
                    key={visit._id || visit.id || index}
                    activeOpacity={0.85}
                    onPress={() => setSelectedVisit(visit)}
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      shadowColor: "#000",
                      shadowOpacity: 0.04,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: COLORS.textPrimary,
                        }}
                      >
                        Customer Name : {visit.customerName || "Customer"}
                      </Text>
                      <View
                        style={{
                          backgroundColor:
                            visit.status === "cancelled"
                              ? COLORS.dangerLight
                              : COLORS.successLight,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color:
                              visit.status === "cancelled"
                                ? COLORS.danger
                                : COLORS.success,
                          }}
                        >
                          {visit.status === "cancelled" ? "Cancelled" : "Submitted"}
                        </Text>
                      </View>
                    </View>

                    {visit.customerMobile ? (
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "400",
                          color: COLORS.textPrimary,
                        }}
                      >
                        Customer Mobile No. : {visit.customerMobile}
                      </Text>
                    ) : null}

                    {visit.customerAddress ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: COLORS.textSecondary,
                          marginTop: 4,
                        }}
                      >
                        Customer Address : {visit.customerAddress}
                      </Text>
                    ) : null}

                    {visit.seniorName ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: COLORS.textPrimary,
                          fontWeight: "700",
                          marginTop: 3,
                        }}
                      >
                        Senior / TL: {visit.seniorName}
                      </Text>
                    ) : null}

                    {visit.projectId?.name ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: COLORS.primary,
                          fontWeight: "600",
                          marginTop: 3,
                        }}
                      >
                        Project Name : {visit.projectId.name}
                        {visit.projectId.location
                          ? ` • ${visit.projectId.location}`
                          : ""}
                      </Text>
                    ) : null}

                    {visit.locationAddress ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          marginTop: 3,
                          fontWeight: "500",
                        }}
                      >
                        📍 Advisor Live Location: {visit.locationAddress}
                      </Text>
                    ) : null}

                    {visit.notes ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          marginTop: 4,
                          fontStyle: "italic",
                        }}
                      >
                        Message :  {visit.notes}
                      </Text>
                    ) : null}

                    {visit.photoUrl ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelectedImage(visit.photoUrl)}
                        style={{
                          marginTop: 8,
                          borderRadius: 10,
                          overflow: "hidden",
                          borderWidth: 1,
                          borderColor: COLORS.border,
                        }}
                      >
                        <Image
                          source={{ uri: visit.photoUrl }}
                          style={{
                            width: "100%",
                            height: 140,
                            backgroundColor: "#F3F4F6",
                          }}
                          resizeMode="cover"
                        />
                        <View
                          style={{
                            position: "absolute",
                            bottom: 6,
                            right: 6,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFF",
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            🔍 Tap to enlarge
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: COLORS.textLight }}>
                        {visitDate
                          ? new Date(visitDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : ""}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: "700" }}>
                          View Details
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "800", marginLeft: 2 }}>
                          ›
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* =========================================================
          PROFILE MODAL POPUP
      ========================================================= */}
      <Modal
        visible={profileVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setProfileVisible(false)}
        >
          <Pressable
            style={styles.profilePopup}
            onPress={(e) => e.stopPropagation()}
          >
            {/* POPUP HEADER */}
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Advisor Profile</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setProfileVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* AVATAR & NAME */}
            <View style={styles.popupAvatar}>
              <Text style={styles.popupAvatarText}>{initials}</Text>
            </View>

            <Text style={styles.popupName}>{advisor.name}</Text>
            <Text style={styles.popupRole}>
              {advisor.designation || "Advisor"} • Aryans Buildcon
            </Text>

            {/* PROFILE DETAILS */}
            <View style={styles.profileInfo}>
              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfoLabel}>Employee ID</Text>
                <Text style={styles.profileInfoValue}>
                  {advisor.employeeId || "N/A"}
                </Text>
              </View>

              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfoLabel}>Phone</Text>
                <Text style={styles.profileInfoValue}>
                  {advisor.mobile || "Not specified"}
                </Text>
              </View>

              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfoLabel}>Email</Text>
                <Text style={styles.profileInfoValue}>
                  {advisor.email || "Not specified"}
                </Text>
              </View>

              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfoLabel}>Role</Text>
                <Text style={styles.profileInfoValue}>
                  {advisor.role ? advisor.role.toUpperCase() : "ADVISOR"}
                </Text>
              </View>

              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfoLabel}>Status</Text>
                <Text
                  style={[
                    styles.profileInfoValue,
                    {
                      color:
                        advisor.status === "active"
                          ? COLORS.success
                          : COLORS.danger,
                    },
                  ]}
                >
                  {advisor.status === "active" ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            {/* SIGN OUT BUTTON */}
            <TouchableOpacity
              style={{
                marginTop: 22,
                backgroundColor: COLORS.dangerLight,
                borderColor: COLORS.danger,
                borderWidth: 1,
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: "center",
              }}
              onPress={handleSignOut}
            >
              <Text
                style={{
                  color: COLORS.danger,
                  fontSize: 14,
                  fontWeight: "800",
                }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================================================
          SITE VISIT FORM MODAL
      ========================================================= */}
      <Modal
        visible={leadFormVisible}
        animationType="slide"
        onRequestClose={() => setLeadFormVisible(false)}
      >
        <SafeAreaView style={styles.formScreen}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>New Site Visit</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setLeadFormVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
            >
              {/* PHOTO SECTION */}
              <Text style={styles.formSectionTitle}>
                Site / Customer Photo
              </Text>

              {photo ? (
                <View style={styles.photoPreviewContainer}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setPhoto(null)}
                  >
                    <Text style={styles.removePhotoText}>Remove Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ECFDF5",
                    borderColor: COLORS.primary,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderRadius: 12,
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                  onPress={capturePhoto}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>📷</Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: COLORS.primary,
                    }}
                  >
                    Take Live Photo (Camera Only) *
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    Gallery upload disabled. Tap to capture live photo.
                  </Text>
                </TouchableOpacity>
              )}

              {/* CUSTOMER DETAILS */}
              <Text style={styles.formSectionTitle}>Customer Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Sharma"
                  placeholderTextColor={COLORS.muted}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={COLORS.muted}
                  value={customerMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={(v) =>
                    setCustomerMobile(v.replace(/[^0-9]/g, ""))
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Address *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      height: 90,
                      textAlignVertical: "top",
                      paddingTop: 12,
                    },
                  ]}
                  placeholder="Enter customer full address (manual)"
                  placeholderTextColor={COLORS.muted}
                  value={customerAddress}
                  onChangeText={setCustomerAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <Text style={styles.formSectionTitle} >Senoir Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senior / Team Leader Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Patil (Senior / TL)"
                  placeholderTextColor={COLORS.muted}
                  value={seniorName}
                  onChangeText={setSeniorName}
                />
              </View>
              <Text style={styles.formSectionTitle}>Project Information</Text>
              {/* PROJECT SELECTION */}
              {projects.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Project</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                  >
                    {projects.map((proj) => {
                      const id = proj._id || proj.id;
                      const isSelected = selectedProjectId === id;
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() => setSelectedProjectId(id)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: isSelected
                              ? COLORS.primary
                              : COLORS.white,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? COLORS.primary
                              : COLORS.border,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected
                                ? COLORS.white
                                : COLORS.textPrimary,
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                          >
                            {proj.name}
                          </Text>
                          {proj.location ? (
                            <Text
                              style={{
                                color: isSelected
                                  ? COLORS.white
                                  : COLORS.textSecondary,
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {proj.location}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              <Text style={styles.formSectionTitle}>Basic Information</Text>
              {/* REMARKS / NOTES */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Visit Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, { height: 75, textAlignVertical: "top" }]}
                  placeholder="Plot requirement, budget, visit notes..."
                  placeholderTextColor={COLORS.muted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>

              {/* GPS LOCATION CAPTURE */}
              <Text style={styles.formSectionTitle}>
                GPS Location Verification
              </Text>

              <View style={[styles.infoBox, { alignItems: "flex-start" }]}>
                <Text style={[styles.infoBoxIcon, { marginTop: 2 }]}>📍</Text>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.infoBoxLabel}>Advisor Site Visit Live Location</Text>
                  {location ? (
                    <View style={{ marginTop: 2 }}>
                      {location.address ? (
                        <Text
                          style={{
                            fontSize: 13,
                            color: COLORS.textPrimary,
                            fontWeight: "700",
                            lineHeight: 18,
                            marginBottom: 4,
                          }}
                        >
                          {location.address}
                        </Text>
                      ) : null}
                      {/* <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" }}>
                        🌐 Lat: {location.latitude.toFixed(6)} | Lng: {location.longitude.toFixed(6)}
                      </Text> */}
                    </View>
                  ) : (
                    <Text style={styles.locationNotCaptured}>
                      Advisor live location not captured yet
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getLiveLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.locationButtonText}>
                      {location ? "Refresh" : "Get Location"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submittingLead && styles.disabledButton,
                ]}
                onPress={handleSubmitSiteVisit}
                disabled={submittingLead}
              >
                {submittingLead ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Save Site Visit
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ================= PHOTO VIEWER MODAL ================= */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.92)",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              backgroundColor: "rgba(255,255,255,0.3)",
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "bold" }}>×</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "80%", borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ================= SITE VISIT DETAILS POPUP MODAL ================= */}
      <Modal
        visible={!!selectedVisit}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVisit(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "88%",
              paddingBottom: 24,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: COLORS.textPrimary,
                  }}
                >
                  Site Visit Information
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Recorded field visit details
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedVisit(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    color: COLORS.textSecondary,
                    fontWeight: "bold",
                    lineHeight: 24,
                  }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      selectedVisit?.status === "cancelled"
                        ? COLORS.dangerLight
                        : COLORS.successLight,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color:
                        selectedVisit?.status === "cancelled"
                          ? COLORS.danger
                          : COLORS.success,
                    }}
                  >
                    {selectedVisit?.status === "cancelled"
                      ? "CANCELLED"
                      : "SUBMITTED"}
                  </Text>
                </View>
              </View>


              {/* Photo Preview if available */}
              {selectedVisit?.photoUrl ? (
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 8,
                    }}
                  >
                    Captured Photo
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedImage(selectedVisit.photoUrl)}
                    style={{
                      borderRadius: 14,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      position: "relative",
                    }}
                  >
                    <Image
                      source={{ uri: selectedVisit.photoUrl }}
                      style={{
                        width: "100%",
                        height: 200,
                        backgroundColor: "#F3F4F6",
                      }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: "rgba(0,0,0,0.65)",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFF",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        🔍 Tap to Enlarge
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}
              {/* Customer & Status Badge */}

              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  marginBottom: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                }}
              >
                {/* Customer Name */}
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: COLORS.textPrimary,
                    marginBottom: 14,
                  }}
                >
                 Customer Name : {selectedVisit?.customerName || "Customer"}
                </Text>

                {/* Customer Mobile */}
                {selectedVisit?.customerMobile ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: COLORS.textSecondary,
                        marginRight: 8,
                      }}
                    >
                      📞
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: COLORS.textSecondary,
                          textTransform: "uppercase",
                          letterSpacing: 0.7,
                          marginBottom: 4,
                        }}
                      >
                        Customer Mobile Number
                      </Text>

                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: COLORS.textPrimary,
                        }}
                      >
                        {selectedVisit.customerMobile}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Customer Address */}
                {selectedVisit?.customerAddress ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      borderTopWidth: 1,
                      borderTopColor: COLORS.border,
                      paddingTop: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        marginRight: 8,
                      }}
                    >
                      📍
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: COLORS.textSecondary,
                          textTransform: "uppercase",
                          letterSpacing: 0.7,
                          marginBottom: 5,
                        }}
                      >
                        Customer Address
                      </Text>

                      <Text
                        style={{
                          fontSize: 14,
                          color: COLORS.textPrimary,
                          fontWeight: "500",
                          lineHeight: 22,
                        }}
                      >
                        {selectedVisit.customerAddress}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Information Cards List */}
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  marginBottom: 16,
                }}
              >
                {selectedVisit?.seniorName ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      Senior / Team Leader
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: COLORS.textPrimary,
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      👔 {selectedVisit.seniorName}
                    </Text>
                  </View>
                ) : null}

                {selectedVisit?.projectId?.name ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      Project Name & Location
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: COLORS.primary,
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      📍 {selectedVisit.projectId.name}
                      {selectedVisit.projectId.location
                        ? ` • ${selectedVisit.projectId.location}`
                        : ""}
                    </Text>
                  </View>
                ) : null}

                {selectedVisit?.locationAddress ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      Advisor Site Visit Live Location
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.textPrimary,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      📍 {selectedVisit.locationAddress}
                    </Text>
                  </View>
                ) : null}

             

                <View style={{ marginBottom: selectedVisit?.notes ? 12 : 0 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.textSecondary,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    Visit Date & Time
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: COLORS.textPrimary,
                      fontWeight: "600",
                      marginTop: 2,
                    }}
                  >
                    🕒{" "}
                    {selectedVisit?.visitedAt || selectedVisit?.createdAt
                      ? new Date(
                        selectedVisit.visitedAt || selectedVisit.createdAt
                      ).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                      : "N/A"}
                  </Text>
                </View>

                {selectedVisit?.notes ? (
                  <View>
                    <Text
                      style={{
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      Visit Remarks / Notes
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.textPrimary,
                        marginTop: 2,
                        
                      }}
                    >
                      📝 {selectedVisit.notes}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setSelectedVisit(null)}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
