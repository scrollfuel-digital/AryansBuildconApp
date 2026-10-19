import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/Dashboard/DashboardScreen";
import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ onLogout, userRole = "advisor" }) {
    const isAdmin = userRole === "admin";

    return (
        <Stack.Navigator
            initialRouteName={isAdmin ? "AdminDashboard" : "AdvisorDashboard"}
            screenOptions={{
                headerShown: false,
            }}
        >
            {isAdmin ? (
                <Stack.Screen name="AdminDashboard">
                    {(props) => (
                        <AdminDashboardScreen
                            {...props}
                            onLogout={onLogout}
                        />
                    )}
                </Stack.Screen>
            ) : (
                <Stack.Screen name="AdvisorDashboard">
                    {(props) => (
                        <DashboardScreen
                            {...props}
                            onLogout={onLogout}
                        />
                    )}
                </Stack.Screen>
            )}
        </Stack.Navigator>
    );
}