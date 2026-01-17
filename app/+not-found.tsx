import { MyButton, MyText, SafeView } from "@/components";
import { Link, Stack } from "expo-router";
import { YStack } from "tamagui";

export default function NotFoundScreen() {
    return (
        <SafeView>
            <Stack.Screen options={{ title: "Oops!" }} />
            <YStack grow={1} items="center" justify="center" p="$4" gap="$4">
                <MyText variant="heading" color="white">
                    404
                </MyText>
                <MyText variant="subhead" color="#A0A0B2">
                    This screen doesn't exist.
                </MyText>
                <Link href="/" asChild>
                    <MyButton variant="primary">Go to home screen</MyButton>
                </Link>
            </YStack>
        </SafeView>
    );
}
