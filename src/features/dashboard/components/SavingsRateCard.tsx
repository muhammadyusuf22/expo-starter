/**
 * Savings Rate Card Component
 */

import { useThemeStore } from "@/store";
import { TrendingUp } from "lucide-react-native";
import { View as RNView, StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

interface SavingsRateCardProps {
    rate: number;
}

export function SavingsRateCard({ rate }: SavingsRateCardProps) {
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const iconBg = isDark ? "#1E3A5F" : "#DBEAFE";
    const iconColor = "#3B82F6";

    return (
        <RNView
            style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
        >
            <YStack>
                <Text
                    fontSize={11}
                    color={subtextColor}
                    fontWeight="bold"
                    textTransform="uppercase"
                >
                    Savings Rate
                </Text>
                <Text fontSize={20} fontWeight="bold" color={textColor}>
                    {rate}%
                </Text>
            </YStack>
            <RNView style={[styles.icon, { backgroundColor: iconBg }]}>
                <TrendingUp size={20} color={iconColor} />
            </RNView>
        </RNView>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
});
