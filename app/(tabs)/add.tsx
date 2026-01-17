/**
 * Add Transaction Screen
 */

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/db";
import { useAppStore, useThemeStore } from "@/store";
import { formatCurrencyInput, getCurrentDateString } from "@/utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

export default function AddTransactionScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const themeMode = useThemeStore((state) => state.mode);
    const { wallets, addTransaction } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const inputBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBorder = isDark ? "#374151" : "#E5E7EB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const placeholderColor = isDark ? "#6B7280" : "#9CA3AF";
    const labelColor = isDark ? "#9CA3AF" : "#6B7280";

    // Form state
    const [type, setType] = useState<"expense" | "income">("expense");
    const [date, setDate] = useState(getCurrentDateString());
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Makanan & Minuman");
    const [walletId, setWalletId] = useState(wallets[0]?.id || "WALLET-CASH");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories =
        type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    const handleSubmit = async () => {
        if (!amount) return;
        setIsSubmitting(true);

        try {
            const numericAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
            await addTransaction({
                date,
                type,
                category,
                amount: numericAmount,
                note: note || null,
                wallet_id: walletId,
            });

            // Reset and go back
            router.replace("/");
        } catch (error) {
            console.error("Error adding transaction:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <YStack flex={1} bg={bgColor}>
            <YStack pt={insets.top + 10} px="$4" pb="$4">
                <Text fontSize={20} fontWeight="bold" color={textColor}>
                    Tambah Transaksi
                </Text>
            </YStack>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                <YStack gap="$4">
                    {/* Type Toggle */}
                    <XStack bg={isDark ? "#1F1F1F" : "#E5E7EB"} p="$1" rounded="$4">
                        <Button
                            flex={1}
                            size="$3"
                            bg={type === "expense" ? "white" : "transparent"}
                            pressStyle={{ opacity: 0.8 }}
                            onPress={() => {
                                setType("expense");
                                setCategory(EXPENSE_CATEGORIES[0]);
                            }}
                        >
                            <Text
                                color={type === "expense" ? "#EF4444" : labelColor}
                                fontWeight="600"
                            >
                                Pengeluaran
                            </Text>
                        </Button>
                        <Button
                            flex={1}
                            size="$3"
                            bg={type === "income" ? "white" : "transparent"}
                            pressStyle={{ opacity: 0.8 }}
                            onPress={() => {
                                setType("income");
                                setCategory(INCOME_CATEGORIES[0]);
                            }}
                        >
                            <Text
                                color={type === "income" ? "#10B981" : labelColor}
                                fontWeight="600"
                            >
                                Pemasukan
                            </Text>
                        </Button>
                    </XStack>

                    {/* Date */}
                    <YStack>
                        <Text fontSize={12} color={labelColor} mb="$2">
                            Tanggal
                        </Text>
                        <RNView
                            style={[
                                styles.inputContainer,
                                { backgroundColor: inputBg, borderColor: inputBorder },
                            ]}
                        >
                            <TextInput
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={placeholderColor}
                                style={[styles.input, { color: textColor }]}
                            />
                        </RNView>
                    </YStack>

                    {/* Amount */}
                    <YStack>
                        <Text fontSize={12} color={labelColor} mb="$2">
                            Jumlah (Rp)
                        </Text>
                        <RNView
                            style={[
                                styles.inputContainer,
                                { backgroundColor: inputBg, borderColor: inputBorder },
                            ]}
                        >
                            <TextInput
                                value={amount}
                                onChangeText={(text) => setAmount(formatCurrencyInput(text))}
                                placeholder="0"
                                placeholderTextColor={placeholderColor}
                                keyboardType="numeric"
                                style={[styles.input, styles.amountInput, { color: textColor }]}
                            />
                        </RNView>
                    </YStack>

                    {/* Category */}
                    <YStack>
                        <Text fontSize={12} color={labelColor} mb="$2">
                            Kategori
                        </Text>
                        <XStack flexWrap="wrap" gap="$2">
                            {categories.map((cat) => (
                                <Button
                                    key={cat}
                                    size="$2"
                                    bg={
                                        category === cat
                                            ? type === "expense"
                                                ? "#FEE2E2"
                                                : "#D1FAE5"
                                            : isDark
                                                ? "#374151"
                                                : "#F3F4F6"
                                    }
                                    pressStyle={{ opacity: 0.8 }}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text
                                        fontSize={12}
                                        color={
                                            category === cat
                                                ? type === "expense"
                                                    ? "#EF4444"
                                                    : "#10B981"
                                                : labelColor
                                        }
                                    >
                                        {cat}
                                    </Text>
                                </Button>
                            ))}
                        </XStack>
                    </YStack>

                    {/* Wallet */}
                    <YStack>
                        <Text fontSize={12} color={labelColor} mb="$2">
                            Wallet
                        </Text>
                        <XStack flexWrap="wrap" gap="$2">
                            {wallets.map((wallet) => (
                                <Button
                                    key={wallet.id}
                                    size="$2"
                                    bg={
                                        walletId === wallet.id
                                            ? "#DBEAFE"
                                            : isDark
                                                ? "#374151"
                                                : "#F3F4F6"
                                    }
                                    pressStyle={{ opacity: 0.8 }}
                                    onPress={() => setWalletId(wallet.id)}
                                >
                                    <Text fontSize={16}>{wallet.icon}</Text>
                                    <Text
                                        fontSize={12}
                                        color={walletId === wallet.id ? "#3B82F6" : labelColor}
                                    >
                                        {wallet.name}
                                    </Text>
                                </Button>
                            ))}
                        </XStack>
                    </YStack>

                    {/* Note */}
                    <YStack>
                        <Text fontSize={12} color={labelColor} mb="$2">
                            Catatan
                        </Text>
                        <RNView
                            style={[
                                styles.inputContainer,
                                { backgroundColor: inputBg, borderColor: inputBorder },
                            ]}
                        >
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Opsional"
                                placeholderTextColor={placeholderColor}
                                style={[styles.input, { color: textColor }]}
                            />
                        </RNView>
                    </YStack>

                    {/* Submit Button */}
                    <Button
                        size="$5"
                        bg="#10B981"
                        pressStyle={{ opacity: 0.8 }}
                        disabled={isSubmitting || !amount}
                        opacity={isSubmitting || !amount ? 0.5 : 1}
                        onPress={handleSubmit}
                    >
                        <Text color="white" fontWeight="bold" fontSize={16}>
                            {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
                        </Text>
                    </Button>
                </YStack>
            </ScrollView>
        </YStack>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    input: {
        fontSize: 16,
        padding: 0,
    },
    amountInput: {
        fontSize: 20,
        fontWeight: "bold",
    },
});
