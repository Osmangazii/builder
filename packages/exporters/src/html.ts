import type { UIElement, TextProps, ButtonProps, ContainerProps, BaseStyleProps } from "../../core-schema/src";

const getGlobalStyles = (): string => `
  body {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;
    color: #2d3748;
    background-color: #ffffff;
    margin: 0;
  }
  button {
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    padding: 0.5em 1em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #ffffff;
    cursor: pointer;
  }
  div, p, button {
    box-sizing: border-box;
  }
`;

function appendBaseStyles(styles: string, p: BaseStyleProps): string {
  let s = styles;
  if (p.display) s += `display: ${p.display};`;
  if (p.width) s += `width: ${p.width};`;
  if (p.height) s += `height: ${p.height};`;
  if (p.margin !== undefined && p.margin >= 0) s += `margin: ${p.margin}px;`;
  if (p.backgroundColor) s += `background-color: ${p.backgroundColor};`;
  if (p.borderRadius !== undefined && p.borderRadius >= 0) s += `border-radius: ${p.borderRadius}px;`;
  if (p.borderWidth !== undefined && p.borderWidth >= 0) {
    s += `border-width: ${p.borderWidth}px;`;
    s += `border-style: ${p.borderStyle || "solid"};`;
    if (p.borderColor) s += `border-color: ${p.borderColor};`;
  }
  return s;
}

function getElementStyles(element: UIElement): string {
  let styles = "margin: 5px;";

  if (element.type === "container") {
    const p = element.props as ContainerProps;
    const display = p.display || "flex";
    const { direction = "vertical", gap = 0, padding = 20 } = p;

    styles += `display: ${display};`;
    if (display === "flex") {
      styles += `flex-direction: ${direction === "horizontal" ? "row" : "column"};`;
      styles += `gap: ${gap}px;`;
    }
    styles += `padding: ${padding}px;`;
    styles += `border: 1px solid #e2e8f0;`;
    styles += `border-radius: 4px;`;
    styles += `background-color: #f7fafc;`;

    styles = appendBaseStyles(styles, p as BaseStyleProps);
  } else if (element.type === "text") {
    const p = element.props as TextProps;
    if (p.fontSize) styles += `font-size: ${p.fontSize}px;`;
    if (p.color) styles += `color: ${p.color};`;
    if (p.fontWeight) styles += `font-weight: ${p.fontWeight};`;
    if (p.textAlign) styles += `text-align: ${p.textAlign};`;
    styles = appendBaseStyles(styles, p as BaseStyleProps);
  } else if (element.type === "button") {
    const p = element.props as ButtonProps;
    if (p.color) styles += `color: ${p.color};`;
    if (p.padding !== undefined) styles += `padding: ${p.padding}px;`;
    styles = appendBaseStyles(styles, p as BaseStyleProps);
  }

  return styles;
}

function elementToHtml(element: UIElement): string {
  if (!element) return "";

  const { type, props, children } = element;
  const style = getElementStyles(element);

  switch (type) {
    case "container":
      const innerHtml =
        children.length > 0
          ? children.map(elementToHtml).join("")
          : '<div style="min-height: 20px; background-color: #f0f0f0;"></div>';
      return `<div style="${style}">${innerHtml}</div>`;

    case "text":
      return `<p style="${style}">${(props as TextProps).text || "Default Text"}</p>`;

    case "button":
      return `<button style="${style}">${(props as ButtonProps).text || "Default Button"}</button>`;

    default:
      return "";
  }
}

export const exportToHtml = (schema: UIElement): string => {
  const content = elementToHtml(schema);
  const globalStyles = getGlobalStyles();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Exported Page</title>
      <style>
        ${globalStyles}
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
};
