import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import COLORS from "../../constants/colors";
import {
  getAdminDashboardSummary,
  getAllAdvisors,
  setAdvisorStatus,
  createAdvisorByAdmin,
  updateAdvisorByAdmin,
  uploadAdvisorPhoto,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getAllSiteVisits,
  deleteSiteVisit,
  adminLogout,
} from "../../services/adminService";

export default function AdminDashboardScreen({ onLogout }) {
  /* =========================================================
     TAB STATE: 'overview' | 'advisors' | 'projects' | 'visits'
  ========================================================= */
  const [activeTab, setActiveTab] = useState("overview");

  // Loading & refresh states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [summary, setSummary] = useState({
    totalAdvisors: 0,
    activeAdvisors: 0,
    totalProjects: 0,
    totalVisits: 0,
    todayVisits: 0,
  });
  const [advisors, setAdvisors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Modals
  const [addAdvisorModalVisible, setAddAdvisorModalVisible] = useState(false);
  const [addProjectModalVisible, setAddProjectModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Advisor form
  const [advName, setAdvName] = useState("");
  const [advEmail, setAdvEmail] = useState("");
  const [advMobile, setAdvMobile] = useState("");
  const [advPassword, setAdvPassword] = useState("");
  const [advPhoto, setAdvPhoto] = useState(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);

  // New Project form
  const [projName, setProjName] = useState("");
  const [projLocation, setProjLocation] = useState("");
  const [projDescription, setProjDescription] = useState("");

  // Edit Advisor modal state
  const [editAdvisorModalVisible, setEditAdvisorModalVisible] = useState(false);
  const [editingAdvisorId, setEditingAdvisorId] = useState(null);
  const [editAdvName, setEditAdvName] = useState("");
  const [editAdvEmail, setEditAdvEmail] = useState("");
  const [editAdvMobile, setEditAdvMobile] = useState("");
  const [editAdvDesignation, setEditAdvDesignation] = useState("");
  const [editAdvEmployeeId, setEditAdvEmployeeId] = useState("");

  // Edit Project modal state
  const [editProjectModalVisible, setEditProjectModalVisible] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjName, setEditProjName] = useState("");
  const [editProjLocation, setEditProjLocation] = useState("");
  const [editProjDescription, setEditProjDescription] = useState("");
  const [editProjStatus, setEditProjStatus] = useState("active");

  /* =========================================================
     FETCH DATA
  ========================================================= */
  const fetchAdminData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [sumRes, advRes, projRes, visRes] = await Promise.allSettled([
        getAdminDashboardSummary(),
        getAllAdvisors({ limit: 50 }),
        getAllProjects(),
        getAllSiteVisits({ limit: 30 }),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value?.success) {
        setSummary(sumRes.value.data);
      }

      if (advRes.status === "fulfilled" && advRes.value?.success) {
        setAdvisors(advRes.value.data || []);
      }

      if (projRes.status === "fulfilled" && projRes.value?.success) {
        setProjects(projRes.value.data || []);
      }

      if (visRes.status === "fulfilled" && visRes.value?.success) {
        setVisits(visRes.value.data || []);
      }
    } catch (error) {
      console.log("Error loading admin data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  /* =========================================================
     ADVISOR ACTIONS
  ========================================================= */
  const handleToggleAdvisorStatus = async (advisorId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const actionLabel = newStatus === "active" ? "Activate" : "Deactivate";

    Alert.alert(
      `${actionLabel} Advisor`,
      `Are you sure you want to mark this advisor as ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionLabel,
          style: newStatus === "active" ? "default" : "destructive",
          onPress: async () => {
            try {
              const res = await setAdvisorStatus(advisorId, newStatus);
              if (res?.success) {
                Alert.alert("Success", `Advisor status changed to ${newStatus}.`);
                fetchAdminData(true);
              }
            } catch (err) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Failed to update advisor status."
              );
            }
          },
        },
      ]
    );
  };

  const captureAdvisorLivePhoto = async () => {
    try {
      setCapturingPhoto(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "Live camera access is mandatory to capture the advisor's photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAdvPhoto(result.assets[0]);
      }
    } catch (err) {
      console.log("Advisor camera error:", err);
      Alert.alert("Camera Error", "Unable to open camera for live photo.");
    } finally {
      setCapturingPhoto(false);
    }
  };

  const handleCreateAdvisor = async () => {
    // 1. Guard against duplicate clicks
    if (submitting) return;

    // 2. Mandatory live photo check
    if (!advPhoto) {
      Alert.alert(
        "Live Photo Mandatory",
        "Capturing a live photo using camera is mandatory to create an advisor account. Gallery upload is not allowed."
      );
      return;
    }

    if (!advName.trim()) {
      Alert.alert("Required", "Please provide advisor full name.");
      return;
    }

    if (!advEmail.trim()) {
      Alert.alert("Required", "Please provide advisor email address.");
      return;
    }

    if (!advPassword) {
      Alert.alert("Required", "Please provide a temporary password.");
      return;
    }

    if (advPassword.length < 8) {
      Alert.alert("Password Length", "Password must be at least 8 characters.");
      return;
    }

    try {
      setSubmitting(true);

      // Upload live photo
      let finalPhotoUrl = "";
      if (advPhoto?.uri) {
        try {
          const upRes = await uploadAdvisorPhoto(advPhoto.uri);
          if (upRes?.success && upRes?.photoUrl) {
            finalPhotoUrl = upRes.photoUrl;
          }
        } catch (uploadErr) {
          console.log("Upload endpoint failed, fallback to base64/uri:", uploadErr);
          if (advPhoto.base64) {
            finalPhotoUrl = `data:image/jpeg;base64,${advPhoto.base64}`;
          } else {
            finalPhotoUrl = advPhoto.uri;
          }
        }
      }

      if (!finalPhotoUrl && advPhoto?.base64) {
        finalPhotoUrl = `data:image/jpeg;base64,${advPhoto.base64}`;
      }

      const res = await createAdvisorByAdmin({
        name: advName.trim(),
        email: advEmail.trim(),
        mobile: advMobile.trim(),
        password: advPassword,
        photoUrl: finalPhotoUrl,
      });

      if (res?.success) {
        Alert.alert("Advisor Created", `Created advisor: ${advName}`);
        setAdvName("");
        setAdvEmail("");
        setAdvMobile("");
        setAdvPassword("");
        setAdvPhoto(null);
        setAddAdvisorModalVisible(false);
        fetchAdminData(true);
      }
    } catch (err) {
      Alert.alert(
        "Creation Error",
        err.response?.data?.message || err.message || "Failed to create advisor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     PROJECT ACTIONS
  ========================================================= */
  const handleCreateProject = async () => {
    if (!projName.trim() || !projLocation.trim()) {
      Alert.alert("Required", "Please provide project name and location.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createProject({
        name: projName.trim(),
        location: projLocation.trim(),
        description: projDescription.trim(),
      });

      if (res?.success) {
        Alert.alert("Project Created", `Created project: ${projName}`);
        setProjName("");
        setProjLocation("");
        setProjDescription("");
        setAddProjectModalVisible(false);
        fetchAdminData(true);
      }
    } catch (err) {
      Alert.alert(
        "Creation Error",
        err.response?.data?.message || "Failed to create project."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = (projectId, projectName) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteProject(projectId, true);
              if (res?.success) {
                Alert.alert("Success", res.message || "Project deleted successfully.");
                fetchAdminData(true);
              } else {
                Alert.alert("Notice", res?.message || "Could not delete project.");
              }
            } catch (err) {
              console.log("Delete project error:", err);
              Alert.alert(
                "Delete Failed",
                err.response?.data?.message || err.message || "Failed to delete project."
              );
            }
          },
        },
      ]
    );
  };

  /* =========================================================
     SITE VISIT ACTIONS
  ========================================================= */
  const handleDeleteSiteVisit = (visitId, customerName) => {
    Alert.alert(
      "Delete Site Visit",
      `Are you sure you want to permanently delete the site visit for "${customerName || "Customer"}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteSiteVisit(visitId);
              if (res?.success) {
                Alert.alert("Deleted", "Site visit deleted permanently.");
                if (selectedVisit && (selectedVisit._id === visitId || selectedVisit.id === visitId)) {
                  setSelectedVisit(null);
                }
                fetchAdminData(true);
              } else {
                Alert.alert("Notice", res?.message || "Could not delete site visit.");
              }
            } catch (err) {
              console.log("Delete site visit error:", err);
              Alert.alert(
                "Delete Failed",
                err.response?.data?.message || err.message || "Failed to delete site visit."
              );
            }
          },
        },
      ]
    );
  };

  /* =========================================================
     EDIT ADVISOR ACTIONS
  ========================================================= */
  const handleOpenEditAdvisor = (adv) => {
    setEditingAdvisorId(adv._id || adv.id);
    setEditAdvName(adv.name || "");
    setEditAdvEmail(adv.email || "");
    setEditAdvMobile(adv.mobile || "");
    setEditAdvDesignation(adv.designation || "");
    setEditAdvEmployeeId(adv.employeeId || "");
    setEditAdvisorModalVisible(true);
  };

  const handleUpdateAdvisor = async () => {
    if (submitting) return;

    if (!editAdvName.trim()) {
      Alert.alert("Required", "Advisor name cannot be empty.");
      return;
    }
    if (!editAdvEmail.trim()) {
      Alert.alert("Required", "Advisor email cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateAdvisorByAdmin(editingAdvisorId, {
        name: editAdvName.trim(),
        email: editAdvEmail.trim(),
        mobile: editAdvMobile.trim(),
        designation: editAdvDesignation.trim(),
        employeeId: editAdvEmployeeId.trim(),
      });

      if (res?.success) {
        Alert.alert("Success", "Advisor details updated successfully.");
        setEditAdvisorModalVisible(false);
        fetchAdminData(true);
      } else {
        Alert.alert("Update Failed", res?.message || "Could not update advisor.");
      }
    } catch (err) {
      console.log("Update advisor error:", err);
      Alert.alert(
        "Update Error",
        err.response?.data?.message || err.message || "Failed to update advisor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     EDIT PROJECT ACTIONS
  ========================================================= */
  const handleOpenEditProject = (proj) => {
    setEditingProjectId(proj._id || proj.id);
    setEditProjName(proj.name || "");
    setEditProjLocation(proj.location || "");
    setEditProjDescription(proj.description || "");
    setEditProjStatus(proj.status || "active");
    setEditProjectModalVisible(true);
  };

  const handleUpdateProject = async () => {
    if (submitting) return;

    if (!editProjName.trim()) {
      Alert.alert("Required", "Project name cannot be empty.");
      return;
    }
    if (!editProjLocation.trim()) {
      Alert.alert("Required", "Project location cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateProject(editingProjectId, {
        name: editProjName.trim(),
        location: editProjLocation.trim(),
        description: editProjDescription.trim(),
        status: editProjStatus,
      });

      if (res?.success) {
        Alert.alert("Success", "Project updated successfully.");
        setEditProjectModalVisible(false);
        fetchAdminData(true);
      } else {
        Alert.alert("Update Failed", res?.message || "Could not update project.");
      }
    } catch (err) {
      console.log("Update project error:", err);
      Alert.alert(
        "Update Error",
        err.response?.data?.message || err.message || "Failed to update project."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */
  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Admin Panel?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          if (typeof onLogout === "function") {
            onLogout();
          } else {
            await adminLogout();
          }
        },
      },
    ]);
  };

  /* =========================================================
     RENDER
  ========================================================= */
  if (loading) {
    return (
      <View style={adminStyles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>
          Loading Admin Panel...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={adminStyles.screen}>
      {/* ================= HEADER ================= */}
      <View style={adminStyles.header}>
        <View>
          <Text style={adminStyles.headerTitle}>Admin Console</Text>
          <Text style={adminStyles.headerSubtitle}>
            Aryans Buildcon Management Portal
          </Text>
        </View>

        <TouchableOpacity
          style={adminStyles.logoutButton}
          onPress={handleSignOut}
        >
          <Text style={adminStyles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ================= TABS ================= */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, backgroundColor: COLORS.white }}
        contentContainerStyle={adminStyles.tabsContainer}
        keyboardShouldPersistTaps="handled"
      >
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "advisors", label: `👥 Advisors (${summary.totalAdvisors})` },
          { key: "projects", label: `🏗️ Projects (${projects.length})` },
          { key: "visits", label: `📍 Visits (${summary.totalVisits})` },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
              style={[
                adminStyles.tabItem,
                isSelected && adminStyles.tabItemSelected,
              ]}
            >
              <Text
                style={[
                  adminStyles.tabItemText,
                  isSelected && adminStyles.tabItemTextSelected,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>


      {/* ================= BODY ================= */}
      <ScrollView
        style={adminStyles.container}
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAdminData(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <View>
            <Text style={adminStyles.sectionHeader}>Key Metrics</Text>
            <View style={adminStyles.statsGrid}>
              <View style={adminStyles.statCard}>
                <Text style={adminStyles.statValue}>{summary.totalAdvisors}</Text>
                <Text style={adminStyles.statLabel}>Total Advisors</Text>
              </View>

              <View style={adminStyles.statCard}>
                <Text style={[adminStyles.statValue, { color: COLORS.success }]}>
                  {summary.activeAdvisors}
                </Text>
                <Text style={adminStyles.statLabel}>Active Advisors</Text>
              </View>

              <View style={adminStyles.statCard}>
                <Text style={adminStyles.statValue}>{summary.totalProjects}</Text>
                <Text style={adminStyles.statLabel}>Active Projects</Text>
              </View>

              <View style={adminStyles.statCard}>
                <Text style={[adminStyles.statValue, { color: COLORS.primaryDark }]}>
                  {summary.todayVisits}
                </Text>
                <Text style={adminStyles.statLabel}>Today's Visits</Text>
              </View>
            </View>

            <View
              style={[
                adminStyles.statCard,
                { width: "100%", marginTop: 4, marginBottom: 18 },
              ]}
            >
              <Text style={adminStyles.statValue}>{summary.totalVisits}</Text>
              <Text style={adminStyles.statLabel}>
                Total Site Visits Logged Across Organization
              </Text>
            </View>

            {/* QUICK ACTIONS */}
            <Text style={adminStyles.sectionHeader}>Quick Actions</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
              <TouchableOpacity
                style={[adminStyles.actionButton, { backgroundColor: COLORS.primary }]}
                onPress={() => setAddAdvisorModalVisible(true)}
              >
                <Text style={adminStyles.actionButtonText}>+ Add Advisor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[adminStyles.actionButton, { backgroundColor: "#2C3E50" }]}
                onPress={() => setAddProjectModalVisible(true)}
              >
                <Text style={adminStyles.actionButtonText}>+ Add Project</Text>
              </TouchableOpacity>
            </View>

            {/* RECENT VISITS PREVIEW */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={adminStyles.sectionHeader}>Recent Site Visits</Text>
              <TouchableOpacity onPress={() => setActiveTab("visits")}>
                <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "700" }}>
                  View All ({visits.length}) ›
                </Text>
              </TouchableOpacity>
            </View>

            {visits.length === 0 ? (
              <View style={[adminStyles.listItem, { alignItems: "center", paddingVertical: 24 }]}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  No site visits recorded yet.
                </Text>
              </View>
            ) : (
              visits.slice(0, 5).map((visit, i) => (
                <TouchableOpacity
                  key={visit._id || i}
                  style={adminStyles.listItem}
                  activeOpacity={0.85}
                  onPress={() => setSelectedVisit(visit)}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>

                    <Text style={{ fontSize: 20, color: "#61666e", fontWeight: "700", marginTop: 4, marginBottom: 5 }}>
                      Site Visit Information
                    </Text>

                    <View
                      style={{
                        backgroundColor:
                          visit.status === "cancelled" ? COLORS.dangerLight : COLORS.successLight,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: visit.status === "cancelled" ? COLORS.danger : COLORS.success,
                        }}
                      >
                        {visit.status === "cancelled" ? "CANCELLED" : "SUBMITTED"}
                      </Text>
                    </View>
                  </View>
                  {visit.customerName ? (
                    <Text style={{ fontSize: 13, color: "#1E293B", fontWeight: "700", marginTop: 4 }}>
                      Customer Name: {visit.customerName}
                    </Text>
                  ) : null}
                  {visit.customerMobile ? (
                    <Text style={{ fontSize: 13, color: "#1E293B", fontWeight: "700", marginTop: 4 }}>
                      Customer Mobile No.: {visit.customerMobile}
                    </Text>
                  ) : null}
                  {visit.customerAddress ? (
                    <Text style={{ fontSize: 13, color: "#1E293B", fontWeight: "700", marginTop: 4 }}>
                      Customer Address: {visit.customerAddress}
                    </Text>
                  ) : null}
                  {visit.seniorName ? (
                    <Text style={{ fontSize: 13, color: "#1E293B", fontWeight: "700", marginTop: 2 }}>
                      Senior / TL: {visit.seniorName}
                    </Text>
                  ) : null}

                  <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "600", marginTop: 2 }}>
                    Advisor Name: {visit.advisorId?.name || "N/A"} ({visit.advisorId?.employeeId || ""})
                  </Text>

                  {visit.projectId?.name ? (
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: "800" }}>
                      Project: {visit.projectId.name} {visit.projectId.location ? `(${visit.projectId.location})` : ""}
                    </Text>
                  ) : null}

                  {visit.locationAddress ? (
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" }}>
                    📍Advisor Live Location: {visit.locationAddress}
                    </Text>
                  ) : null}

                  {visit.photoUrl ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
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
                        <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>
                          🔍 Tap to view photo
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
                      {visit.visitedAt ? new Date(visit.visitedAt).toLocaleDateString("en-IN") : ""}
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
              ))
            )}
          </View>
        )}

        {/* ================= TAB 2: ADVISORS ================= */}
        {activeTab === "advisors" && (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={adminStyles.sectionHeader}>
                Registered Advisors ({advisors.length})
              </Text>
              <TouchableOpacity
                style={adminStyles.miniAddButton}
                onPress={() => setAddAdvisorModalVisible(true)}
              >
                <Text style={adminStyles.miniAddButtonText}>+ New Advisor</Text>
              </TouchableOpacity>
            </View>

            {advisors.map((adv) => (
              <View key={adv._id} style={adminStyles.listItem}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  {adv.photoUrl ? (
                    <TouchableOpacity
                      onPress={() => setSelectedImage(adv.photoUrl)}
                      style={{ marginRight: 12 }}
                    >
                      <Image
                        source={{ uri: adv.photoUrl }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: "#E2E8F0",
                          borderWidth: 1.5,
                          borderColor: COLORS.primary,
                        }}
                      />
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#EEF2FF",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.primary }}>
                        {adv.name ? adv.name[0].toUpperCase() : "A"}
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={adminStyles.itemTitle}>{adv.name}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "600" }}>
                      {adv.employeeId || "No ID"} • {adv.designation || "Advisor"}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" }}>
                      ✉ {adv.email}
                    </Text>
                    {adv.mobile ? (
                      <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 1, fontWeight: "600" }}>
                        📱 {adv.mobile}
                      </Text>
                    ) : null}
                    <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4, fontWeight: "600" }}>
                      Total Visits: {adv.totalVisits ?? 0}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View
                      style={{
                        backgroundColor:
                          adv.status === "active" ? COLORS.successLight : COLORS.dangerLight,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: adv.status === "active" ? COLORS.success : COLORS.danger,
                        }}
                      >
                        {adv.status === "active" ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "col", gap: 6 }}>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 6,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: "#3B82F6",
                          backgroundColor: "#EFF6FF",
                        }}
                        onPress={() => handleOpenEditAdvisor(adv)}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#2563EB",
                          }}
                        >
                          ✏️ Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 6,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: adv.status === "active" ? COLORS.danger : COLORS.success,
                          backgroundColor: adv.status === "active" ? COLORS.dangerLight : COLORS.successLight,
                        }}
                        onPress={() => handleToggleAdvisorStatus(adv._id, adv.status)}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: adv.status === "active" ? COLORS.danger : COLORS.success,
                          }}
                        >
                          {adv.status === "active" ? "Deactivate" : "Activate"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 3: PROJECTS ================= */}
        {activeTab === "projects" && (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={adminStyles.sectionHeader}>
                Projects & Sites ({projects.length})
              </Text>
              <TouchableOpacity
                style={adminStyles.miniAddButton}
                onPress={() => setAddProjectModalVisible(true)}
              >
                <Text style={adminStyles.miniAddButtonText}>+ New Project</Text>
              </TouchableOpacity>
            </View>

            {projects.length === 0 ? (
              <View
                style={[
                  adminStyles.listItem,
                  { alignItems: "center", paddingVertical: 28 },
                ]}
              >
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🏗️</Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: COLORS.textPrimary,
                  }}
                >
                  No Projects Available
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    marginTop: 4,
                  }}
                >
                  Tap "+ New Project" above to create a project.
                </Text>
              </View>
            ) : (
              projects.map((proj) => (
                <View key={proj._id} style={adminStyles.listItem}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={adminStyles.itemTitle}>{proj.name}</Text>
                    <View
                      style={{
                        backgroundColor:
                          proj.status === "active"
                            ? COLORS.successLight
                            : COLORS.dangerLight,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color:
                            proj.status === "active"
                              ? COLORS.success
                              : COLORS.danger,
                        }}
                      >
                        {proj.status?.toUpperCase() || "ACTIVE"}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      color: COLORS.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    📍 {proj.location}
                  </Text>
                  {proj.description ? (
                    <Text
                      style={{
                        fontSize: 12,
                        color: COLORS.textLight,
                        marginTop: 4,
                      }}
                    >
                      {proj.description}
                    </Text>
                  ) : null}

                  {/* ACTION FOOTER */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: COLORS.border,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: "#EFF6FF",
                        borderWidth: 1,
                        borderColor: "#3B82F6",
                      }}
                      onPress={() => handleOpenEditProject(proj)}
                    >
                      <Text style={{ fontSize: 13, marginRight: 5 }}>✏️</Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: "#2563EB",
                        }}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: COLORS.dangerLight,
                        borderWidth: 1,
                        borderColor: COLORS.danger,
                      }}
                      onPress={() => handleDeleteProject(proj._id, proj.name)}
                    >
                      <Text style={{ fontSize: 13, marginRight: 5 }}>🗑️</Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: COLORS.danger,
                        }}
                      >
                        Delete Project
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= TAB 4: SITE VISITS ================= */}
        {activeTab === "visits" && (
          <View>
            <Text style={adminStyles.sectionHeader}>
              All Field Visits ({visits.length})
            </Text>

            {visits.map((visit, i) => (
              <TouchableOpacity
                key={visit._id || i}
                style={adminStyles.listItem}
                activeOpacity={0.85}
                onPress={() => setSelectedVisit(visit)}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={adminStyles.itemTitle}>
                    Customer Name : {visit.customerName || "Customer"}
                  </Text>
                  <View
                    style={{
                      backgroundColor:
                        visit.status === "cancelled" ? COLORS.dangerLight : COLORS.successLight,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: visit.status === "cancelled" ? COLORS.danger : COLORS.success,
                      }}
                    >
                      {visit.status === "cancelled" ? "CANCELLED" : "SUBMITTED"}
                    </Text>
                  </View>
                </View>

                {visit.customerMobile ? (
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontWeight: "500" }}>
                    📱Customer Mobile: {visit.customerMobile}
                  </Text>
                ) : null}
                {visit.customerAddress ? (
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontWeight: "500" }}>
                    📍Customer Address: {visit.customerAddress}
                  </Text>
                ) : null}
                {visit.seniorName ? (
                  <Text style={{ fontSize: 13, color: "#1E293B", fontWeight: "700", marginTop: 2 }}>
                    👔 Senior / TL: {visit.seniorName}
                  </Text>
                ) : null}

                <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "600", marginTop: 2 }}>
                  👤 Advisor: {visit.advisorId?.name || "N/A"} ({visit.advisorId?.employeeId || ""})
                </Text>

                {visit.projectId?.name ? (
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2, fontWeight: "500" }}>
                    🏗️ Project: {visit.projectId.name} ({visit.projectId.location || ""})
                  </Text>
                ) : null}

                {visit.locationAddress ? (
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2, fontWeight: "500" }}>
                    📍 Advisor Live Location: {visit.locationAddress}
                  </Text>
                ) : null}

                {visit.notes ? (
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: "500" }}>
                    📝 Notes: {visit.notes}
                  </Text>
                ) : null}

                {visit.photoUrl ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
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
                        height: 180,
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
                      }}
                    >
                      <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>
                        🔍 Tap to view photo
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      marginTop: 8,
                      padding: 8,
                      backgroundColor: "#F8FAFC",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      borderStyle: "dashed",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 11, color: COLORS.textLight }}>
                      📷 No photo attached
                    </Text>
                  </View>
                )}

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
                    {visit.visitedAt ? new Date(visit.visitedAt).toLocaleString("en-IN") : ""}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDeleteSiteVisit(visit._id || visit.id, visit.customerName);
                      }}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: COLORS.dangerLight,
                        borderWidth: 1,
                        borderColor: COLORS.danger,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.danger }}>
                        🗑️ Delete
                      </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: "700" }}>
                        View Details
                      </Text>
                      <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "800", marginLeft: 2 }}>
                        ›
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: ADD ADVISOR ================= */}
      <Modal
        visible={addAdvisorModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) {
            setAdvPhoto(null);
            setAddAdvisorModalVisible(false);
          }
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={adminStyles.modalHeader}>
            <Text style={adminStyles.modalTitle}>Add New Advisor</Text>
            <TouchableOpacity
              onPress={() => {
                if (!submitting) {
                  setAdvPhoto(null);
                  setAddAdvisorModalVisible(false);
                }
              }}
              disabled={submitting}
            >
              <Text style={{ fontSize: 28, color: COLORS.textPrimary }}>×</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* LIVE PHOTO SECTION (CAMERA ONLY - MANDATORY) */}
              <Text style={adminStyles.inputLabel}>Advisor Live Photo * (Camera Only)</Text>

              {advPhoto ? (
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: "#F8FAFC",
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: COLORS.success,
                    marginBottom: 10,
                  }}
                >
                  <Image
                    source={{ uri: advPhoto.uri }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "#E2E8F0",
                      marginBottom: 8,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: COLORS.successLight,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: COLORS.success,
                      }}
                    >
                      ✓ Live Photo Captured
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 8,
                      }}
                      onPress={captureAdvisorLivePhoto}
                      disabled={capturingPhoto || submitting}
                    >
                      <Text
                        style={{
                          color: COLORS.white,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        🔄 Retake Photo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        backgroundColor: COLORS.dangerLight,
                        borderWidth: 1,
                        borderColor: COLORS.danger,
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 8,
                      }}
                      onPress={() => setAdvPhoto(null)}
                      disabled={submitting}
                    >
                      <Text
                        style={{
                          color: COLORS.danger,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderWidth: 2,
                    borderColor: COLORS.primary,
                    borderStyle: "dashed",
                    borderRadius: 12,
                    padding: 22,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                  onPress={captureAdvisorLivePhoto}
                  disabled={capturingPhoto || submitting}
                >
                  {capturingPhoto ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Text style={{ fontSize: 36, marginBottom: 6 }}>📷</Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: COLORS.primary,
                        }}
                      >
                        Capture Live Photo
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: COLORS.textSecondary,
                          marginTop: 4,
                          textAlign: "center",
                        }}
                      >
                        Mandatory • Camera capture only (Gallery disabled)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text style={adminStyles.inputLabel}>Full Name *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="Advisor Name"
                placeholderTextColor={COLORS.muted}
                value={advName}
                onChangeText={setAdvName}
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Email Address *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="advisor@aryansbuildcon.com"
                placeholderTextColor={COLORS.muted}
                value={advEmail}
                onChangeText={setAdvEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.muted}
                value={advMobile}
                onChangeText={setAdvMobile}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Temporary Password (min 8 chars) *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.muted}
                value={advPassword}
                onChangeText={setAdvPassword}
                secureTextEntry
                editable={!submitting}
              />

              {/* CREATE ACCOUNT BUTTON WITH SINGLE-CLICK & CREATING STATE */}
              <TouchableOpacity
                style={[
                  adminStyles.submitBtn,
                  submitting && { opacity: 0.7, backgroundColor: "#64748B" },
                ]}
                onPress={handleCreateAdvisor}
                disabled={submitting}
              >
                {submitting ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color={COLORS.white}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={adminStyles.submitBtnText}>Creating Account...</Text>
                  </View>
                ) : (
                  <Text style={adminStyles.submitBtnText}>Create Advisor Account</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ================= MODAL: ADD PROJECT ================= */}
      <Modal
        visible={addProjectModalVisible}
        animationType="slide"
        onRequestClose={() => setAddProjectModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={adminStyles.modalHeader}>
            <Text style={adminStyles.modalTitle}>Add New Project</Text>
            <TouchableOpacity onPress={() => setAddProjectModalVisible(false)}>
              <Text style={{ fontSize: 28, color: COLORS.textPrimary }}>×</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={adminStyles.inputLabel}>Project Name *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="e.g. Aryans Golden Enclave"
                placeholderTextColor={COLORS.muted}
                value={projName}
                onChangeText={setProjName}
              />

              <Text style={adminStyles.inputLabel}>Location *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="e.g. Wardha Road, Nagpur"
                placeholderTextColor={COLORS.muted}
                value={projLocation}
                onChangeText={setProjLocation}
              />

              <Text style={adminStyles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[adminStyles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="Residential layout, amenities, plot dimensions..."
                placeholderTextColor={COLORS.muted}
                value={projDescription}
                onChangeText={setProjDescription}
                multiline
              />

              <TouchableOpacity
                style={[
                  adminStyles.submitBtn,
                  submitting && { opacity: 0.6 },
                ]}
                onPress={handleCreateProject}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={adminStyles.submitBtnText}>Create Project</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ================= MODAL: EDIT ADVISOR ================= */}
      <Modal
        visible={editAdvisorModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) {
            setEditAdvisorModalVisible(false);
          }
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={adminStyles.modalHeader}>
            <View>
              <Text style={adminStyles.modalTitle}>Edit Advisor Details</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Update advisor profile & contact information
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setEditAdvisorModalVisible(false)}
              disabled={submitting}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 20, color: COLORS.textSecondary, fontWeight: "bold" }}>×</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={adminStyles.inputLabel}>Full Name *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="Advisor Name"
                placeholderTextColor={COLORS.muted}
                value={editAdvName}
                onChangeText={setEditAdvName}
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Email Address *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="advisor@aryansbuildcon.com"
                placeholderTextColor={COLORS.muted}
                value={editAdvEmail}
                onChangeText={setEditAdvEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.muted}
                value={editAdvMobile}
                onChangeText={(v) => setEditAdvMobile(v.replace(/[^0-9]/g, ""))}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Designation</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="e.g. Senior Property Advisor"
                placeholderTextColor={COLORS.muted}
                value={editAdvDesignation}
                onChangeText={setEditAdvDesignation}
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Employee ID</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="e.g. ADV-102"
                placeholderTextColor={COLORS.muted}
                value={editAdvEmployeeId}
                onChangeText={setEditAdvEmployeeId}
                editable={!submitting}
              />

              <TouchableOpacity
                style={[
                  adminStyles.submitBtn,
                  submitting && { opacity: 0.6 },
                ]}
                onPress={handleUpdateAdvisor}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={adminStyles.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ================= MODAL: EDIT PROJECT ================= */}
      <Modal
        visible={editProjectModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) {
            setEditProjectModalVisible(false);
          }
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={adminStyles.modalHeader}>
            <View>
              <Text style={adminStyles.modalTitle}>Edit Project Details</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Update project name, site location, description & status
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setEditProjectModalVisible(false)}
              disabled={submitting}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 20, color: COLORS.textSecondary, fontWeight: "bold" }}>×</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={adminStyles.inputLabel}>Project Name *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="e.g. Aryans Meadows Phase 2"
                placeholderTextColor={COLORS.muted}
                value={editProjName}
                onChangeText={setEditProjName}
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Location *</Text>
              <TextInput
                style={adminStyles.input}
                placeholder="e.g. Wardha Road, Nagpur"
                placeholderTextColor={COLORS.muted}
                value={editProjLocation}
                onChangeText={setEditProjLocation}
                editable={!submitting}
              />

              <Text style={adminStyles.inputLabel}>Status</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setEditProjStatus("active")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    backgroundColor: editProjStatus === "active" ? COLORS.success : "#F1F5F9",
                    borderWidth: 1,
                    borderColor: editProjStatus === "active" ? COLORS.success : COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: editProjStatus === "active" ? COLORS.white : COLORS.textPrimary,
                    }}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setEditProjStatus("inactive")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    backgroundColor: editProjStatus === "inactive" ? COLORS.danger : "#F1F5F9",
                    borderWidth: 1,
                    borderColor: editProjStatus === "inactive" ? COLORS.danger : COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: editProjStatus === "inactive" ? COLORS.white : COLORS.textPrimary,
                    }}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={adminStyles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[adminStyles.input, { height: 90, textAlignVertical: "top" }]}
                placeholder="Residential layout, amenities, plot dimensions..."
                placeholderTextColor={COLORS.muted}
                value={editProjDescription}
                onChangeText={setEditProjDescription}
                multiline
                editable={!submitting}
              />

              <TouchableOpacity
                style={[
                  adminStyles.submitBtn,
                  submitting && { opacity: 0.6 },
                ]}
                onPress={handleUpdateProject}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={adminStyles.submitBtnText}>Save Project Changes</Text>
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

      {/* ================= ADMIN SITE VISIT DETAILS POPUP MODAL ================= */}
      <Modal
        visible={!!selectedVisit}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVisit(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
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
                  Field Visit Details
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Admin Verification View
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedVisit(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F1F5F9",
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 20, color: "#61666e", fontWeight: "700", marginTop: 4, marginBottom: 5 }}>
                  Site Visit Information
                </Text>
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
                    Captured Live Photo
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
                        height: 220,
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

              {/* Detailed Breakdown Card */}
              <View
                style={{
                  backgroundColor: "#F8FAFC",
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
                        color: "#1E293B",
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      👔 {selectedVisit.seniorName}
                    </Text>
                  </View>
                ) : null}

                {/* Advisor Information */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.textSecondary,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    Advisor Info:
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.primary,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    👤 {selectedVisit?.advisorId?.name || "N/A"}{" "}
                    {selectedVisit?.advisorId?.employeeId
                      ? `(${selectedVisit.advisorId.employeeId})`
                      : ""}
                  </Text>
                  {selectedVisit?.advisorId?.email ? (
                    <Text
                      style={{
                        fontSize: 15,
                        color: COLORS.textSecondary,
                        marginTop: 2,
                        fontWeight: "700",
                      }}
                    >
                      ✉️ {selectedVisit.advisorId.email}
                    </Text>
                  ) : null}
                  {selectedVisit?.advisorId?.mobile ? (
                    <Text
                      style={{
                        fontSize: 15,
                        color: COLORS.textSecondary,
                        marginTop: 2,
                        fontWeight: "700",
                      }}
                    >
                      📱 {selectedVisit.advisorId.mobile}
                    </Text>
                  ) : null}
                </View>

                {/* Project Information */}
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
                        color: COLORS.textPrimary,
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      🏗️ {selectedVisit.projectId.name}
                      {selectedVisit.projectId.location
                        ? ` • ${selectedVisit.projectId.location}`
                        : ""}
                    </Text>
                  </View>
                ) : null}

                {/* Advisor Site Visit Live Location */}
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

             

                {/* Visit Date & Time */}
                <View style={{ marginBottom: selectedVisit?.notes ? 12 : 0 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.textSecondary,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    Visit Timestamp
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

                {/* Notes */}
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
                      Field Notes / Client Feedback
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.textPrimary,
                        marginTop: 2,
                        fontWeight:"500",
                      }}
                    >
                      📝 {selectedVisit.notes}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons: Delete and Close */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => handleDeleteSiteVisit(selectedVisit._id || selectedVisit.id, selectedVisit.customerName)}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.dangerLight,
                    borderWidth: 1,
                    borderColor: COLORS.danger,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, marginRight: 6 }}>🗑️</Text>
                  <Text
                    style={{
                      color: COLORS.danger,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Delete Visit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedVisit(null)}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
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
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const adminStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.danger,
  },

  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 1,
    paddingVertical: 8,
  },

  tabItem: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: "transparent",
  },

  tabItemSelected: {
    backgroundColor: COLORS.primary,
  },

  tabItemText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  tabItemTextSelected: {
    color: COLORS.white,
  },

  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionButton: {
    width: "48%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  miniAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  miniAddButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 24,
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
