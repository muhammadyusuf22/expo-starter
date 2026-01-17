import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CreditCard,
    Plus,
    Send,
    Wallet,
} from "lucide-react-native";
import { MotiView } from "moti";
import React, { useCallback, useMemo, useRef } from "react";
import { Dimensions, FlatList } from "react-native";
import { Stack, XStack, YStack } from "tamagui";

import {
    GlassCard,
    Input,
    MyButton,
    MyText,
    SafeView,
    Spacer,
} from "@/components";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Types
interface Transaction {
    id: string;
    type: "income" | "expense";
    title: string;
    description: string;
    amount: number;
    date: string;
}

// Mock Data
const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: "1",
        type: "income",
        title: "Salary",
        description: "Monthly salary",
        amount: 5000,
        date: "Today",
    },
    {
        id: "2",
        type: "expense",
        title: "Netflix",
        description: "Subscription",
        amount: -15.99,
        date: "Today",
    },
    {
        id: "3",
        type: "expense",
        title: "Uber",
        description: "Trip to downtown",
        amount: -24.5,
        date: "Yesterday",
    },
    {
        id: "4",
        type: "income",
        title: "Freelance",
        description: "Design project",
        amount: 850,
        date: "Yesterday",
    },
    {
        id: "5",
        type: "expense",
        title: "Groceries",
        description: "Weekly shopping",
        amount: -127.35,
        date: "2 days ago",
    },
    {
        id: "6",
        type: "expense",
        title: "Spotify",
        description: "Premium plan",
        amount: -9.99,
        date: "3 days ago",
    },
    {
        id: "7",
        type: "income",
        title: "Refund",
        description: "Amazon return",
        amount: 45.0,
        date: "4 days ago",
    },
    {
        id: "8",
        type: "expense",
        title: "Coffee",
        description: "Starbucks",
        amount: -6.5,
        date: "5 days ago",
    },
];

// Transaction Item Component
function TransactionItem({
    item,
    index,
}: {
    item: Transaction;
    index: number;
}) {
    const isIncome = item.type === "income";

    return (
        <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 400, delay: index * 80 }}
        >
            <XStack
                bg="rgba(255, 255, 255, 0.05)"
                rounded="$4"
                p="$3"
                mb="$2"
                items="center"
                gap="$3"
            >
                {/* Icon */}
                <Stack
                    bg={isIncome ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                    rounded="$3"
                    p="$2.5"
                >
                    {isIncome ? (
                        <ArrowDownLeft size={20} color="#10B981" />
                    ) : (
                        <ArrowUpRight size={20} color="#EF4444" />
                    )}
                </Stack>

                {/* Details */}
                <YStack grow={1}>
                    <MyText variant="body" fontWeight="600" color="white">
                        {item.title}
                    </MyText>
                    <MyText variant="caption" color="#A0A0B2">
                        {item.description}
                    </MyText>
                </YStack>

                {/* Amount */}
                <YStack items="flex-end">
                    <MyText
                        variant="body"
                        fontWeight="600"
                        color={isIncome ? "#10B981" : "#EF4444"}
                    >
                        {isIncome ? "+" : ""}
                        {item.amount.toFixed(2)}
                    </MyText>
                    <MyText variant="caption" color="#A0A0B2">
                        {item.date}
                    </MyText>
                </YStack>
            </XStack>
        </MotiView>
    );
}

export default function DashboardScreen() {
    // Bottom Sheet
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["40%"], []);

    const handleOpenSheet = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.6}
            />
        ),
        [],
    );

    // Balance Card Content
    const renderBalanceCard = () => (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 600 }}
        >
            <GlassCard
                width={SCREEN_WIDTH - 32}
                height={200}
                gradientColors={[
                    "rgba(99, 102, 241, 0.5)",
                    "rgba(139, 92, 246, 0.3)",
                    "rgba(16, 185, 129, 0.15)",
                ]}
            >
                <YStack grow={1} justify="space-between">
                    {/* Card Header */}
                    <XStack justify="space-between" items="center">
                        <YStack>
                            <MyText variant="caption" color="rgba(255,255,255,0.7)">
                                TOTAL BALANCE
                            </MyText>
                            <Spacer size="xs" />
                            <MyText variant="heading" color="white">
                                $12,450.00
                            </MyText>
                        </YStack>
                        <Stack bg="rgba(255,255,255,0.15)" rounded="$3" p="$2">
                            <CreditCard size={24} color="white" />
                        </Stack>
                    </XStack>

                    {/* Card Footer */}
                    <XStack gap="$4">
                        <YStack>
                            <MyText variant="caption" color="rgba(255,255,255,0.6)">
                                Card Number
                            </MyText>
                            <MyText variant="body" color="white" fontWeight="500">
                                •••• •••• •••• 4289
                            </MyText>
                        </YStack>
                        <YStack>
                            <MyText variant="caption" color="rgba(255,255,255,0.6)">
                                Valid Thru
                            </MyText>
                            <MyText variant="body" color="white" fontWeight="500">
                                12/28
                            </MyText>
                        </YStack>
                    </XStack>
                </YStack>
            </GlassCard>
        </MotiView>
    );

    // Action Buttons
    const renderActionButtons = () => (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 200 }}
        >
            <XStack gap="$3" px="$4">
                <MyButton
                    variant="primary"
                    fullWidth
                    icon={<Plus size={18} color="white" />}
                    onPress={handleOpenSheet}
                >
                    Top Up
                </MyButton>
                <MyButton
                    variant="secondary"
                    fullWidth
                    icon={<Send size={18} color="white" />}
                    onPress={() => { }}
                >
                    Transfer
                </MyButton>
            </XStack>
        </MotiView>
    );

    return (
        <SafeView edges={["top", "left", "right"]}>
            <YStack grow={1} px="$4">
                {/* Header */}
                <MotiView
                    from={{ opacity: 0, translateY: -10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 400 }}
                >
                    <XStack justify="space-between" items="center" py="$3">
                        <YStack>
                            <MyText variant="caption" color="#A0A0B2">
                                Good morning
                            </MyText>
                            <MyText variant="subhead" color="white">
                                Alex Johnson
                            </MyText>
                        </YStack>
                        <Stack bg="rgba(255,255,255,0.1)" rounded="$4" p="$2">
                            <Wallet size={22} color="white" />
                        </Stack>
                    </XStack>
                </MotiView>

                <Spacer size="sm" />

                {/* Balance Card */}
                {renderBalanceCard()}

                <Spacer size="lg" />

                {/* Action Buttons */}
                {renderActionButtons()}

                <Spacer size="lg" />

                {/* Transactions Header */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "timing", duration: 400, delay: 300 }}
                >
                    <XStack justify="space-between" items="center">
                        <MyText variant="subhead" color="white">
                            Recent Transactions
                        </MyText>
                        <MyText variant="caption" color="#8B5CF6">
                            See all
                        </MyText>
                    </XStack>
                </MotiView>

                <Spacer size="md" />

                {/* Transactions List - Using FlatList instead of FlashList for simpler typing */}
                <Stack grow={1}>
                    <FlatList
                        data={MOCK_TRANSACTIONS}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <TransactionItem item={item} index={index} />
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </Stack>
            </YStack>

            {/* Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{
                    backgroundColor: "#1A1A2E",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                }}
                handleIndicatorStyle={{
                    backgroundColor: "rgba(255,255,255,0.3)",
                    width: 40,
                }}
            >
                <BottomSheetView style={{ flex: 1, padding: 20 }}>
                    <MyText variant="subhead" color="white" mb="$4">
                        Top Up Your Wallet
                    </MyText>

                    <Input
                        label="Amount"
                        placeholder="Enter amount"
                        keyboardType="numeric"
                    />

                    <Spacer size="lg" />

                    <MyButton
                        variant="primary"
                        fullWidth
                        onPress={() => bottomSheetRef.current?.close()}
                    >
                        Confirm Top Up
                    </MyButton>
                </BottomSheetView>
            </BottomSheet>
        </SafeView>
    );
}
