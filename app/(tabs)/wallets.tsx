/**
 * Wallets Screen
 */

import { useAppStore, useThemeStore } from "@/store";
import { formatCurrencyInput, formatRupiah } from "@/utils";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

export default function WalletsScreen() {
    const insets = useSafeAreaInsets();
    const themeMode = useThemeStore((state) => state.mode);
    const { isLoading, wallets, addWallet, transferBetweenWallets } =
        useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const inputBg = isDark ? "#374151" : "#F3F4F6";

    // Bottom sheet refs
    const addSheetRef = useRef<BottomSheet>(null);
    const transferSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["70%", "90%"], []);

    // Form state
    const [walletName, setWalletName] = useState("");
    const [walletType, setWalletType] = useState<
        "cash" | "bank" | "ewallet" | "other"
    >("bank");
    const [walletBalance, setWalletBalance] = useState("");

    const [transferFrom, setTransferFrom] = useState("");
    const [transferTo, setTransferTo] = useState("");
    const [transferAmount, setTransferAmount] = useState("");

    // Calculate net worth
    const netWorth = wallets.reduce(
        (sum, w) => sum + (w.current_balance || 0),
        0,
    );

    const handleAddWallet = async () => {
        if (!walletName) return;
        await addWallet({
            name: walletName,
            type: walletType,
            initial_balance: parseInt(walletBalance.replace(/\D/g, ""), 10) || 0,
            icon:
                walletType === "cash"
                    ? "💵"
                    : walletType === "bank"
                        ? "🏦"
                        : walletType === "ewallet"
                            ? "📱"
                            : "💰",
            color: "#10B981",
        });
        addSheetRef.current?.close();
        setWalletName("");
        setWalletBalance("");
    };

    const handleTransfer = async () => {
        if (
            !transferFrom ||
            !transferTo ||
            !transferAmount ||
            transferFrom === transferTo
        )
            return;
        const amount = parseInt(transferAmount.replace(/\D/g, ""), 10);
        await transferBetweenWallets(
            transferFrom,
            transferTo,
            amount,
            "Transfer antar wallet",
        );
        transferSheetRef.current?.close();
        setTransferAmount("");
    };

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

    if (isLoading) {
        return (
            <YStack flex={1} bg={bgColor} items="center" justify="center">
                <Spinner size="large" color="#3B82F6" />
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg={bgColor}>
            {/* Header */}
            <YStack pt={insets.top + 10} px="$4" pb="$4">
                <XStack justify="space-between" items="center">
                    <Text fontSize={20} fontWeight="bold" color={textColor}>
                        Dompet Saya
                    </Text>
                    <Button
                        size="$3"
                        bg="#3B82F6"
                        pressStyle={{ opacity: 0.8 }}
                        onPress={() => addSheetRef.current?.expand()}
                    >
                        <Plus size={16} color="white" />
                        <Text color="white" fontSize={13} fontWeight="600">
                            Tambah
                        </Text>
                    </Button>
                </XStack>
            </YStack>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                <YStack gap="$4">
                    {/* Net Worth Card */}
                    <RNView style={styles.netWorthCard}>
                        <LinearGradient
                            colors={["#3B82F6", "#06B6D4"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.netWorthGradient}
                        >
                            <Text color="rgba(255,255,255,0.8)" fontSize={12}>
                                Total Kekayaan Bersih
                            </Text>
                            <Text color="white" fontSize={28} fontWeight="bold">
                                {formatRupiah(netWorth)}
                            </Text>
                        </LinearGradient>
                    </RNView>

                    {/* Wallet List */}
                    {wallets.map((wallet) => (
                        <RNView
                            key={wallet.id}
                            style={[
                                styles.walletCard,
                                { backgroundColor: cardBg, borderColor: cardBorder },
                            ]}
                        >
                            <XStack gap="$3" items="center" flex={1}>
                                <Text fontSize={28}>{wallet.icon}</Text>
                                <YStack flex={1}>
                                    <Text fontWeight="bold" color={textColor}>
                                        {wallet.name}
                                    </Text>
                                    <Text
                                        fontSize={12}
                                        color={subtextColor}
                                        textTransform="capitalize"
                                    >
                                        {wallet.type}
                                    </Text>
                                </YStack>
                            </XStack>
                            <XStack items="center" gap="$2">
                                <Text
                                    fontWeight="bold"
                                    color={
                                        (wallet.current_balance || 0) >= 0 ? "#10B981" : "#EF4444"
                                    }
                                >
                                    {formatRupiah(wallet.current_balance || 0)}
                                </Text>
                                <ChevronRight size={14} color="#9CA3AF" />
                            </XStack>
                        </RNView>
                    ))}

                    {/* Transfer Button */}
                    <Button
                        size="$4"
                        bg="transparent"
                        borderWidth={2}
                        borderColor={cardBorder}
                        borderStyle="dashed"
                        pressStyle={{ opacity: 0.8 }}
                        onPress={() => {
                            setTransferFrom(wallets[0]?.id || "");
                            setTransferTo(wallets[1]?.id || wallets[0]?.id || "");
                            transferSheetRef.current?.expand();
                        }}
                    >
                        <ArrowLeftRight size={16} color={subtextColor} />
                        <Text color={subtextColor} fontWeight="600">
                            Transfer Antar Wallet
                        </Text>
                    </Button>
                </YStack>
            </ScrollView>

            {/* Add Wallet Bottom Sheet */}
            <BottomSheet
                ref={addSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
            >
                <BottomSheetScrollView style={{ padding: 20 }}>
                    <Text fontSize={18} fontWeight="bold" color={textColor} mb="$4">
                        Tambah Wallet
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Nama Wallet
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={walletName}
                                    onChangeText={setWalletName}
                                    placeholder="Contoh: BCA"
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Tipe
                            </Text>
                            <XStack gap="$2" flexWrap="wrap">
                                {(["bank", "ewallet", "cash", "other"] as const).map((t) => (
                                    <Button
                                        key={t}
                                        size="$2"
                                        bg={walletType === t ? "#DBEAFE" : inputBg}
                                        onPress={() => setWalletType(t)}
                                    >
                                        <Text
                                            fontSize={12}
                                            color={walletType === t ? "#3B82F6" : subtextColor}
                                            textTransform="capitalize"
                                        >
                                            {t}
                                        </Text>
                                    </Button>
                                ))}
                            </XStack>
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Saldo Awal (Rp)
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={walletBalance}
                                    onChangeText={(t) => setWalletBalance(formatCurrencyInput(t))}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <Button
                            bg="#3B82F6"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={handleAddWallet}
                        >
                            <Text color="white" fontWeight="bold">
                                Simpan Wallet
                            </Text>
                        </Button>
                    </YStack>
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Transfer Bottom Sheet */}
            <BottomSheet
                ref={transferSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
            >
                <BottomSheetScrollView style={{ padding: 20 }}>
                    <Text fontSize={18} fontWeight="bold" color={textColor} mb="$4">
                        Transfer Antar Wallet
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Dari Wallet
                            </Text>
                            <XStack gap="$2" flexWrap="wrap">
                                {wallets.map((w) => (
                                    <Button
                                        key={w.id}
                                        size="$2"
                                        bg={transferFrom === w.id ? "#FEE2E2" : inputBg}
                                        onPress={() => setTransferFrom(w.id)}
                                    >
                                        <Text fontSize={14}>{w.icon}</Text>
                                        <Text
                                            fontSize={12}
                                            color={transferFrom === w.id ? "#EF4444" : subtextColor}
                                        >
                                            {w.name}
                                        </Text>
                                    </Button>
                                ))}
                            </XStack>
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Ke Wallet
                            </Text>
                            <XStack gap="$2" flexWrap="wrap">
                                {wallets.map((w) => (
                                    <Button
                                        key={w.id}
                                        size="$2"
                                        bg={transferTo === w.id ? "#D1FAE5" : inputBg}
                                        onPress={() => setTransferTo(w.id)}
                                    >
                                        <Text fontSize={14}>{w.icon}</Text>
                                        <Text
                                            fontSize={12}
                                            color={transferTo === w.id ? "#10B981" : subtextColor}
                                        >
                                            {w.name}
                                        </Text>
                                    </Button>
                                ))}
                            </XStack>
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Jumlah (Rp)
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={transferAmount}
                                    onChangeText={(t) =>
                                        setTransferAmount(formatCurrencyInput(t))
                                    }
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <Button
                            bg="#06B6D4"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={handleTransfer}
                        >
                            <Text color="white" fontWeight="bold">
                                Transfer
                            </Text>
                        </Button>
                    </YStack>
                </BottomSheetScrollView>
            </BottomSheet>
        </YStack>
    );
}

const styles = StyleSheet.create({
    netWorthCard: {
        borderRadius: 16,
        overflow: "hidden",
    },
    netWorthGradient: {
        padding: 16,
        borderRadius: 16,
    },
    walletCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    sheetInput: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    input: {
        fontSize: 16,
        padding: 0,
    },
});
