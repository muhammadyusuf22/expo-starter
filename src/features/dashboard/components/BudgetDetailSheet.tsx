/**
 * Budget Detail Sheet
 * Shows detailed breakdown of budget per category
 */

import type { Budget } from "@/db";
import { useThemeStore } from "@/store";
import { formatRupiah } from "@/utils";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text as RNText, View as RNView, StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface BudgetDetailSheetProps {
    budgets: Budget[];
}

export const BudgetDetailSheet = forwardRef<
    BottomSheet,
    BudgetDetailSheetProps
>(({ budgets }, ref) => {
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);
    const snapPoints = useMemo(() => ["50%", "90%"], []);

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#1F1F1F" : "#FFFFFF";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const progressBg = isDark ? "#374151" : "#E5E7EB";

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        [],
    );

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: bgColor }}
            handleIndicatorStyle={{ backgroundColor: subtextColor }}
        >
            <BottomSheetScrollView style={{ padding: 20 }}>
                <Text fontSize={18} fontWeight="bold" color={textColor} mb="$4">
                    {t("dashboard.budget_status")}
                </Text>

                {budgets.length === 0 ? (
                    <Text color={subtextColor} style={{ textAlign: "center" }} mt="$4">
                        {t("dashboard.no_budget_data")}
                    </Text>
                ) : (
                    <YStack gap="$4" pb="$8">
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
                )}
            </BottomSheetScrollView>
        </BottomSheet>
    );
});

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
    const { t } = useTranslation();
    const percentage = budget.percentage || 0;
    const progressColor =
        percentage >= 100 ? "#EF4444" : percentage >= 80 ? "#F59E0B" : "#10B981";

    // Ensure safe access to spent and monthly_limit
    const spent = budget.spent || 0;
    const limit = budget.monthly_limit || 0;

    return (
        <YStack gap="$1">
            <XStack justify="space-between">
                <RNText style={[styles.categoryText, { color: textColor }]}>
                    {budget.category}
                </RNText>
                <RNText style={[styles.amountText, { color: subtextColor }]}>
                    {formatRupiah(spent)} / {formatRupiah(limit)}
                </RNText>
            </XStack>
            <RNView style={[styles.progressBg, { backgroundColor: progressBg }]}>
                <RNView
                    style={[
                        styles.progressFill,
                        {
                            backgroundColor: progressColor,
                            width: `${Math.min(percentage, 100)}%`,
                        },
                    ]}
                />
            </RNView>
            <XStack justify="space-between">
                <Text fontSize={10} color={subtextColor as any}>
                    {percentage.toFixed(0)}%
                </Text>
                <Text
                    fontSize={10}
                    color={(percentage >= 100 ? "#EF4444" : subtextColor) as any}
                >
                    {spent > limit
                        ? t("dashboard.over_budget")
                        : t("dashboard.budget_remaining", {
                            amount: formatRupiah(limit - spent),
                        })}
                </Text>
            </XStack>
        </YStack>
    );
}

// Helper to access t outside component if needed, but passing t is better.
// Actually BudgetItem needs t, let's just create a wrapper or pass translated strings.
// For simplicity I'll use text literals or pass t. But wait, BudgetItem is outside component scope.
// I will move BudgetItem inside or pass `t` helper.

// Let's rely on the parent to pass translated strings? No, too messy.
// I'll import hook inside BudgetItem or just move it inside.
// Moving inside BudgetDetailSheet is fine but might re-create function.
// Better: keep it outside and use useTranslation inside it.

// Re-writing BudgetItem to include useTranslation
// But wait, hooks inside loop? No, BudgetItem is a component.
// It's safe to use hook inside BudgetItem component.

const styles = StyleSheet.create({
    categoryText: {
        fontSize: 14,
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
