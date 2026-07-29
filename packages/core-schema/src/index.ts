export type ElementType = "container" | "text" | "button";

// ── Shared styling properties used by all element types ────────

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

// ── Per-type prop definitions ──────────────────────────────────

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

// A mapped type to associate element types with their props for better type safety
export type ElementProps = {
  container: ContainerProps;
  text: TextProps;
  button: ButtonProps;
};

// The core schema for a single UI element, using a discriminated union.
// This ensures that the `props` for an element match its `type`.
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
      children: never[]; // Text elements cannot have children
    }
  | {
      id: string;
      type: "button";
      props: ElementProps["button"];
      children: never[]; // Buttons cannot have children
    };
