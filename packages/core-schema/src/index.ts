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

// ── Interaction schema ─────────────────────────────────────────
// Each interaction defines a trigger (e.g., onClick) and an action
// to perform on a target element (e.g., toggle a CSS class).

export interface ElementInteraction {
  /** DOM trigger event */
  trigger: "onClick";
  /** What to do when triggered */
  action: "toggleClass";
  /** The element ID to act upon */
  targetElementId: string;
  /** The CSS class to toggle (e.g. "hidden") */
  className: string;
}

// ── Legacy interaction props (kept for backward compat) ────────

export type ClickAction = "none" | "alert" | "toggle-class" | "navigate" | "custom";

export interface InteractionProps {
  onClickType?: ClickAction;
  onClickValue?: string;
}

// ── Per-type prop definitions ──────────────────────────────────

// ── Base props shared by all element types ────────────────────

export interface CoreElementProps {
  tailwindClasses?: string;
  /** Optional list of interactions attached to this element */
  interactions?: ElementInteraction[];
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

export interface ButtonProps extends BaseStyleProps, InteractionProps, CoreElementProps {
  text: string;
  color?: string;
  padding?: number;
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
