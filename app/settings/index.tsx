/**
 * Settings Screen
 */

import { useThemeStore } from "@/store";
import { useRouter } from "expo-router";
import {
    ChevronRight,
    Info,
    Moon,
    PieChart,
    Sun,
    Wallet,
} from "lucide-react-native";
import {
    Switch as RNSwitch,
    View as RNView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { mode, toggleMode } = useThemeStore();

    const isDark = mode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const sectionBg = isDark ? "#374151" : "#F3F4F6";

    return (
        <YStack flex={1} bg={bgColor}>
            {/* Header */}
            <YStack pt={insets.top + 10} px="$4" pb="$4">
                <Text fontSize={20} fontWeight="bold" color={textColor}>
                    Pengaturan
                </Text>
            </YStack>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                <YStack gap="$4">
                    {/* Appearance Section */}
                    <RNView
                        style={[
                            styles.card,
                            { backgroundColor: cardBg, borderColor: cardBorder },
                        ]}
                    >
                        <RNView
                            style={[styles.sectionHeader, { backgroundColor: sectionBg }]}
                        >
                            <Text
                                fontSize={12}
                                fontWeight="bold"
                                color={subtextColor}
                                textTransform="uppercase"
                            >
                                Tampilan
                            </Text>
                        </RNView>

                        <XStack p="$4" justify="space-between" items="center">
                            <XStack gap="$3" items="center">
                                <RNView
                                    style={[
                                        styles.iconBtn,
                                        { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
                                    ]}
                                >
                                    {isDark ? (
                                        <Moon size={20} color="#FBBF24" />
                                    ) : (
                                        <Sun size={20} color="#F59E0B" />
                                    )}
                                </RNView>
                                <YStack>
                                    <Text fontWeight="bold" color={textColor}>
                                        Mode Gelap
                                    </Text>
                                    <Text fontSize={12} color={subtextColor}>
                                        {isDark ? "Aktif" : "Nonaktif"}
                                    </Text>
                                </YStack>
                            </XStack>
                            <RNSwitch
                                value={isDark}
                                onValueChange={toggleMode}
                                trackColor={{ false: "#D1D5DB", true: "#10B981" }}
                                thumbColor="white"
                            />
                        </XStack>
                    </RNView>

                    {/* Finance Section */}
                    <RNView
                        style={[
                            styles.card,
                            { backgroundColor: cardBg, borderColor: cardBorder },
                        ]}
                    >
                        <RNView
                            style={[styles.sectionHeader, { backgroundColor: sectionBg }]}
                        >
                            <Text
                                fontSize={12}
                                fontWeight="bold"
                                color={subtextColor}
                                textTransform="uppercase"
                            >
                                Keuangan
                            </Text>
                        </RNView>

                        <TouchableOpacity
                            onPress={() => router.push("/settings/budget" as any)}
                            activeOpacity={0.7}
                        >
                            <XStack p="$4" justify="space-between" items="center">
                                <XStack gap="$3" items="center">
                                    <RNView
                                        style={[styles.iconBtn, { backgroundColor: "#D1FAE5" }]}
                                    >
                                        <PieChart size={20} color="#10B981" />
                                    </RNView>
                                    <YStack>
                                        <Text fontWeight="bold" color={textColor}>
                                            Atur Budget
                                        </Text>
                                        <Text fontSize={12} color={subtextColor}>
                                            Kelola batasan bulanan
                                        </Text>
                                    </YStack>
                                </XStack>
                                <ChevronRight size={18} color={subtextColor} />
                            </XStack>
                        </TouchableOpacity>

                        <RNView style={[styles.divider, { backgroundColor: cardBorder }]} />

                        <TouchableOpacity
                            onPress={() => router.push("/(tabs)/wallets" as any)}
                            activeOpacity={0.7}
                        >
                            <XStack p="$4" justify="space-between" items="center">
                                <XStack gap="$3" items="center">
                                    <RNView
                                        style={[styles.iconBtn, { backgroundColor: "#DBEAFE" }]}
                                    >
                                        <Wallet size={20} color="#3B82F6" />
                                    </RNView>
                                    <YStack>
                                        <Text fontWeight="bold" color={textColor}>
                                            Daftar Wallet
                                        </Text>
                                        <Text fontSize={12} color={subtextColor}>
                                            Cash, Bank, E-Wallet
                                        </Text>
                                    </YStack>
                                </XStack>
                                <ChevronRight size={18} color={subtextColor} />
                            </XStack>
                        </TouchableOpacity>
                    </RNView>

                    {/* About Section */}
                    <RNView
                        style={[
                            styles.card,
                            { backgroundColor: cardBg, borderColor: cardBorder },
                        ]}
                    >
                        <RNView
                            style={[styles.sectionHeader, { backgroundColor: sectionBg }]}
                        >
                            <Text
                                fontSize={12}
                                fontWeight="bold"
                                color={subtextColor}
                                textTransform="uppercase"
                            >
                                Lainnya
                            </Text>
                        </RNView>

                        <XStack p="$4" justify="space-between" items="center">
                            <XStack gap="$3" items="center">
                                <RNView
                                    style={[styles.iconBtn, { backgroundColor: sectionBg }]}
                                >
                                    <Info size={20} color={subtextColor} />
                                </RNView>
                                <YStack>
                                    <XStack gap="$2" items="center">
                                        <Text fontWeight="bold" color={textColor}>
                                            Tentang
                                        </Text>
                                        <RNView style={styles.versionBadge}>
                                            <Text fontSize={9} color="#059669">
                                                v1.0
                                            </Text>
                                        </RNView>
                                    </XStack>
                                    <Text fontSize={12} color={subtextColor}>
                                        Spenduit Mobile
                                    </Text>
                                </YStack>
                            </XStack>
                        </XStack>
                    </RNView>
                </YStack>
            </ScrollView>
        </YStack>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
    },
    sectionHeader: {
        padding: 12,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    divider: {
        height: 1,
    },
    versionBadge: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
});
