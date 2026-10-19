import { StyleSheet } from "react-native";
import COLORS from "../constants/colors";

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    scrollContent: {
        paddingBottom: 24,
    },

    hero: {
        alignItems: "center",
        paddingTop: 42,
        paddingHorizontal: 20,
        paddingBottom: 25,
    },

    title: {
        fontSize: 30,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 8,
    },

    subtitle: {
        textAlign: "center",
        fontSize: 16,
        lineHeight: 25,
        color: COLORS.text,
    },

    formCard: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 16,
        backgroundColor: COLORS.white,

        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 10,

        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 2,
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 7,
        marginTop: 7,
    },

    fieldHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    verifiedText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: "600",
    },

    inputWrapper: {
        minHeight: 58,
        borderRadius: 10,

        backgroundColor: COLORS.lightGreen,

        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: 14,

        borderWidth: 1.5,
        borderColor: "transparent",
    },

    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 17,
        paddingVertical: 0,
    },

    successIcon: {
        fontSize: 22,
        color: COLORS.primary,
        fontWeight: "700",
    },

    countryCode: {
        flexDirection: "row",
        alignItems: "center",

        backgroundColor: "#DFEBE5",

        borderRadius: 6,

        paddingHorizontal: 7,
        paddingVertical: 5,

        marginRight: 8,
    },

    flag: {
        fontSize: 16,
        marginRight: 4,
    },

    countryText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: "600",
    },

    mobileInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 17,
        paddingVertical: 0,
        letterSpacing: 0.5,
    },

    eyeIcon: {
        color: COLORS.muted,
        fontSize: 22,
        paddingLeft: 8,
    },

    /* =========================
       PASSWORD STRENGTH
    ========================= */

    passwordStrength: {
        backgroundColor: COLORS.lightGreen,

        borderRadius: 10,

        padding: 11,

        marginTop: 9,
        marginBottom: 5,

        borderWidth: 1.5,
    },

    strengthHeader: {
        flexDirection: "row",
        justifyContent: "space-between",

        marginBottom: 9,
    },

    strengthLabel: {
        fontSize: 13,
        color: COLORS.text,
    },

    strengthValue: {
        fontSize: 13,
        fontWeight: "700",
    },

    strengthBars: {
        flexDirection: "row",

        gap: 7,

        marginBottom: 10,
    },

    strengthBar: {
        flex: 1,

        height: 7,

        borderRadius: 5,

        backgroundColor: COLORS.border,
    },

    rulesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },

    rule: {
        flexDirection: "row",
        alignItems: "center",

        backgroundColor: "#E3ECE7",

        borderRadius: 15,

        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    ruleActive: {
        backgroundColor: "#A8F0C7",
    },

    ruleCheck: {
        color: COLORS.muted,

        fontSize: 11,

        marginRight: 4,
    },

    ruleCheckActive: {
        color: COLORS.primary,
    },

    ruleText: {
        color: COLORS.secondaryText,
        fontSize: 11,
    },

    ruleTextActive: {
        color: COLORS.primaryDark,
    },

    /* =========================
       PASSWORD MATCH
    ========================= */

    matchedText: {
        color: COLORS.primary,

        fontSize: 13,

        fontWeight: "700",

        alignSelf: "flex-end",

        marginTop: 8,
        marginBottom: 2,
    },

    passwordError: {
        color: COLORS.danger,

        fontSize: 13,

        fontWeight: "600",

        alignSelf: "flex-end",

        marginTop: 8,
        marginBottom: 2,
    },

    /* =========================
       TERMS
    ========================= */

    termsRow: {
        flexDirection: "row",
        alignItems: "flex-start",

        marginTop: 18,
        marginBottom: 18,
    },

    checkbox: {
        width: 27,
        height: 27,

        borderRadius: 5,

        borderWidth: 1,
        borderColor: COLORS.border,

        marginRight: 10,

        justifyContent: "center",
        alignItems: "center",
    },

    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },

    checkmark: {
        color: COLORS.white,

        fontSize: 18,

        fontWeight: "800",
    },

    termsText: {
        flex: 1,

        color: COLORS.text,

        fontSize: 14,

        lineHeight: 21,
    },

    termsLink: {
        color: COLORS.primary,
        fontWeight: "700",
    },

    /* =========================
       CREATE BUTTON
    ========================= */

    createButton: {
        height: 55,

        borderRadius: 9,

        backgroundColor: COLORS.primary,

        flexDirection: "row",

        justifyContent: "center",
        alignItems: "center",

        shadowColor: COLORS.primaryDark,

        shadowOpacity: 0.15,

        shadowRadius: 7,

        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 3,
    },

    createButtonDisabled: {
        opacity: 0.65,
    },

    createButtonText: {
        color: COLORS.white,

        fontSize: 17,

        fontWeight: "800",
    },

    createArrow: {
        color: COLORS.white,

        fontSize: 27,

        marginLeft: 12,
    },

    /* =========================
       LOGIN
    ========================= */

    loginRow: {
        flexDirection: "row",

        justifyContent: "center",
        alignItems: "center",

        marginTop: 20,
    },

    loginText: {
        color: COLORS.text,
        fontSize: 16,
    },

    loginLink: {
        color: COLORS.primaryDark,

        fontSize: 16,

        fontWeight: "800",
    },
});
