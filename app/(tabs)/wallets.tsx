/**
 * Wallets Screen
 * With Edit and Delete functionality
 */

import { IconPicker, TransactionFilters, WalletPicker } from "@/components";
import type { Wallet } from "@/db";
import { Transaction } from "@/db";
import { TransactionItem } from "@/features/dashboard";
import { useAppStore, useThemeStore } from "@/store";
import {
    FilterType,
    formatCurrencyInput,
    formatRupiah,
    getCurrentDateString,
    getFilterDateRange,
} from "@/utils";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetFlatList,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeftRight, Edit2, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

export default function WalletsScreen() {
    const insets = useSafeAreaInsets();
    const themeMode = useThemeStore((state) => state.mode);
    const {
        isLoading,
        wallets,
        addWallet,
        updateWallet,
        deleteWallet,
        transferBetweenWallets,
        getTransactions, // Added
    } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const inputBg = isDark ? "#374151" : "#F3F4F6";

    // Bottom sheet refs
    const addSheetRef = useRef<BottomSheet>(null);
    const editSheetRef = useRef<BottomSheet>(null);
    const transferSheetRef = useRef<BottomSheet>(null);
    const historySheetRef = useRef<BottomSheet>(null); // Added
    const snapPoints = useMemo(() => ["70%", "90%"], []);

    // Add wallet form state
    const [walletName, setWalletName] = useState("");
    const [walletType, setWalletType] = useState<
        "cash" | "bank" | "ewallet" | "other"
    >("bank");
    const [walletBalance, setWalletBalance] = useState("");
    const [walletIcon, setWalletIcon] = useState("🏦");

    // Edit wallet form state
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [editName, setEditName] = useState("");
    const [editIcon, setEditIcon] = useState("");

    // Transfer form state
    const [transferFrom, setTransferFrom] = useState("");
    const [transferTo, setTransferTo] = useState("");
    const [transferAmount, setTransferAmount] = useState("");

    // History state
    const [selectedHistoryWallet, setSelectedHistoryWallet] =
        useState<Wallet | null>(null);
    const [historyTransactions, setHistoryTransactions] = useState<Transaction[]>(
        [],
    );
    const [historyOffset, setHistoryOffset] = useState(0);
    const [historyHasMore, setHistoryHasMore] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // History Filters
    const [historyFilter, setHistoryFilter] = useState<FilterType>("all");
    const [historyStart, setHistoryStart] = useState(getCurrentDateString());
    const [historyEnd, setHistoryEnd] = useState(getCurrentDateString());

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate net worth
    const netWorth = wallets.reduce(
        (sum, w) => sum + (w.current_balance || 0),
        0,
    );

    const handleAddWallet = async () => {
        if (!walletName) return;
        setIsSubmitting(true);
        try {
            await addWallet({
                name: walletName,
                type: walletType,
                initial_balance: parseInt(walletBalance.replace(/\D/g, ""), 10) || 0,
                icon: walletIcon,
                color: "#10B981",
            });
            addSheetRef.current?.close();
            setWalletName("");
            setWalletBalance("");
            setWalletIcon("🏦");
        } catch (error) {
            console.error("Failed to add wallet", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditWallet = (wallet: Wallet) => {
        setEditingWallet(wallet);
        setEditName(wallet.name);
        setEditIcon(wallet.icon || "💰");
        editSheetRef.current?.expand();
    };

    const handleSaveEdit = async () => {
        if (!editingWallet || !editName) return;
        setIsSubmitting(true);
        try {
            await updateWallet(editingWallet.id, {
                name: editName,
                icon: editIcon,
            });
            editSheetRef.current?.close();
            setEditingWallet(null);
        } catch (error) {
            console.error("Failed to update wallet", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteWallet = async (wallet: Wallet) => {
        Alert.alert(
            "Hapus Wallet",
            `Apakah Anda yakin ingin menghapus "${wallet.name}"?`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteWallet(wallet.id);
                        if (!success) {
                            Alert.alert(
                                "Tidak Bisa Dihapus",
                                "Wallet ini memiliki transaksi terkait. Hapus transaksi terlebih dahulu atau transfer saldo ke wallet lain.",
                            );
                        }
                    },
                },
            ],
        );
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
        setIsSubmitting(true);
        try {
            await transferBetweenWallets(
                transferFrom,
                transferTo,
                amount,
                "Transfer antar wallet",
            );
            transferSheetRef.current?.close();
            setTransferAmount("");
        } catch (error) {
            console.error("Failed to transfer", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // History Logic
    const loadWalletHistory = async (
        walletId: string,
        refresh = false,
        filter?: FilterType,
    ) => {
        const currentFilter = filter || historyFilter;
        if (!refresh && !historyHasMore && currentFilter === historyFilter) return;
        if (isLoadingHistory) return;

        setIsLoadingHistory(true);
        try {
            const currentOffset = refresh ? 0 : historyOffset;
            const dateRange = getFilterDateRange(
                currentFilter,
                historyStart,
                historyEnd,
            );
            const data = await getTransactions(20, currentOffset, {
                walletId,
                ...dateRange,
            });

            if (refresh) {
                setHistoryTransactions(data);
                setHistoryOffset(20);
            } else {
                // Filter duplicates
                const existingIds = new Set(historyTransactions.map((t) => t.id));
                const newTx = data.filter((t) => !existingIds.has(t.id));
                setHistoryTransactions((prev) => [...prev, ...newTx]);
                setHistoryOffset((prev) => prev + 20);
            }

            setHistoryHasMore(data.length >= 20);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleHistoryFilterChange = (newFilter: FilterType) => {
        setHistoryFilter(newFilter);
        if (selectedHistoryWallet) {
            setHistoryTransactions([]);
            setHistoryHasMore(true);
            setHistoryOffset(0);
            loadWalletHistory(selectedHistoryWallet.id, true, newFilter);
        }
    };

    // Effect for custom dates
    useEffect(() => {
        if (historyFilter === "custom" && selectedHistoryWallet) {
            setHistoryOffset(0);
            setHistoryHasMore(true);
            loadWalletHistory(selectedHistoryWallet.id, true);
        }
    }, [historyStart, historyEnd]);

    const handleWalletPress = (wallet: Wallet) => {
        setSelectedHistoryWallet(wallet);
        setHistoryFilter("all"); // Reset filter
        setHistoryTransactions([]); // clear previous
        setHistoryHasMore(true);
        setHistoryOffset(0);
        historySheetRef.current?.expand();
        // Reset dates
        setHistoryStart(getCurrentDateString());
        setHistoryEnd(getCurrentDateString());
        loadWalletHistory(wallet.id, true, "all");
    };

    const handleLoadMoreHistory = () => {
        if (selectedHistoryWallet) {
            loadWalletHistory(selectedHistoryWallet.id, false);
        }
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

                    {/* Transfer Button - Moved to top */}
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

                    {/* Wallet List with Swipeable */}
                    {wallets.map((wallet) => (
                        <Swipeable
                            key={wallet.id}
                            friction={2}
                            rightThreshold={40}
                            renderRightActions={(progress, dragX) => {
                                const scale = dragX.interpolate({
                                    inputRange: [-100, 0],
                                    outputRange: [1, 0],
                                    extrapolate: "clamp",
                                });
                                return (
                                    <RNView style={styles.swipeActions}>
                                        <TouchableOpacity
                                            style={[styles.swipeBtn, styles.editBtn]}
                                            onPress={() => handleEditWallet(wallet)}
                                        >
                                            <Animated.View style={{ transform: [{ scale }] }}>
                                                <Edit2 size={20} color="white" />
                                            </Animated.View>
                                            <Text color="white" fontSize={11} mt="$1">
                                                Edit
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.swipeBtn, styles.deleteBtn]}
                                            onPress={() => handleDeleteWallet(wallet)}
                                        >
                                            <Animated.View style={{ transform: [{ scale }] }}>
                                                <Trash2 size={20} color="white" />
                                            </Animated.View>
                                            <Text color="white" fontSize={11} mt="$1">
                                                Hapus
                                            </Text>
                                        </TouchableOpacity>
                                    </RNView>
                                );
                            }}
                        >
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => handleWalletPress(wallet)} // Added press
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
                                <Text
                                    fontWeight="bold"
                                    color={
                                        (wallet.current_balance || 0) >= 0 ? "#10B981" : "#EF4444"
                                    }
                                >
                                    {formatRupiah(wallet.current_balance || 0)}
                                </Text>
                            </TouchableOpacity>
                        </Swipeable>
                    ))}
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
                        <IconPicker
                            value={walletIcon}
                            onChange={setWalletIcon}
                            label="Icon"
                        />
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
                            disabled={isSubmitting}
                            opacity={isSubmitting ? 0.7 : 1}
                        >
                            <XStack gap="$2" items="center" justify="center">
                                {isSubmitting ? (
                                    <Spinner color="white" />
                                ) : (
                                    <Text color="white" fontWeight="bold">
                                        Simpan Wallet
                                    </Text>
                                )}
                            </XStack>
                        </Button>
                    </YStack>
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Edit Wallet Bottom Sheet */}
            <BottomSheet
                ref={editSheetRef}
                index={-1}
                snapPoints={["50%"]}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
            >
                <BottomSheetScrollView style={{ padding: 20 }}>
                    <Text fontSize={18} fontWeight="bold" color={textColor} mb="$4">
                        Edit Wallet
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Nama Wallet
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Nama wallet"
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <IconPicker value={editIcon} onChange={setEditIcon} label="Icon" />
                        <Button
                            bg="#10B981"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={handleSaveEdit}
                            disabled={isSubmitting}
                            opacity={isSubmitting ? 0.7 : 1}
                        >
                            <XStack gap="$2" items="center" justify="center">
                                {isSubmitting ? (
                                    <Spinner color="white" />
                                ) : (
                                    <Text color="white" fontWeight="bold">
                                        Simpan Perubahan
                                    </Text>
                                )}
                            </XStack>
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
                            <WalletPicker
                                wallets={wallets}
                                selected={transferFrom}
                                onSelect={setTransferFrom}
                            />
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Ke Wallet
                            </Text>
                            <WalletPicker
                                wallets={wallets}
                                selected={transferTo}
                                onSelect={setTransferTo}
                            />
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
                            disabled={isSubmitting}
                            opacity={isSubmitting ? 0.7 : 1}
                        >
                            <XStack gap="$2" items="center" justify="center">
                                {isSubmitting ? (
                                    <Spinner color="white" />
                                ) : (
                                    <Text color="white" fontWeight="bold">
                                        Transfer
                                    </Text>
                                )}
                            </XStack>
                        </Button>
                    </YStack>
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Wallet History Bottom Sheet */}
            <BottomSheet
                ref={historySheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
            >
                <YStack flex={1} p="$4">
                    {selectedHistoryWallet && (
                        <YStack mb="$4" items="center">
                            <Text fontSize={40} mb="$2">
                                {selectedHistoryWallet.icon}
                            </Text>
                            <Text fontSize={20} fontWeight="bold" color={textColor}>
                                Riwayat {selectedHistoryWallet.name}
                            </Text>
                            <Text fontSize={14} color={subtextColor}>
                                Saldo:{" "}
                                {formatRupiah(selectedHistoryWallet.current_balance || 0)}
                            </Text>
                        </YStack>
                    )}

                    <TransactionFilters
                        filter={historyFilter}
                        onFilterChange={handleHistoryFilterChange}
                        customStartDate={historyStart}
                        onCustomStartDateChange={setHistoryStart}
                        customEndDate={historyEnd}
                        onCustomEndDateChange={setHistoryEnd}
                    />

                    <BottomSheetFlatList
                        data={historyTransactions}
                        keyExtractor={(item: Transaction) => item.id}
                        renderItem={({ item }: { item: Transaction }) => (
                            <RNView style={{ marginBottom: 12 }}>
                                <TransactionItem transaction={item} />
                            </RNView>
                        )}
                        onEndReached={handleLoadMoreHistory}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={
                            !isLoadingHistory ? (
                                <YStack items="center" py="$10">
                                    <Text fontSize={40} mb="$2">
                                        📝
                                    </Text>
                                    <Text color={subtextColor}>Belum ada transaksi</Text>
                                </YStack>
                            ) : null
                        }
                        ListFooterComponent={
                            isLoadingHistory ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#3B82F6"
                                    style={{ margin: 20 }}
                                />
                            ) : null
                        }
                        contentContainerStyle={{ paddingBottom: 50 }}
                    />
                </YStack>
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
    iconBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    swipeActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    swipeBtn: {
        width: 70,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        marginLeft: 8,
    },
    editBtn: {
        backgroundColor: "#3B82F6",
    },
    deleteBtn: {
        backgroundColor: "#EF4444",
    },
});
