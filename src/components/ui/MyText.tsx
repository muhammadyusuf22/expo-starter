import { styled, Text } from "tamagui";

export const MyText = styled(Text, {
    color: "$color",
    fontFamily: "$body",

    variants: {
        variant: {
            heading: {
                fontSize: 28,
                fontWeight: "700",
                lineHeight: 34,
                letterSpacing: -0.5,
            },
            subhead: {
                fontSize: 18,
                fontWeight: "600",
                lineHeight: 24,
                letterSpacing: -0.25,
            },
            body: {
                fontSize: 16,
                fontWeight: "400",
                lineHeight: 22,
            },
            caption: {
                fontSize: 14,
                fontWeight: "400",
                lineHeight: 18,
                opacity: 0.7,
            },
            label: {
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 16,
                textTransform: "uppercase",
                letterSpacing: 0.5,
            },
        },
        muted: {
            true: {
                opacity: 0.6,
            },
        },
    } as const,

    defaultVariants: {
        variant: "body",
    },
});

export type MyTextProps = React.ComponentProps<typeof MyText>;
