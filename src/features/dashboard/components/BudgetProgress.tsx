/**
 * Budget Progress Component
 * Shows budget category with progress bar
 */

import type { Budget } from "@/db";
import { useThemeStore } from "@/store";
import { formatRupiah } from "@/utils";
import { useTranslation } from "react-i18next";
import { Text as RNText, View as RNView, StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface BudgetProgressProps {
    budgets: Budget[];
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const progressBg = isDark ? "#374151" : "#E5E7EB";

    if (budgets.length === 0) {
        return (
            <RNView
                style={[
                    styles.card,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
            >
                <Text fontWeight="bold" color={textColor} mb="$3">
                    {t("dashboard.budget_monitoring")}
                </Text>
                <RNText style={[styles.emptyText, { color: subtextColor }]}>
                    {t("dashboard.no_budget_data")}
                </RNText>
            </RNView>
        );
    }

    return (
        <RNView
            style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
        >
            <Text fontWeight="bold" color={textColor} mb="$3">
                {t("dashboard.budget_monitoring")}
            </Text>
            <YStack gap="$4">
                {budgets.map((budget) => (
                    <BudgetItem
                        key={budget.category}
                        budget={budget}
                        textColor={textColor}
                        subtextColor={subtextColor}
                        progressBg={progressBg}
                    />
                ))}
            </YStack>
        </RNView>
    );
}

function BudgetItem({
    budget,
    textColor,
    subtextColor,
    progressBg,
}: {
    budget: Budget;
    textColor: string;
    subtextColor: string;
    progressBg: string;
}) {
    const percentage = budget.percentage || 0;
    const progressColor =
        percentage >= 100 ? "#EF4444" : percentage >= 80 ? "#F59E0B" : "#10B981";

    return (
        <YStack gap="$1">
            <XStack justify="space-between">
                <RNText style={[styles.categoryText, { color: textColor }]}>
                    {budget.category}
                </RNText>
                <RNText style={[styles.amountText, { color: subtextColor }]}>
                    {formatRupiah(budget.spent || 0)} /{" "}
                    {formatRupiah(budget.monthly_limit)}
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
        </YStack>
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
        textAlign: "center",
        paddingVertical: 16,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: "600",
    },
    amountText: {
        fontSize: 12,
    },
    progressBg: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
});
