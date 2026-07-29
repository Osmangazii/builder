export type ElementType = "container" | "text" | "button";

// Prop definitions for each element type
export interface ContainerProps {
  direction?: "vertical" | "horizontal";
  gap?: number;
  padding?: number;
}

export interface TextProps {
  text: string;
}

export interface ButtonProps {
  text: string;
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
