import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/auth/WelcomeScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import VerifyOTPScreen from "../screens/auth/VerifyOTPScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ onLogin }) {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="Welcome"
                component={WelcomeScreen}
            />

            <Stack.Screen
                name="Signup"
                component={SignupScreen}
            />

            <Stack.Screen
                name="VerifyOTP"
                component={VerifyOTPScreen}
            />

            <Stack.Screen name="Login">
                {(props) => (
                    <LoginScreen
                        {...props}
                        onLogin={onLogin}
                    />
                )}
            </Stack.Screen>

            <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
            />
        </Stack.Navigator>
    );
}