import { DatePicker } from "@/components/pickers";
import { useThemeStore } from "@/store";
import { FilterType } from "@/utils";
import { ArrowRight } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Text, XStack, YStack } from "tamagui";

interface TransactionFiltersProps {
    filter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    customStartDate: string;
    onCustomStartDateChange: (date: string) => void;
    customEndDate: string;
    onCustomEndDateChange: (date: string) => void;
}

export function TransactionFilters({
    filter,
    onFilterChange,
    customStartDate,
    onCustomStartDateChange,
    customEndDate,
    onCustomEndDateChange,
}: TransactionFiltersProps) {
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const borderColor = isDark ? "#374151" : "#E5E7EB";

    const renderFilterChip = (label: string, value: FilterType) => {
        const isActive = filter === value;
        return (
            <TouchableOpacity
                onPress={() => onFilterChange(value)}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive
                        ? "#10B981"
                        : isDark
                            ? "#374151"
                            : "#E5E7EB",
                    marginRight: 8,
                }}
            >
                <Text
                    color={isActive ? "white" : textColor}
                    fontWeight={isActive ? "bold" : "normal"}
                    fontSize={13}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ paddingBottom: 16 }}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={
                    [
                        { label: "Semua", value: "all" },
                        { label: "Hari Ini", value: "today" },
                        { label: "Minggu Ini", value: "week" },
                        { label: "Bulan Ini", value: "month" },
                        { label: "Custom", value: "custom" },
                    ] as { label: string; value: FilterType }[]
                }
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => renderFilterChip(item.label, item.value)}
                style={{ marginBottom: filter === "custom" ? 16 : 0 }}
            />

            {filter === "custom" && (
                <YStack
                    bg={cardBg}
                    p="$4"
                    mt="$1"
                    gap="$3"
                    style={{
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor,
                    }}
                >
                    <Text fontWeight="600" fontSize={14} color={textColor}>
                        Rentang Waktu
                    </Text>
                    <XStack gap="$3" items="center">
                        <YStack flex={1} gap="$2">
                            <Text fontSize={12} color={subtextColor}>
                                Dari
                            </Text>
                            <DatePicker
                                value={customStartDate}
                                onChange={onCustomStartDateChange}
                            />
                        </YStack>
                        <YStack pt="$6">
                            <ArrowRight size={16} color={subtextColor} />
                        </YStack>
                        <YStack flex={1} gap="$2">
                            <Text fontSize={12} color={subtextColor}>
                                Sampai
                            </Text>
                            <DatePicker
                                value={customEndDate}
                                onChange={onCustomEndDateChange}
                            />
                        </YStack>
                    </XStack>
                </YStack>
            )}
        </View>
    );
}
