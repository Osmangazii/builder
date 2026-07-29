import type { UIElement, TextProps, ButtonProps, ContainerProps } from "../../core-schema/src";

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

function getElementStyles(element: UIElement): string {
  let styles = "margin: 5px;";

  if (element.type === "container") {
    const { direction = "vertical", gap = 0, padding = 20 } = element.props as ContainerProps;
    styles += `
      display: flex;
      flex-direction: ${direction === "horizontal" ? "row" : "column"};
      gap: ${gap}px;
      padding: ${padding}px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background-color: #f7fafc;
    `;
  } else if (element.type === "text") {
    const p = element.props as TextProps;
    if (p.fontSize) styles += `font-size: ${p.fontSize}px;`;
    if (p.color) styles += `color: ${p.color};`;
    if (p.fontWeight) styles += `font-weight: ${p.fontWeight};`;
    if (p.textAlign) styles += `text-align: ${p.textAlign};`;
  } else if (element.type === "button") {
    const p = element.props as ButtonProps;
    if (p.backgroundColor) styles += `background-color: ${p.backgroundColor};`;
    if (p.color) styles += `color: ${p.color};`;
    if (p.padding !== undefined) styles += `padding: ${p.padding}px;`;
    if (p.borderRadius !== undefined) styles += `border-radius: ${p.borderRadius}px;`;
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
