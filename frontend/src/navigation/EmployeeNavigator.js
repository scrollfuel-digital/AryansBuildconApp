import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/employee/DashboardScreen";
import CreateReportScreen from "../screens/employee/CreateReportScreen";
import MyReportsScreen from "../screens/employee/MyReportsScreen";
import ReportDetailsScreen from "../screens/employee/ReportDetailsScreen";

const Stack = createNativeStackNavigator();

export default function EmployeeNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Dashboard"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
            />

            <Stack.Screen
                name="CreateReport"
                component={CreateReportScreen}
            />

            <Stack.Screen
                name="MyReports"
                component={MyReportsScreen}
            />

            <Stack.Screen
                name="ReportDetails"
                component={ReportDetailsScreen}
            />
        </Stack.Navigator>
    );
}