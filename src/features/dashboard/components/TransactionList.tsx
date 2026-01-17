/**
 * Transaction Item Component
 * Single transaction row with icon, category, date, amount
 */

import type { Transaction } from "@/db";
import { useThemeStore } from "@/store";
import { formatRupiah, formatShortDate } from "@/utils";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { View as RNView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface TransactionItemProps {
    transaction: Transaction;
    onPress?: () => void;
}

export function TransactionItem({
    transaction,
    onPress,
}: TransactionItemProps) {
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";

    const isExpense = transaction.type === "expense";
    const iconBgColor = isExpense ? "#FEE2E2" : "#D1FAE5";
    const iconColor = isExpense ? "#EF4444" : "#10B981";
    const amountColor = isExpense ? "#EF4444" : "#10B981";
    const prefix = isExpense ? "-" : "+";

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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
                            {formatShortDate(transaction.date)}
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
}

interface TransactionListProps {
    transactions: Transaction[];
    onItemPress?: (transaction: Transaction) => void;
    emptyMessage?: string;
    onSeeAll?: () => void;
}

export function TransactionList({
    transactions,
    onItemPress,
    emptyMessage,
    onSeeAll,
}: TransactionListProps) {
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";

    if (transactions.length === 0) {
        return (
            <RNView
                style={[
                    styles.card,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
            >
                <Text fontWeight="bold" color={textColor} mb="$3">
                    Transaksi Terakhir
                </Text>
                <YStack items="center" py="$6">
                    <Text fontSize={40} mb="$2">
                        📋
                    </Text>
                    <Text color={subtextColor} fontSize={13}>
                        {emptyMessage || "Tidak ada data"}
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
            <Text fontWeight="bold" color={textColor} mb="$2">
                Transaksi Terakhir
            </Text>
            <YStack>
                {transactions.map((tx) => (
                    <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        onPress={() => onItemPress?.(tx)}
                    />
                ))}
            </YStack>
            {onSeeAll && (
                <TouchableOpacity onPress={onSeeAll} style={{ marginTop: 12 }}>
                    <XStack justify="center" items="center" py="$2">
                        <Text color="#10B981" fontWeight="600" fontSize={13}>
                            Lihat Semua
                        </Text>
                    </XStack>
                </TouchableOpacity>
            )}
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
