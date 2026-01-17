/**
 * Wallets Screen
 * With Edit and Delete functionality
 */

import { IconPicker, TransactionFilters, WalletPicker } from "@/components";
import type { Wallet } from "@/db";
import { Transaction } from "@/db";
import { TransactionItem } from "@/features/dashboard";
import { EditTransactionSheet } from "@/features/transactions/components/EditTransactionSheet";
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
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeftRight, Edit2, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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
    const historySheetRef = useRef<BottomSheet>(null);
    const editTxSheetRef = useRef<BottomSheetModal>(null); // Added
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
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null); // Added

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
            t("wallets.delete_wallet"),
            t("wallets.confirm_delete", { walletName: wallet.name }),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteWallet(wallet.id);
                        if (!success) {
                            Alert.alert(
                                t("wallets.cannot_delete"),
                                t("wallets.delete_error_message"),
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
                t("wallets.transfer_description"),
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

    const handleHistoryEdit = (tx: Transaction) => {
        setSelectedTx(tx);
        editTxSheetRef.current?.present();
    };

    const handleHistoryDelete = (tx: Transaction) => {
        Alert.alert(
            t("transactions.delete_title"),
            t("transactions.confirm_delete"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: async () => {
                        // Optimistic update or reload?
                        // We reload history
                        await useAppStore.getState().deleteTransaction(tx.id);
                        if (selectedHistoryWallet) {
                            // Reset and reload
                            setHistoryTransactions([]);
                            setHistoryOffset(0);
                            loadWalletHistory(selectedHistoryWallet.id, true);
                        }
                    },
                },
            ],
        );
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
                        {t("wallets.my_wallets")}
                    </Text>
                    <Button
                        size="$3"
                        bg="#3B82F6"
                        pressStyle={{ opacity: 0.8 }}
                        onPress={() => addSheetRef.current?.expand()}
                    >
                        <Plus size={16} color="white" />
                        <Text color="white" fontSize={13} fontWeight="600">
                            {t("wallets.add_wallet")}
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
                                {t("wallets.total_net_worth")}
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
                            {t("wallets.transfer_between_wallets")}
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
                                                {t("common.edit")}
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
                                                {t("common.delete")}
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
                        {t("wallets.add_wallet")}
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                {t("wallets.wallet_name")}
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={walletName}
                                    onChangeText={setWalletName}
                                    placeholder={t("wallets.wallet_name_placeholder")}
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <IconPicker
                            value={walletIcon}
                            onChange={setWalletIcon}
                            label={t("form.icon")}
                        />
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                {t("form.type")}
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
                                {t("wallets.initial_balance")}
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
                                        {t("common.save")}
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
                        {t("wallets.edit_wallet")}
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                {t("wallets.wallet_name")}
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder={t("wallets.wallet_name_placeholder")}
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <IconPicker
                            value={editIcon}
                            onChange={setEditIcon}
                            label={t("form.icon")}
                        />
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
                                        {t("common.save")}
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
                        {t("wallets.transfer_title")}
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                {t("form.from_wallet")}
                            </Text>
                            <WalletPicker
                                wallets={wallets}
                                selected={transferFrom}
                                onSelect={setTransferFrom}
                            />
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                {t("form.to_wallet")}
                            </Text>
                            <WalletPicker
                                wallets={wallets}
                                selected={transferTo}
                                onSelect={setTransferTo}
                            />
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                {t("form.amount")}
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
                                        {t("wallets.transfer_action")}
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
                                <TransactionItem
                                    transaction={item}
                                    onPress={() => handleHistoryEdit(item)}
                                    onDelete={() => handleHistoryDelete(item)}
                                />
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

            <EditTransactionSheet
                ref={editTxSheetRef}
                transaction={selectedTx}
                onClose={() => {
                    editTxSheetRef.current?.dismiss();
                    setSelectedTx(null);
                    if (selectedHistoryWallet) {
                        setHistoryTransactions([]);
                        setHistoryOffset(0);
                        loadWalletHistory(selectedHistoryWallet.id, true);
                    }
                }}
            />
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
