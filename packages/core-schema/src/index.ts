export type ElementType = "container" | "text" | "button" | "image";

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

// ── Base props shared by all element types ────────────────────

export interface CoreElementProps {
  tailwindClasses?: string;
  /** Custom Figma-style layer label (e.g. "Hero Section", "Navbar") shown in the Layers panel */
  customLabel?: string;
}

export interface ContainerProps extends BaseStyleProps, CoreElementProps {
  direction?: "vertical" | "horizontal";
  gap?: number;
  padding?: number;
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}

export interface TextProps extends BaseStyleProps, CoreElementProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: "normal" | "medium" | "bold";
  textAlign?: "left" | "center" | "right";
}

export interface ButtonProps extends BaseStyleProps, CoreElementProps {
  text: string;
  color?: string;
  padding?: number;
}

export type ObjectFit = "cover" | "contain" | "fill" | "none";

export interface ImageProps extends BaseStyleProps, CoreElementProps {
  src?: string;
  alt?: string;
  objectFit?: ObjectFit;
}

// A mapped type to associate element types with their props
export type ElementProps = {
  container: ContainerProps;
  text: TextProps;
  button: ButtonProps;
  image: ImageProps;
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
    }
  | {
      id: string;
      type: "image";
      props: ElementProps["image"];
      children: never[];
    };
