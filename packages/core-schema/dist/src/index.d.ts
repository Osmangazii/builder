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
export interface ContainerProps extends BaseStyleProps {
    direction?: "vertical" | "horizontal";
    gap?: number;
    padding?: number;
}
export interface TextProps extends BaseStyleProps {
    text: string;
    fontSize?: number;
    color?: string;
    fontWeight?: "normal" | "medium" | "bold";
    textAlign?: "left" | "center" | "right";
}
export interface ButtonProps extends BaseStyleProps {
    text: string;
    color?: string;
    padding?: number;
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