import { useThemeStore } from "@/store";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { Text, XStack } from "tamagui";

interface MonthPickerProps {
    month: number; // 0-11
    year: number;
    onMonthChange: (month: number, year: number) => void;
}

const MONTHS = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];

export function MonthPicker({ month, year, onMonthChange }: MonthPickerProps) {
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const iconColor = isDark ? "#9CA3AF" : "#6B7280";

    const handlePrevious = () => {
        if (month === 0) {
            onMonthChange(11, year - 1);
        } else {
            onMonthChange(month - 1, year);
        }
    };

    const handleNext = () => {
        if (month === 11) {
            onMonthChange(0, year + 1);
        } else {
            onMonthChange(month + 1, year);
        }
    };

    return (
        <XStack justify="space-between" items="center" py="$4">
            <TouchableOpacity onPress={handlePrevious} style={{ padding: 8 }}>
                <ChevronLeft size={24} color={iconColor} />
            </TouchableOpacity>

            <Text fontSize={18} fontWeight="bold" color={textColor}>
                {MONTHS[month]} {year}
            </Text>

            <TouchableOpacity onPress={handleNext} style={{ padding: 8 }}>
                <ChevronRight size={24} color={iconColor} />
            </TouchableOpacity>
        </XStack>
    );
}
