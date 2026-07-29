import React, { useState } from "react";
import type {
  UIElement,
  TextProps,
  ButtonProps,
  ContainerProps,
  BaseStyleProps,
  DisplayMode,
} from "@fs-builder/core-schema";

interface PropertiesPanelProps {
  selectedElement: UIElement | null;
  onUpdate: (
    elementId: string,
    newProps: Partial<TextProps | ButtonProps | ContainerProps>,
  ) => void;
  onDelete: (elementId: string) => void;
}

// ═══════════════════════════════════════════════════════════════
//  COLLAPSIBLE SECTION
// ═══════════════════════════════════════════════════════════════

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="prop-section">
      <button
        className="prop-section-header"
        onClick={() => setOpen((p) => !p)}
        type="button"
      >
        <span className={`prop-section-arrow${open ? " prop-section-arrow--open" : ""}`}>
          ▸
        </span>
        <span className="prop-section-title">{title}</span>
      </button>
      {open && <div className="prop-section-body">{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPACT FIELD HELPERS
// ═══════════════════════════════════════════════════════════════

function InputField({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="prop-field">
      <label className="prop-label" htmlFor={id}>{label}</label>
      <input id={id} className="prop-input" type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function HalfNumField({ id, label, value, min, onChange }: {
  id: string; label: string; value: number | undefined; min?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="prop-field prop-field--half">
      <label className="prop-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="prop-input"
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
    <div className="prop-field">
      <label className="prop-label" htmlFor={id}>{label}</label>
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

function ButtonGroup<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="prop-field">
      <label className="prop-label">{label}</label>
      <div className="prop-btn-group">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`prop-btn-group__btn${value === opt.value || (!value && opt === options[0]) ? " prop-btn-group__btn--active" : ""}`}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SHARED LAYOUT FIELDS (margin, border, width/height)
// ═══════════════════════════════════════════════════════════════

function LayoutFields({ id, props, onUpdate }: {
  id: string;
  props: BaseStyleProps;
  onUpdate: (elementId: string, newProps: Partial<BaseStyleProps>) => void;
}) {
  return (
    <>
      <div className="prop-row">
        <HalfNumField
          id={`${id}-margin`} label="Margin"
          value={props.margin}
          onChange={(v) => onUpdate(id, { margin: v })}
        />
        <HalfNumField
          id={`${id}-border-w`} label="Border W"
          value={props.borderWidth}
          onChange={(v) => onUpdate(id, { borderWidth: v })}
        />
      </div>
      <ButtonGroup
        label="Border Style"
        value={props.borderStyle}
        options={[
          { value: "solid", label: "—" },
          { value: "dashed", label: "— —" },
          { value: "none", label: "✕" },
        ]}
        onChange={(v) => onUpdate(id, { borderStyle: v })}
      />
      <ColorField
        id={`${id}-border-color`} label="Border Color"
        value={props.borderColor}
        onChange={(v) => onUpdate(id, { borderColor: v || undefined })}
      />
      <div className="prop-row">
        <InputField
          id={`${id}-width`} label="Width"
          value={props.width ?? ""}
          onChange={(v) => onUpdate(id, { width: v || undefined })}
        />
        <InputField
          id={`${id}-height`} label="Height"
          value={props.height ?? ""}
          onChange={(v) => onUpdate(id, { height: v || undefined })}
        />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SHARED APPEARANCE FIELDS (bg, radius)
// ═══════════════════════════════════════════════════════════════

function AppearanceFields({ id, props, onUpdate }: {
  id: string;
  props: BaseStyleProps;
  onUpdate: (elementId: string, newProps: Partial<BaseStyleProps>) => void;
}) {
  return (
    <>
      <ColorField
        id={`${id}-bg`} label="Background"
        value={props.backgroundColor}
        onChange={(v) => onUpdate(id, { backgroundColor: v || undefined })}
      />
      <HalfNumField
        id={`${id}-radius`} label="Border Radius"
        value={props.borderRadius}
        onChange={(v) => onUpdate(id, { borderRadius: v })}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BUTTON TYPOGRAPHY FIELDS
// ═══════════════════════════════════════════════════════════════

function ButtonTypography({ id, props, update }: {
  id: string;
  props: ButtonProps;
  update: (p: Partial<ButtonProps>) => void;
}) {
  return (
    <>
      <InputField id={`${id}-label`} label="Label" value={props.text} onChange={(v) => update({ text: v })} />
      <ColorField id={`${id}-btn-color`} label="Text Color" value={props.color} onChange={(v) => update({ color: v || undefined })} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════

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

  const { id, type, props: rawProps } = selectedElement;

  const update = (newProps: Partial<TextProps | ButtonProps | ContainerProps>) =>
    onUpdate(id, newProps);

  // Cast to BaseStyleProps for shared access
  const shared = rawProps as BaseStyleProps;
  const isFlex = (shared.display ?? (type === "container" ? "flex" : undefined)) === "flex";

  return (
    <div className="properties-panel-wrapper">
      <h3>Properties</h3>
      <p className="properties-panel-id">ID: {id}</p>
      <hr className="properties-panel-divider" />

      {/* ── LAYOUT SECTION ── */}
      <Section title="Layout">
        <ButtonGroup
          label="Display"
          value={shared.display ?? (type === "container" ? "flex" : undefined)}
          options={[
            { value: "block", label: "Block" },
            { value: "inline-block", label: "Inline" },
            { value: "flex", label: "Flex" },
          ]}
          onChange={(v: DisplayMode) => {
            // Merge display switch with a default direction for containers
            const merged: Partial<ContainerProps> = { display: v };
            if (v === "flex" && type === "container") {
              const p = rawProps as ContainerProps;
              if (!p.direction) {
                merged.direction = "vertical";
              }
            }
            update(merged);
          }}
        />

        {/* Flex-only: Direction + Gap — visible only when display is 'flex' */}
        {isFlex && type === "container" && (() => {
          const p = rawProps as ContainerProps;
          return (
            <>
              <ButtonGroup
                label="Direction"
                value={p.direction}
                options={[
                  { value: "vertical", label: "↕" },
                  { value: "horizontal", label: "↔" },
                ]}
                onChange={(v) => update({ direction: v as "vertical" | "horizontal" })}
              />
              <div className="prop-row">
                <HalfNumField id={`${id}-gap`} label="Gap" value={p.gap ?? 0} onChange={(v) => update({ gap: v })} />
                <HalfNumField id={`${id}-pad`} label="Padding" value={p.padding ?? 20} onChange={(v) => update({ padding: v })} />
              </div>
            </>
          );
        })()}

        {/* Padding for non-flex or text/button */}
        {(!isFlex || type !== "container") && type === "container" && (
          <HalfNumField id={`${id}-pad`} label="Padding" value={(rawProps as ContainerProps).padding ?? 20} onChange={(v) => update({ padding: v })} />
        )}
        {type === "button" && (
          <HalfNumField id={`${id}-pad-btn`} label="Padding" value={(rawProps as ButtonProps).padding} onChange={(v) => update({ padding: v })} />
        )}

        <LayoutFields id={id} props={shared} onUpdate={onUpdate} />
      </Section>

      {/* ── TYPOGRAPHY SECTION (text & button only) ── */}
      {(type === "text" || type === "button") && (
        <Section title="Typography">
          {type === "text" && (() => {
            const p = rawProps as TextProps;
            return (
              <>
                <InputField id={`${id}-content`} label="Content" value={p.text} onChange={(v) => update({ text: v })} />
                <div className="prop-row">
                  <HalfNumField id={`${id}-fs`} label="Font Size" value={p.fontSize} min={8} onChange={(v) => update({ fontSize: v })} />
                  <ButtonGroup
                    label="Weight"
                    value={p.fontWeight}
                    options={[
                      { value: "normal", label: "N" },
                      { value: "medium", label: "M" },
                      { value: "bold", label: "B" },
                    ]}
                    onChange={(v) => update({ fontWeight: v as "normal" | "medium" | "bold" })}
                  />
                </div>
                <ButtonGroup
                  label="Align"
                  value={p.textAlign}
                  options={[
                    { value: "left", label: "L" },
                    { value: "center", label: "C" },
                    { value: "right", label: "R" },
                  ]}
                  onChange={(v) => update({ textAlign: v as "left" | "center" | "right" })}
                />
                <ColorField id={`${id}-txt-color`} label="Color" value={p.color} onChange={(v) => update({ color: v || undefined })} />
              </>
            );
          })()}
          {type === "button" && (
            <ButtonTypography id={id} props={rawProps as ButtonProps} update={update} />
          )}
        </Section>
      )}

      {/* ── APPEARANCE SECTION — now visible for ALL element types ── */}
      <Section title="Appearance" defaultOpen={false}>
        <AppearanceFields id={id} props={shared} onUpdate={onUpdate} />

        {type === "button" && (
          <div style={{ marginTop: "6px" }}>
            <ColorField
              id={`${id}-btn-color-app`} label="Text Color"
              value={(rawProps as ButtonProps).color}
              onChange={(v) => update({ color: v || undefined })}
            />
          </div>
        )}
      </Section>

      {/* ── DELETE ── */}
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
