/**
 * Goals Screen - Savings Targets
 */

import type { Goal } from "@/db";
import { useAppStore, useThemeStore } from "@/store";
import { formatCurrencyInput, formatRupiah } from "@/utils";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

export default function GoalsScreen() {
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
    const snapPoints = useMemo(() => ["55%"], []);

    // Form state
    const [formName, setFormName] = useState("");
    const [formTarget, setFormTarget] = useState("");
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [topupAmount, setTopupAmount] = useState("");
    const [topupWallet, setTopupWallet] = useState("");
    const [isTopup, setIsTopup] = useState(true);

    // Calculate totals
    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const overallProgress =
        totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    const handleAddGoal = async () => {
        if (!formName || !formTarget) return;
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
    };

    const handleTopup = async () => {
        if (!selectedGoal || !topupAmount) return;
        const amount = parseInt(topupAmount.replace(/\D/g, ""), 10);
        if (isTopup) {
            await topupGoal(selectedGoal.id, amount, "", topupWallet || null);
        } else {
            await withdrawGoal(selectedGoal.id, amount, "", topupWallet || null);
        }
        topupSheetRef.current?.close();
        setTopupAmount("");
    };

    const openTopupSheet = (goal: Goal, topup: boolean) => {
        setSelectedGoal(goal);
        setIsTopup(topup);
        setTopupWallet(wallets[0]?.id || "");
        topupSheetRef.current?.expand();
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
                        Target Tabungan
                    </Text>
                    <Button
                        size="$3"
                        bg="#10B981"
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
                            <RNView
                                key={goal.id}
                                style={[
                                    styles.goalCard,
                                    { backgroundColor: cardBg, borderColor: cardBorder },
                                ]}
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
                                        {formatRupiah(goal.current_amount)} /{" "}
                                        {formatRupiah(goal.target_amount)}
                                    </Text>
                                    <Text fontSize={12} color={subtextColor}>
                                        Sisa:{" "}
                                        {formatRupiah(goal.target_amount - goal.current_amount)}
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
                                        onPress={() => deleteGoal(goal.id)}
                                    >
                                        <Trash2 size={14} color="#EF4444" />
                                    </Button>
                                </XStack>
                            </RNView>
                        ))
                    )}
                </YStack>
            </ScrollView>

            {/* Add Goal Bottom Sheet */}
            <BottomSheet
                ref={addSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: cardBg }}
                handleIndicatorStyle={{ backgroundColor: subtextColor }}
            >
                <BottomSheetView style={{ padding: 20 }}>
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
                        >
                            <Text color="white" fontWeight="bold">
                                Simpan Target
                            </Text>
                        </Button>
                    </YStack>
                </BottomSheetView>
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
            >
                <BottomSheetView style={{ padding: 20 }}>
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
                                Dari Wallet
                            </Text>
                            <XStack gap="$2" flexWrap="wrap">
                                {wallets.map((w) => (
                                    <Button
                                        key={w.id}
                                        size="$2"
                                        bg={topupWallet === w.id ? "#DBEAFE" : inputBg}
                                        onPress={() => setTopupWallet(w.id)}
                                    >
                                        <Text fontSize={14}>{w.icon}</Text>
                                        <Text
                                            fontSize={12}
                                            color={topupWallet === w.id ? "#3B82F6" : subtextColor}
                                        >
                                            {w.name}
                                        </Text>
                                    </Button>
                                ))}
                            </XStack>
                        </YStack>
                        <Button
                            bg={isTopup ? "#10B981" : "#EF4444"}
                            pressStyle={{ opacity: 0.8 }}
                            onPress={handleTopup}
                        >
                            <Text color="white" fontWeight="bold">
                                {isTopup ? "Tambah" : "Tarik Dana"}
                            </Text>
                        </Button>
                    </YStack>
                </BottomSheetView>
            </BottomSheet>
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
});
