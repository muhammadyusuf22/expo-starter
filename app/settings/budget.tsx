/**
 * Budget Management Screen
 */

import { useAppStore, useThemeStore } from "@/store";
import { formatCurrencyInput, formatRupiah } from "@/utils";
import { useRouter } from "expo-router";
import { ChevronLeft, Edit2 } from "lucide-react-native";
import { useState } from "react";
import {
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

export default function BudgetScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const themeMode = useThemeStore((state) => state.mode);
    const { budgets, updateBudget } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const inputBg = isDark ? "#374151" : "#F3F4F6";

    // Edit state
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const handleEdit = (category: string, currentLimit: number) => {
        setEditingCategory(category);
        setEditValue(currentLimit.toString());
    };

    const handleSave = async () => {
        if (!editingCategory) return;
        const newLimit = parseInt(editValue.replace(/\D/g, ""), 10) || 0;
        await updateBudget(editingCategory, newLimit);
        setEditingCategory(null);
        setEditValue("");
    };

    return (
        <YStack flex={1} bg={bgColor}>
            {/* Header */}
            <XStack pt={insets.top + 10} px="$4" pb="$4" items="center" gap="$3">
                <TouchableOpacity onPress={() => router.back()}>
                    <RNView style={[styles.backBtn, { backgroundColor: inputBg }]}>
                        <ChevronLeft size={20} color={textColor} />
                    </RNView>
                </TouchableOpacity>
                <Text fontSize={18} fontWeight="bold" color={textColor}>
                    Atur Budget
                </Text>
            </XStack>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                <RNView
                    style={[
                        styles.card,
                        { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                >
                    {budgets.map((budget, index) => (
                        <RNView key={budget.category}>
                            {index > 0 && (
                                <RNView
                                    style={[styles.divider, { backgroundColor: cardBorder }]}
                                />
                            )}
                            <XStack p="$4" justify="space-between" items="center">
                                <XStack gap="$3" items="center" flex={1}>
                                    <RNView style={styles.emoji}>
                                        <Text fontSize={16}>💰</Text>
                                    </RNView>
                                    <YStack flex={1}>
                                        <Text fontWeight="bold" color={textColor} numberOfLines={1}>
                                            {budget.category}
                                        </Text>
                                        {editingCategory === budget.category ? (
                                            <XStack gap="$2" items="center" mt="$1">
                                                <RNView
                                                    style={[
                                                        styles.editInput,
                                                        { backgroundColor: inputBg },
                                                    ]}
                                                >
                                                    <TextInput
                                                        value={editValue}
                                                        onChangeText={(t) =>
                                                            setEditValue(formatCurrencyInput(t))
                                                        }
                                                        placeholder="0"
                                                        placeholderTextColor="#9CA3AF"
                                                        keyboardType="numeric"
                                                        style={[styles.input, { color: textColor }]}
                                                        autoFocus
                                                    />
                                                </RNView>
                                                <Button size="$2" bg="#10B981" onPress={handleSave}>
                                                    <Text color="white" fontSize={12}>
                                                        Simpan
                                                    </Text>
                                                </Button>
                                            </XStack>
                                        ) : (
                                            <Text fontSize={12} color={subtextColor}>
                                                Limit: {formatRupiah(budget.monthly_limit)}
                                            </Text>
                                        )}
                                    </YStack>
                                </XStack>
                                {editingCategory !== budget.category && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            handleEdit(budget.category, budget.monthly_limit)
                                        }
                                    >
                                        <RNView
                                            style={[styles.editBtn, { backgroundColor: inputBg }]}
                                        >
                                            <Edit2 size={14} color={subtextColor} />
                                        </RNView>
                                    </TouchableOpacity>
                                )}
                            </XStack>
                        </RNView>
                    ))}
                </RNView>
            </ScrollView>
        </YStack>
    );
}

const styles = StyleSheet.create({
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
    },
    divider: {
        height: 1,
    },
    emoji: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#D1FAE5",
        justifyContent: "center",
        alignItems: "center",
    },
    editBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    editInput: {
        flex: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    input: {
        fontSize: 14,
        padding: 0,
    },
});
