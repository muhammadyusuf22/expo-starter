/**
 * Transaction Item Component
 * Single transaction row with icon, category, date, amount
 */

import type { Transaction } from "@/db";
import { useAppStore, useThemeStore } from "@/store";
import { formatRupiah, formatShortDate } from "@/utils";
import { Link } from "expo-router";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View as RNView, StyleSheet, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Text, XStack, YStack } from "tamagui";

interface TransactionItemProps {
    transaction: Transaction;
    onPress?: () => void;
    onDelete?: () => void;
}

export function TransactionItem({
    transaction,
    onPress,
    onDelete,
}: TransactionItemProps) {
    const themeMode = useThemeStore((state) => state.mode);
    const wallets = useAppStore((state) => state.wallets);
    const wallet = wallets.find((w) => w.id === transaction.wallet_id);
    const walletName = wallet ? wallet.name : "Unknown Wallet";

    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";

    const isExpense = transaction.type === "expense";
    const iconBgColor = isExpense ? "#FEE2E2" : "#D1FAE5";
    const iconColor = isExpense ? "#EF4444" : "#10B981";
    const amountColor = isExpense ? "#EF4444" : "#10B981";
    const prefix = isExpense ? "-" : "+";

    const renderRightActions = (_progress: any, dragX: any) => {
        if (!onDelete) return null;
        return (
            <TouchableOpacity
                onPress={onDelete}
                style={{
                    backgroundColor: "#EF4444",
                    justifyContent: "center",
                    alignItems: "center",
                    width: 70,
                    height: "100%",
                }}
            >
                <Trash2 size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const Content = (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{ backgroundColor: isDark ? "#1F1F1F" : "#FFFFFF" }}
        >
            <XStack p="$3" justify="space-between" items="center">
                <XStack gap="$3" items="center" flex={1}>
                    <RNView style={[styles.icon, { backgroundColor: iconBgColor }]}>
                        {isExpense ? (
                            <ArrowUp size={18} color={iconColor} />
                        ) : (
                            <ArrowDown size={18} color={iconColor} />
                        )}
                    </RNView>

                    <YStack flex={1}>
                        <Text
                            fontWeight="bold"
                            fontSize={14}
                            color={textColor}
                            numberOfLines={1}
                        >
                            {transaction.category}
                        </Text>
                        <Text fontSize={12} color={subtextColor} numberOfLines={1}>
                            {formatShortDate(transaction.date)} • {walletName}
                            {transaction.note ? ` • ${transaction.note}` : ""}
                        </Text>
                    </YStack>
                </XStack>

                <Text fontWeight="bold" fontSize={14} color={amountColor}>
                    {prefix} {formatRupiah(transaction.amount)}
                </Text>
            </XStack>
        </TouchableOpacity>
    );

    if (onDelete) {
        return (
            <Swipeable renderRightActions={renderRightActions}>{Content}</Swipeable>
        );
    }
    return Content;
}

interface TransactionListProps {
    transactions: Transaction[];
    onItemPress?: (transaction: Transaction) => void;
    onItemDelete?: (transaction: Transaction) => void;
    emptyMessage?: string;
    onSeeAll?: () => void;
}

export function TransactionList({
    limit,
    scrollEnabled = true,
}: {
    limit?: number;
    scrollEnabled?: boolean;
}) {
    const { t } = useTranslation();
    const rawTransactions = useAppStore((state) => state.transactions);
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";

    // Filter and sort transactions if needed, based on the new props
    // For now, let's assume `transactions` is still passed or derived
    // This part of the logic is not fully provided in the diff, so I'll keep the original structure for now
    // but adapt to the new props.

    // Assuming `transactions` is now derived from `rawTransactions` and `limit`
    const transactions = limit
        ? rawTransactions.slice(0, limit)
        : rawTransactions;

    if (transactions.length === 0) {
        return (
            <RNView
                style={[
                    styles.card,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
            >
                <Text fontWeight="bold" color={textColor} mb="$3">
                    {t("transactions.recent")}
                </Text>
                <YStack items="center" py="$6">
                    <Text fontSize={40} mb="$2">
                        📋
                    </Text>
                    <Text color={subtextColor} fontSize={13}>
                        {t("transactions.no_transactions")}
                    </Text>
                </YStack>
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
            <XStack justify="space-between" items="center" mb="$3" px="$4">
                <Text fontSize={18} fontWeight="600" color="$color12">
                    {t("transactions.recent")}
                </Text>
                {limit && (
                    <Link href="/transactions" asChild>
                        <TouchableOpacity>
                            <Text fontSize={14} color="$blue10" fontWeight="500">
                                {t("transactions.see_all")}
                            </Text>
                        </TouchableOpacity>
                    </Link>
                )}
            </XStack>
            <YStack>
                {transactions.map((tx) => (
                    <TransactionItem
                        key={tx.id}
                        transaction={tx}
                    // onItemPress and onItemDelete are no longer directly passed to TransactionList
                    // but if they were, they would be passed down here.
                    // For now, I'll remove them as the diff implies a change in how TransactionList works.
                    // If the original intent was to keep them, this would need adjustment.
                    // onPress={() => onItemPress?.(tx)}
                    // onDelete={onItemDelete ? () => onItemDelete(tx) : undefined}
                    />
                ))}
            </YStack>
        </RNView>
    );
}

const styles = StyleSheet.create({
    card: {
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
