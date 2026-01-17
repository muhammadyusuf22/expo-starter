/**
 * Goals Screen - Savings Targets
 */

import { WalletPicker } from "@/components";
import type { Goal, GoalTransaction } from "@/db";
import { EditGoalTransactionSheet } from "@/features/goals/components/EditGoalTransactionSheet";
import { useAppStore, useThemeStore } from "@/store";
import { formatCurrencyInput, formatRupiah } from "@/utils";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowDown,
    ArrowUp,
    ChevronRight,
    Edit2,
    Plus,
    Target,
    Trash2,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next"; // Added import
import {
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

export default function GoalsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const themeMode = useThemeStore((state) => state.mode);
    const {
        isLoading,
        goals,
        addGoal,
        topupGoal,
        withdrawGoal,
        deleteGoal,
        wallets,
        getGoalTransactions,
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
    const topupSheetRef = useRef<BottomSheet>(null);
    const historySheetRef = useRef<BottomSheet>(null);
    const editTxSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["70%", "90%"], []);

    // Form state
    const [formName, setFormName] = useState("");
    const [formTarget, setFormTarget] = useState("");
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [selectedTx, setSelectedTx] = useState<GoalTransaction | null>(null);
    const [topupAmount, setTopupAmount] = useState("");
    const [topupWallet, setTopupWallet] = useState("");
    const [topupNote, setTopupNote] = useState("");
    const [isTopup, setIsTopup] = useState(true);
    const [historyTransactions, setHistoryTransactions] = useState<
        GoalTransaction[]
    >([]);
    const [historyOffset, setHistoryOffset] = useState(0);
    const [historyHasMore, setHistoryHasMore] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate totals
    const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const overallProgress =
        totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    const handleAddGoal = async () => {
        if (!formName || !formTarget) return;
        setIsSubmitting(true);
        try {
            await addGoal({
                name: formName,
                target_amount: parseInt(formTarget.replace(/\D/g, ""), 10) || 0,
                deadline: null,
                icon: "🎯",
                color: "#10B981",
            });
            addSheetRef.current?.close();
            setFormName("");
            setFormTarget("");
        } catch (error) {
            console.error("Failed to add goal", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTopup = async () => {
        if (!selectedGoal || !topupAmount) return;
        setIsSubmitting(true);
        try {
            const amount = parseInt(topupAmount.replace(/\D/g, ""), 10);
            if (isTopup) {
                await topupGoal(
                    selectedGoal.id,
                    amount,
                    topupNote,
                    topupWallet || null,
                );
            } else {
                await withdrawGoal(
                    selectedGoal.id,
                    amount,
                    topupNote,
                    topupWallet || null,
                );
            }
            topupSheetRef.current?.close();
            setTopupAmount("");
            setTopupNote("");
        } catch (error) {
            console.error("Failed to topup/withdraw", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openTopupSheet = (goal: Goal, topup: boolean) => {
        setSelectedGoal(goal);
        setIsTopup(topup);
        setTopupWallet(wallets[0]?.id || "");
        topupSheetRef.current?.expand();
    };

    const handleOpenHistory = async (goal: Goal) => {
        if (isLoadingHistory) return;
        setSelectedGoal(goal);
        setHistoryTransactions([]);
        setHistoryOffset(0);
        setHistoryHasMore(true);
        setIsLoadingHistory(true);

        try {
            const txs = await getGoalTransactions(goal.id, 20, 0);
            setHistoryTransactions(txs);
            setHistoryOffset(20);
            if (txs.length < 20) setHistoryHasMore(false);
            historySheetRef.current?.expand();
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleLoadMoreHistory = async () => {
        if (!selectedGoal || !historyHasMore || isLoadingHistory) return;
        setIsLoadingHistory(true);
        try {
            const txs = await getGoalTransactions(selectedGoal.id, 20, historyOffset);
            if (txs.length > 0) {
                setHistoryTransactions((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const newUnique = txs.filter((t) => !existingIds.has(t.id));
                    return [...prev, ...newUnique];
                });
                setHistoryOffset((prev) => prev + 20);
                if (txs.length < 20) setHistoryHasMore(false);
            } else {
                setHistoryHasMore(false);
            }
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleEditTx = (tx: GoalTransaction) => {
        setSelectedTx(tx);
        editTxSheetRef.current?.present();
    };

    const handleDeleteTx = (tx: GoalTransaction) => {
        Alert.alert(
            "Hapus Transaksi",
            "Apakah Anda yakin ingin menghapus transaksi ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        await useAppStore.getState().deleteGoalTransaction(tx.id);

                        // Reload history
                        if (selectedGoal) {
                            setHistoryTransactions([]);
                            setHistoryOffset(0);
                            setHistoryHasMore(true);
                            setTimeout(() => handleOpenHistory(selectedGoal), 100);
                        }
                    },
                },
            ],
        );
    };

    const renderHistoryItem = useCallback(
        ({ item: tx }: { item: GoalTransaction }) => {
            const wallet = wallets.find((w) => w.id === tx.wallet_id);
            return (
                <Swipeable
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
                                    onPress={() => handleEditTx(tx)}
                                >
                                    <Animated.View style={{ transform: [{ scale }] }}>
                                        <Edit2 size={20} color="white" />
                                    </Animated.View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.swipeBtn, styles.deleteBtn]}
                                    onPress={() => handleDeleteTx(tx)}
                                >
                                    <Animated.View style={{ transform: [{ scale }] }}>
                                        <Trash2 size={20} color="white" />
                                    </Animated.View>
                                </TouchableOpacity>
                            </RNView>
                        );
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleEditTx(tx)}
                    >
                        <XStack
                            justify="space-between"
                            items="center"
                            p="$3"
                            bg={inputBg}
                            style={{ borderRadius: 12 }}
                            mb="$3"
                        >
                            <XStack gap="$3" items="center">
                                <RNView
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor:
                                            tx.type === "topup" ? "#D1FAE5" : "#FEE2E2",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    {tx.type === "topup" ? (
                                        <ArrowUp size={20} color="#10B981" />
                                    ) : (
                                        <ArrowDown size={20} color="#EF4444" />
                                    )}
                                </RNView>
                                <YStack>
                                    <Text fontWeight="600" color={textColor}>
                                        {tx.type === "topup" ? "Topup" : "Penarikan"}
                                    </Text>
                                    {wallet && (
                                        <Text fontSize={12} color={subtextColor}>
                                            {tx.type === "topup" ? "Dari" : "Ke"} {wallet.name}
                                        </Text>
                                    )}
                                    <Text fontSize={11} color={subtextColor}>
                                        {new Date(tx.created_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Text>
                                    {tx.note && (
                                        <Text fontSize={11} color={subtextColor} mt="$1">
                                            "{tx.note}"
                                        </Text>
                                    )}
                                </YStack>
                            </XStack>
                            <Text
                                fontWeight="bold"
                                color={tx.type === "topup" ? "#10B981" : "#EF4444"}
                            >
                                {tx.type === "topup" ? "+" : "-"}
                                {formatRupiah(tx.amount)}
                            </Text>
                        </XStack>
                    </TouchableOpacity>
                </Swipeable>
            );
        },
        [inputBg, textColor, subtextColor, wallets],
    );

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
                <Spinner size="large" color="#8B5CF6" />
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg={bgColor}>
            {/* Header */}
            <YStack pt={insets.top + 10} px="$4" pb="$4">
                <XStack justify="space-between" items="center">
                    <Text fontSize={20} fontWeight="bold" color={textColor}>
                        {t("goals.my_goals")}
                    </Text>
                    <TouchableOpacity onPress={() => addSheetRef.current?.expand()}>
                        <Button
                            size="$3"
                            bg="#10B981"
                            color="white"
                            pressStyle={{ opacity: 0.8 }}
                            icon={<Plus size={16} />}
                            onPress={() => addSheetRef.current?.expand()}
                        >
                            {t("goals.add_goal")}
                        </Button>
                    </TouchableOpacity>
                </XStack>
            </YStack>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                <YStack gap="$4">
                    {/* Progress Card */}
                    <RNView style={styles.progressCard}>
                        <LinearGradient
                            colors={["#8B5CF6", "#6366F1"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.progressGradient}
                        >
                            <Text color="rgba(255,255,255,0.8)" fontSize={12}>
                                Total Progress
                            </Text>
                            <Text color="white" fontSize={28} fontWeight="bold">
                                {overallProgress}%
                            </Text>
                            <XStack justify="space-between" mt="$2">
                                <Text color="rgba(255,255,255,0.8)" fontSize={12}>
                                    Terkumpul: {formatRupiah(totalSaved)}
                                </Text>
                                <Text color="rgba(255,255,255,0.8)" fontSize={12}>
                                    Target: {formatRupiah(totalTarget)}
                                </Text>
                            </XStack>
                        </LinearGradient>
                    </RNView>

                    {/* Goals List */}
                    {goals.length === 0 ? (
                        <YStack items="center" py="$8">
                            <Text fontSize={48} mb="$2">
                                🎯
                            </Text>
                            <Text color={subtextColor}>Belum ada target</Text>
                        </YStack>
                    ) : (
                        goals.map((goal) => (
                            <TouchableOpacity
                                key={goal.id}
                                style={[
                                    styles.goalCard,
                                    { backgroundColor: cardBg, borderColor: cardBorder },
                                ]}
                                onPress={() => handleOpenHistory(goal)}
                                activeOpacity={0.7}
                            >
                                <XStack justify="space-between" items="flex-start" mb="$2">
                                    <XStack gap="$2" items="center">
                                        <Text fontSize={24}>{goal.icon}</Text>
                                        <YStack>
                                            <Text fontWeight="bold" color={textColor}>
                                                {goal.name}
                                            </Text>
                                            <Text fontSize={12} color={subtextColor}>
                                                {goal.days_remaining !== null
                                                    ? `${goal.days_remaining} hari lagi`
                                                    : "Tanpa deadline"}
                                            </Text>
                                        </YStack>
                                    </XStack>
                                    <XStack items="center" gap="$1">
                                        <Text
                                            fontSize={16}
                                            fontWeight="bold"
                                            color={
                                                goal.percentage && goal.percentage >= 100
                                                    ? "#10B981"
                                                    : "#8B5CF6"
                                            }
                                        >
                                            {goal.percentage}%
                                        </Text>
                                        <ChevronRight size={14} color="#9CA3AF" />
                                    </XStack>
                                </XStack>

                                {/* Progress Bar */}
                                <RNView style={styles.progressBarBg}>
                                    <RNView
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: `${goal.percentage || 0}%`,
                                                backgroundColor:
                                                    goal.percentage && goal.percentage >= 100
                                                        ? "#10B981"
                                                        : "#8B5CF6",
                                            },
                                        ]}
                                    />
                                </RNView>

                                <XStack justify="space-between" mt="$2" mb="$3">
                                    <Text fontSize={12} color={subtextColor}>
                                        {formatRupiah(goal.current_amount || 0)} /{" "}
                                        {formatRupiah(goal.target_amount)}
                                    </Text>
                                    <Text fontSize={12} color={subtextColor}>
                                        Sisa:{" "}
                                        {formatRupiah(
                                            goal.target_amount - (goal.current_amount || 0),
                                        )}
                                    </Text>
                                </XStack>

                                {/* Action Buttons */}
                                <XStack gap="$2">
                                    <Button
                                        flex={1}
                                        size="$3"
                                        bg="#D1FAE5"
                                        pressStyle={{ opacity: 0.8 }}
                                        onPress={() => openTopupSheet(goal, true)}
                                    >
                                        <Plus size={14} color="#10B981" />
                                        <Text color="#10B981" fontSize={12} fontWeight="600">
                                            Topup
                                        </Text>
                                    </Button>
                                    <Button
                                        flex={1}
                                        size="$3"
                                        bg="#FEF3C7"
                                        pressStyle={{ opacity: 0.8 }}
                                        onPress={() => openTopupSheet(goal, false)}
                                    >
                                        <Text color="#D97706" fontSize={12} fontWeight="600">
                                            — Tarik
                                        </Text>
                                    </Button>
                                    <Button
                                        size="$3"
                                        bg="#FEE2E2"
                                        pressStyle={{ opacity: 0.8 }}
                                        onPress={() => {
                                            Alert.alert(
                                                "Hapus Target",
                                                `Apakah Anda yakin ingin menghapus target "${goal.name}"?`,
                                                [
                                                    { text: "Batal", style: "cancel" },
                                                    {
                                                        text: "Hapus",
                                                        style: "destructive",
                                                        onPress: () => deleteGoal(goal.id),
                                                    },
                                                ],
                                            );
                                        }}
                                    >
                                        <Trash2 size={14} color="#EF4444" />
                                    </Button>
                                </XStack>
                            </TouchableOpacity>
                        ))
                    )}
                </YStack>
            </ScrollView>

            <BottomSheet
                ref={addSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <BottomSheetScrollView style={{ padding: 20 }}>
                    <Text fontSize={18} fontWeight="bold" color={textColor} mb="$4">
                        Tambah Target
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Nama Target
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={formName}
                                    onChangeText={setFormName}
                                    placeholder="Contoh: Beli iPhone"
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Target (Rp)
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={formTarget}
                                    onChangeText={(t) => setFormTarget(formatCurrencyInput(t))}
                                    placeholder="25.000.000"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <Button
                            bg="#8B5CF6"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={handleAddGoal}
                            disabled={isSubmitting}
                            opacity={isSubmitting ? 0.7 : 1}
                        >
                            <XStack gap="$2" items="center" justify="center">
                                {isSubmitting ? (
                                    <Spinner color="white" />
                                ) : (
                                    <Text color="white" fontWeight="bold">
                                        Simpan Target
                                    </Text>
                                )}
                            </XStack>
                        </Button>
                    </YStack>
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Topup/Withdraw Bottom Sheet */}
            <BottomSheet
                ref={topupSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <BottomSheetScrollView style={{ padding: 20 }}>
                    <Text fontSize={18} fontWeight="bold" color={textColor} mb="$1">
                        {isTopup ? "💰 Tambah Tabungan" : "💸 Tarik Dana"}
                    </Text>
                    <Text fontSize={13} color={subtextColor} mb="$4">
                        Target: {selectedGoal?.name}
                    </Text>
                    <YStack gap="$3">
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Jumlah (Rp)
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={topupAmount}
                                    onChangeText={(t) => setTopupAmount(formatCurrencyInput(t))}
                                    placeholder="500.000"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                {isTopup ? "Dari Wallet" : "Ke Wallet"}
                            </Text>
                            <WalletPicker
                                wallets={wallets}
                                selected={topupWallet}
                                onSelect={setTopupWallet}
                            />
                        </YStack>
                        <YStack>
                            <Text fontSize={12} color={subtextColor} mb="$1">
                                Catatan (Opsional)
                            </Text>
                            <RNView style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                                <TextInput
                                    value={topupNote}
                                    onChangeText={setTopupNote}
                                    placeholder={
                                        isTopup
                                            ? "Contoh: Topup dari gaji"
                                            : "Contoh: Kebutuhan darurat"
                                    }
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>
                        <Button
                            bg={isTopup ? "#10B981" : "#EF4444"}
                            pressStyle={{ opacity: 0.8 }}
                            onPress={handleTopup}
                            disabled={isSubmitting}
                            opacity={isSubmitting ? 0.7 : 1}
                        >
                            <XStack gap="$2" items="center" justify="center">
                                {isSubmitting ? (
                                    <Spinner color="white" />
                                ) : (
                                    <Text color="white" fontWeight="bold">
                                        {isTopup ? "Tambah" : "Tarik Dana"}
                                    </Text>
                                )}
                            </XStack>
                        </Button>
                    </YStack>
                </BottomSheetScrollView>
            </BottomSheet>

            {/* History Bottom Sheet */}
            <BottomSheet
                ref={historySheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
            >
                <BottomSheetFlatList
                    data={historyTransactions}
                    keyExtractor={(item: GoalTransaction) => item.id}
                    renderItem={renderHistoryItem}
                    contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                    onEndReached={handleLoadMoreHistory}
                    onEndReachedThreshold={0.5}
                    ListHeaderComponent={
                        <YStack mb="$4">
                            <XStack gap="$2" items="center">
                                <Target size={14} color={subtextColor} />
                                <Text fontSize={12} color={subtextColor}>
                                    {t("goals.target")}
                                </Text>
                            </XStack>
                            <Text fontSize={14} color={subtextColor}>
                                {selectedGoal?.name}
                            </Text>
                        </YStack>
                    }
                    ListEmptyComponent={
                        <YStack items="center" py="$8">
                            <Text fontSize={32} mb="$2">
                                📝
                            </Text>
                            <Text color={subtextColor}>Belum ada riwayat transaksi</Text>
                        </YStack>
                    }
                />
            </BottomSheet>

            <EditGoalTransactionSheet
                ref={editTxSheetRef}
                transaction={selectedTx}
                onClose={() => {
                    editTxSheetRef.current?.dismiss();
                    setSelectedTx(null);
                    if (selectedGoal) {
                        setHistoryTransactions([]);
                        setHistoryOffset(0);
                        setHistoryHasMore(true);
                        setTimeout(() => handleOpenHistory(selectedGoal), 100);
                    }
                }}
            />
        </YStack>
    );
}

const styles = StyleSheet.create({
    progressCard: {
        borderRadius: 16,
        overflow: "hidden",
    },
    progressGradient: {
        padding: 16,
        borderRadius: 16,
    },
    goalCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
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
    swipeActions: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        height: "100%",
    },
    swipeBtn: {
        width: 60,
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
