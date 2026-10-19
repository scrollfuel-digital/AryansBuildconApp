
import { StyleSheet } from "react-native";
import COLORS from "../constants/colors";

export const styles = StyleSheet.create({

    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    content: {
        padding: 20,
        paddingBottom: 40,
    },

    /* HEADER */

    header: {
        marginTop: 20,
        marginBottom: 52,
    },

    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    welcomeText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },

    title: {
        fontSize: 30,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },

    profileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",

        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 4,
    },

    profileInitials: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "800",
    },

    /* SECTIONS */

    section: {
        marginBottom: 20,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginBottom: 12,
    },

    /* STATS */

    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    statCard: {
        width: "48%",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,

        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        elevation: 2,
    },

    statValue: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.primary,
    },

    statLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 5,
    },

    /* PRIMARY BUTTON */

    primaryButton: {
        backgroundColor: COLORS.primary,
        minHeight: 54,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,

        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 4,
    },

    primaryButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "800",
    },

    /* EMPLOYEE */

    employeeCard: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },

    employeeHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },

    avatarText: {
        color: COLORS.primary,
        fontSize: 17,
        fontWeight: "800",
    },

    employeeDetails: {
        flex: 1,
        marginLeft: 12,
    },

    employeeName: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    employeeRole: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 3,
    },

    statusBadge: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },

    statusText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: "800",
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 18,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },

    infoIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },

    infoContent: {
        flex: 1,
        marginLeft: 12,
    },

    infoLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        marginBottom: 3,
    },

    infoValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: "600",
    },

    /* PROFILE POPUP */

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.48)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    profilePopup: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 22,
    },

    popupHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    popupTitle: {
        fontSize: 21,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F1F4F2",
        alignItems: "center",
        justifyContent: "center",
    },

    closeButtonText: {
        fontSize: 28,
        lineHeight: 30,
        color: COLORS.textPrimary,
        fontWeight: "400",
    },

    popupAvatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginTop: 20,
    },

    popupAvatarText: {
        color: COLORS.white,
        fontSize: 25,
        fontWeight: "800",
    },

    popupName: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginTop: 12,
    },

    popupRole: {
        textAlign: "center",
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },

    profileInfo: {
        marginTop: 22,
    },

    profileInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 12,
    },

    profileInfoLabel: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },

    profileInfoValue: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: "700",
        maxWidth: "60%",
        textAlign: "right",
    },

    /* FORM */

    formScreen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    formHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    formTitle: {
        fontSize: 21,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    formContent: {
        padding: 20,
        paddingBottom: 50,
    },

    formSectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginTop: 8,
        marginBottom: 12,
    },

    /* PHOTO */

    photoButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 22,
    },

    photoButton: {
        width: "48%",
        minHeight: 105,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    photoButtonIcon: {
        fontSize: 28,
        marginBottom: 7,
    },

    photoButtonText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: "800",
    },

    photoPreviewContainer: {
        marginBottom: 22,
    },

    photoPreview: {
        width: "100%",
        height: 210,
        borderRadius: 16,
        backgroundColor: "#E9EEEB",
    },

    removePhotoButton: {
        marginTop: 8,
        alignSelf: "flex-end",
    },

    removePhotoText: {
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: "700",
    },

    /* INPUTS */

    inputGroup: {
        marginBottom: 15,
    },

    inputLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 7,
    },

    input: {
        height: 52,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 13,
        paddingHorizontal: 15,
        color: COLORS.textPrimary,
        fontSize: 14,
    },

    /* LOCATION / TIME */

    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 15,
        padding: 14,
        marginBottom: 12,
    },

    infoBoxIcon: {
        fontSize: 23,
        marginRight: 12,
    },

    infoBoxLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        marginBottom: 4,
    },

    infoBoxValue: {
        fontSize: 13,
        color: COLORS.textPrimary,
        fontWeight: "600",
    },

    locationCaptured: {
        color: COLORS.success,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "600",
    },

    locationNotCaptured: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },

    locationButton: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 10,
        paddingHorizontal: 11,
        paddingVertical: 9,
    },

    locationButtonText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: "800",
    },

    /* SUBMIT */

    submitButton: {
        backgroundColor: COLORS.primary,
        height: 55,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },

    submitButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "800",
    },

    disabledButton: {
        opacity: 0.6,
    },
});
