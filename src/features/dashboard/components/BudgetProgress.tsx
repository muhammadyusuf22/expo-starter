/**
 * Budget Progress Component
 * Shows budget category with progress bar
 */

import type { Budget } from "@/db";
import { useThemeStore } from "@/store";
import { formatRupiah } from "@/utils";
import { useTranslation } from "react-i18next";
import {
    Text as RNText,
    View as RNView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface BudgetProgressProps {
    budgets: Budget[];
    onPress?: () => void;
}

export function BudgetProgress({ budgets, onPress }: BudgetProgressProps) {
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const progressBg = isDark ? "#374151" : "#E5E7EB";

    // Calculate total progress
    const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
    const totalLimit = budgets.reduce(
        (acc, b) => acc + (b.monthly_limit || 0),
        0,
    );
    const percentage =
        totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

    const progressColor =
        percentage >= 100 ? "#EF4444" : percentage >= 80 ? "#F59E0B" : "#10B981";

    // Wrap in TouchableOpacity logic manually since we are using RNView for card
    // Or just check if onPress exists
    const Container = onPress ? TouchableOpacity : RNView;
    const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

    if (totalLimit === 0) {
        return (
            <Container
                {...containerProps}
                style={[
                    styles.card,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
            >
                <Text fontWeight="bold" color={textColor} mb="$2">
                    {t("dashboard.budget_status")}
                </Text>
                <RNText style={[styles.emptyText, { color: subtextColor }]}>
                    {t("dashboard.no_budget_data")}
                </RNText>
            </Container>
        );
    }

    return (
        <Container
            {...containerProps}
            style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
        >
            <XStack justify="space-between" items="center" mb="$2">
                <Text fontWeight="bold" color={textColor}>
                    {t("dashboard.budget_status")}
                </Text>
                <XStack items="center" gap="$2">
                    {/* Optional: Add a chevron or icon to indicate clickable */}
                    <Text fontSize={12} fontWeight="600" color={progressColor}>
                        {percentage.toFixed(0)}%
                    </Text>
                </XStack>
            </XStack>

            <YStack gap="$2">
                <XStack justify="space-between">
                    <RNText style={[styles.amountLabel, { color: subtextColor }]}>
                        {t("dashboard.spent")}
                    </RNText>
                    <RNText style={[styles.amountText, { color: textColor }]}>
                        {formatRupiah(totalSpent)}{" "}
                        <RNText style={{ color: subtextColor }}>
                            / {formatRupiah(totalLimit)}
                        </RNText>
                    </RNText>
                </XStack>

                <RNView style={[styles.progressBg, { backgroundColor: progressBg }]}>
                    <RNView
                        style={[
                            styles.progressFill,
                            { backgroundColor: progressColor, width: `${percentage}%` },
                        ]}
                    />
                </RNView>

                <Text fontSize={11} color={subtextColor} mt="$1">
                    {totalSpent > totalLimit
                        ? t("dashboard.over_budget")
                        : t("dashboard.budget_remaining", {
                            amount: formatRupiah(totalLimit - totalSpent),
                        })}
                </Text>
            </YStack>
        </Container>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    emptyText: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    amountLabel: {
        fontSize: 12,
    },
    amountText: {
        fontSize: 13,
        fontWeight: "600",
    },
    progressBg: {
        height: 10,
        borderRadius: 5,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 5,
    },
});
