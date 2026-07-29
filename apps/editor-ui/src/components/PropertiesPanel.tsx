import React from "react";
import type {
  UIElement,
  TextProps,
  ButtonProps,
  ContainerProps,
} from "@fs-builder/core-schema";

interface PropertiesPanelProps {
  selectedElement: UIElement | null;
  onUpdate: (
    elementId: string,
    newProps: Partial<TextProps | ButtonProps | ContainerProps>,
  ) => void;
  onDelete: (elementId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdate,
  onDelete,
}) => {
  // If no element is selected, don't render the panel
  if (!selectedElement) {
    return (
      <div className="properties-panel-wrapper">
        <div className="properties-empty">No element selected</div>
      </div>
    );
  }

  const { id, type, props } = selectedElement;

  const renderPanelContent = () => {
    switch (type) {
      case "text":
        return (
          <div>
            <label htmlFor="text-content">Content</label>
            <input
              id="text-content"
              type="text"
              value={(props as TextProps).text}
              onChange={(e) => onUpdate(id, { text: e.target.value })}
            />
          </div>
        );

      case "button":
        return (
          <div>
            <label htmlFor="button-label">Label</label>
            <input
              id="button-label"
              type="text"
              value={(props as ButtonProps).text}
              onChange={(e) => onUpdate(id, { text: e.target.value })}
            />
          </div>
        );

      case "container": {
        const containerProps = props as ContainerProps;
        return (
          <div>
            <div>
              <label htmlFor="container-direction">Direction</label>
              <select
                id="container-direction"
                value={containerProps.direction || "vertical"}
                onChange={(e) =>
                  onUpdate(id, {
                    direction: e.target.value as "vertical" | "horizontal",
                  })
                }
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div style={{ marginTop: "12px" }}>
              <label htmlFor="container-gap">Gap (px)</label>
              <input
                id="container-gap"
                type="number"
                value={containerProps.gap ?? 0}
                onChange={(e) =>
                  onUpdate(id, { gap: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            <div style={{ marginTop: "12px" }}>
              <label htmlFor="container-padding">Padding (px)</label>
              <input
                id="container-padding"
                type="number"
                value={containerProps.padding ?? 20}
                onChange={(e) =>
                  onUpdate(id, { padding: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </div>
        );
        }

      default:
        return <p style={{ color: "var(--text-dim)" }}>This element type has no editable properties.</p>;
    }
  };

  return (
    <div className="properties-panel-wrapper">
      <h3>Properties</h3>
      <p className="properties-panel-id">ID: {id}</p>
      <hr className="properties-panel-divider" />
      {renderPanelContent()}

      <button
        className="editor-btn editor-btn-danger editor-btn-block"
        onClick={() => onDelete(id)}
        style={{ marginTop: "20px" }}
      >
        🗑 Delete Element
      </button>
    </div>
  );
};
