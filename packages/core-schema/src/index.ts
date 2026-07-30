export type ElementType = "container" | "text" | "button";

// ── Shared styling properties (legacy inline styles, will be replaced by tailwind) ──

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

// ── Interaction / event props ──────────────────────────────────

export type ClickAction = "none" | "alert" | "toggle-class" | "navigate" | "custom";

export interface InteractionProps {
  onClickType?: ClickAction;
  onClickValue?: string;
}

// ── Per-type prop definitions ──────────────────────────────────

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

// A mapped type to associate element types with their props
export type ElementProps = {
  container: ContainerProps;
  text: TextProps;
  button: ButtonProps;
};

// The core schema for a single UI element, using a discriminated union.
export type UIElement =
  | {
      id: string;
      type: "container";
      props: ElementProps["container"];
      children: UIElement[];
    }
  | {
      id: string;
      type: "text";
      props: ElementProps["text"];
      children: never[];
    }
  | {
      id: string;
      type: "button";
      props: ElementProps["button"];
      children: never[];
    };
