export type ElementType = "container" | "text" | "button";
export type DisplayMode = "block" | "inline-block" | "flex";
export interface BaseStyleProps {
    display?: DisplayMode;
    width?: string;
    height?: string;
    margin?: number;
    borderWidth?: number;
    borderStyle?: "solid" | "dashed" | "none";
    borderColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
}
export type ClickAction = "none" | "alert" | "toggle-class" | "navigate" | "custom";
export interface InteractionProps {
    onClickType?: ClickAction;
    onClickValue?: string;
}
export interface ContainerProps extends BaseStyleProps {
    direction?: "vertical" | "horizontal";
    gap?: number;
    padding?: number;
    justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
    /** Tailwind CSS classes to apply instead of inline style props */
    tailwindClasses?: string;
}
export interface TextProps extends BaseStyleProps {
    text: string;
    fontSize?: number;
    color?: string;
    fontWeight?: "normal" | "medium" | "bold";
    textAlign?: "left" | "center" | "right";
    /** Tailwind CSS classes to apply instead of inline style props */
    tailwindClasses?: string;
}
export interface ButtonProps extends BaseStyleProps, InteractionProps {
    text: string;
    color?: string;
    padding?: number;
    /** Tailwind CSS classes to apply instead of inline style props */
    tailwindClasses?: string;
}
export type ElementProps = {
    container: ContainerProps;
    text: TextProps;
    button: ButtonProps;
};
export type UIElement = {
    id: string;
    type: "container";
    props: ElementProps["container"];
    children: UIElement[];
} | {
    id: string;
    type: "text";
    props: ElementProps["text"];
    children: never[];
} | {
    id: string;
    type: "button";
    props: ElementProps["button"];
    children: never[];
};
//# sourceMappingURL=index.d.ts.map