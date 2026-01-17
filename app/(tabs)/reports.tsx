/**
 * Reports Screen (Placeholder)
 */

import { useThemeStore } from "@/store";
import { FileText } from "lucide-react-native";
import { Text as RNText, View as RNView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const themeMode = useThemeStore((state) => state.mode);

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const iconBg = isDark ? "#374151" : "#E5E7EB";

    return (
        <YStack flex={1} bg={bgColor} pt={insets.top + 10} px="$4">
            <Text fontSize={20} fontWeight="bold" color={textColor} mb="$4">
                Laporan Bulanan
            </Text>

            <YStack flex={1} items="center" justify="center">
                <RNView style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    <FileText size={36} color={subtextColor} />
                </RNView>
                <RNText style={[styles.emptyText, { color: subtextColor }]}>
                    Fitur laporan akan tersedia di versi berikutnya
                </RNText>
            </YStack>
        </YStack>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        marginTop: 16,
        fontSize: 14,
        textAlign: "center",
    },
});
