import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import AuthNavigator from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";
import { advisorLogout } from "./src/services/advisorService";
import { adminLogout } from "./src/services/adminService";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("advisor");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const clearSessionOnAppStart = async () => {
      try {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("userRole");
      } catch (error) {
        console.log("Error clearing session on start:", error);
      } finally {
        setIsLoggedIn(false);
        setCheckingAuth(false);
      }
    };

    clearSessionOnAppStart();
  }, []);

  const handleLogin = async (user, token) => {
    const role = user?.role || "advisor";
    try {
      if (token) {
        await SecureStore.setItemAsync("authToken", token);
      }
      await SecureStore.setItemAsync("userRole", role);
    } catch (e) {
      console.log("Error persisting auth session:", e);
    }
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      if (userRole === "admin") {
        await adminLogout();
      } else {
        await advisorLogout();
      }
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      try {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("userRole");
      } catch (e) {}
      setIsLoggedIn(false);
      setUserRole("advisor");
    }
  };

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007949" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isLoggedIn ? (
          <AppNavigator onLogout={handleLogout} userRole={userRole} />
        ) : (
          <AuthNavigator onLogin={handleLogin} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}