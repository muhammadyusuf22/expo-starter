import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GetProps, Stack, styled } from "tamagui";

const SafeViewFrame = styled(Stack, {
    flex: 1,
    bg: "$background",
});

type SafeViewFrameProps = GetProps<typeof SafeViewFrame>;

type SafeEdge = "top" | "bottom" | "left" | "right";

interface SafeViewProps extends Omit<SafeViewFrameProps, "edges"> {
    children: React.ReactNode;
    edges?: SafeEdge[];
}

export function SafeView({
    children,
    edges = ["top", "bottom", "left", "right"],
    ...props
}: SafeViewProps) {
    const insets = useSafeAreaInsets();

    const padding = {
        pt: edges.includes("top") ? insets.top : 0,
        pb: edges.includes("bottom") ? insets.bottom : 0,
        pl: edges.includes("left") ? insets.left : 0,
        pr: edges.includes("right") ? insets.right : 0,
    };

    return (
        <SafeViewFrame {...padding} {...props}>
            {children}
        </SafeViewFrame>
    );
}
