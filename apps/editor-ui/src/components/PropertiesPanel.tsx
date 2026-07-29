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

const PROP_GROUP_MARGIN = { marginTop: "14px" as const };

// ── Reusable field helpers ─────────────────────────────────────

function TextField({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumberField({ id, label, value, min, onChange }: {
  id: string; label: string; value: number | undefined; min?: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min ?? 0}
        value={value ?? ""}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      />
    </div>
  );
}

function ColorField({ id, label, value, onChange }: {
  id: string; label: string; value: string | undefined; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="prop-color-row">
        <input
          id={id}
          type="color"
          className="prop-color-picker"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="prop-color-hex"
          value={value || ""}
          placeholder="#000000"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SelectField({ id, label, value, options, onChange }: {
  id: string; label: string; value: string | undefined; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value || options[0]?.value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Panel component ────────────────────────────────────────────

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdate,
  onDelete,
}) => {
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
      // ── Text ────────────────────────────────────────────────
      case "text": {
        const p = props as TextProps;
        return (
          <div>
            <TextField
              id="text-content" label="Content"
              value={p.text} onChange={(v) => onUpdate(id, { text: v })}
            />
            <div style={PROP_GROUP_MARGIN}>
              <NumberField
                id="text-font-size" label="Font Size (px)"
                value={p.fontSize} min={8}
                onChange={(v) => onUpdate(id, { fontSize: v })}
              />
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <ColorField
                id="text-color" label="Text Color"
                value={p.color}
                onChange={(v) => onUpdate(id, { color: v || undefined })}
              />
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <SelectField
                id="text-font-weight" label="Font Weight"
                value={p.fontWeight}
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "medium", label: "Medium" },
                  { value: "bold", label: "Bold" },
                ]}
                onChange={(v) => onUpdate(id, { fontWeight: v as "normal" | "medium" | "bold" })}
              />
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <SelectField
                id="text-align" label="Text Align"
                value={p.textAlign}
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Center" },
                  { value: "right", label: "Right" },
                ]}
                onChange={(v) => onUpdate(id, { textAlign: v as "left" | "center" | "right" })}
              />
            </div>
          </div>
        );
      }

      // ── Button ──────────────────────────────────────────────
      case "button": {
        const p = props as ButtonProps;
        return (
          <div>
            <TextField
              id="button-label" label="Label"
              value={p.text} onChange={(v) => onUpdate(id, { text: v })}
            />
            <div style={PROP_GROUP_MARGIN}>
              <ColorField
                id="button-bg" label="Background Color"
                value={p.backgroundColor}
                onChange={(v) => onUpdate(id, { backgroundColor: v || undefined })}
              />
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <ColorField
                id="button-color" label="Text Color"
                value={p.color}
                onChange={(v) => onUpdate(id, { color: v || undefined })}
              />
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <NumberField
                id="button-padding" label="Padding (px)"
                value={p.padding} min={0}
                onChange={(v) => onUpdate(id, { padding: v })}
              />
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <NumberField
                id="button-border-radius" label="Border Radius (px)"
                value={p.borderRadius} min={0}
                onChange={(v) => onUpdate(id, { borderRadius: v })}
              />
            </div>
          </div>
        );
      }

      // ── Container ───────────────────────────────────────────
      case "container": {
        const p = props as ContainerProps;
        return (
          <div>
            <div>
              <label htmlFor="container-direction">Direction</label>
              <select
                id="container-direction"
                value={p.direction || "vertical"}
                onChange={(e) =>
                  onUpdate(id, { direction: e.target.value as "vertical" | "horizontal" })
                }
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <NumberField
                id="container-gap" label="Gap (px)"
                value={p.gap ?? 0}
                onChange={(v) => onUpdate(id, { gap: v })}
              />
            </div>
            <div style={PROP_GROUP_MARGIN}>
              <NumberField
                id="container-padding" label="Padding (px)"
                value={p.padding ?? 20}
                onChange={(v) => onUpdate(id, { padding: v })}
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
