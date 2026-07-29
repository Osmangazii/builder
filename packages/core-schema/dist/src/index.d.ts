export type ElementType = "container" | "text" | "button";
export interface ContainerProps {
    direction?: "vertical" | "horizontal";
    gap?: number;
    padding?: number;
}
export interface TextProps {
    text: string;
    fontSize?: number;
    color?: string;
    fontWeight?: "normal" | "medium" | "bold";
    textAlign?: "left" | "center" | "right";
}
export interface ButtonProps {
    text: string;
    backgroundColor?: string;
    color?: string;
    padding?: number;
    borderRadius?: number;
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