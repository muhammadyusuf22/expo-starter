import "@/i18n"; // Initialize i18n
import { useThemeStore } from "@/store";
import { Tabs } from "expo-router";
import { FileText, Home, Plus, Target, Wallet } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function TabLayout() {
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#FFFFFF";
    const activeColor = "#10B981";
    const inactiveColor = isDark ? "#6B7280" : "#9CA3AF";
    const fabColor = "#10B981";

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: bgColor,
                    borderTopColor: isDark ? "#1F1F1F" : "#E5E7EB",
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: inactiveColor,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "500",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t("tabs.homes"),
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="goals"
                options={{
                    title: t("tabs.goals"),
                    tabBarIcon: ({ color, focused }) => (
                        <Target size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: t("tabs.add"),
                    tabBarLabel: "",
                    tabBarIcon: () => (
                        <View
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: fabColor,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 20,
                                shadowColor: fabColor,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <Plus size={24} color="white" strokeWidth={2.5} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="wallets"
                options={{
                    title: t("tabs.wallets"),
                    tabBarIcon: ({ color, focused }) => (
                        <Wallet size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: t("tabs.reports"),
                    tabBarIcon: ({ color, focused }) => (
                        <FileText size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    ),
                }}
            />
        </Tabs>
    );
}
