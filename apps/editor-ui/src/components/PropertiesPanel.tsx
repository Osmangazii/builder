import React, { useState } from "react";
import type { UIElement, TextProps, ButtonProps, ContainerProps } from "@fs-builder/core-schema";
import { tw, DISPLAY_GROUP, FLEX_DIR_GROUP, ALIGN_GROUP, JUSTIFY_GROUP, FONT_SIZE_GROUP, FONT_WEIGHT_GROUP, TEXT_ALIGN_GROUP } from "../utils/tw";

interface PropertiesPanelProps {
  selectedElement: UIElement | null;
  onUpdate: (elementId: string, newProps: Partial<TextProps | ButtonProps | ContainerProps>) => void;
  onDelete: (elementId: string) => void;
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="prop-section">
      <button className="prop-section-header" onClick={() => setOpen((p) => !p)} type="button">
        <span className={`prop-section-arrow${open ? " prop-section-arrow--open" : ""}`}>▸</span>
        <span className="prop-section-title">{title}</span>
      </button>
      {open && <div className="prop-section-body">{children}</div>}
    </div>
  );
}

function BtnGroup<T extends string>({ label, active, options, onChange }: {
  label: string; active: T | undefined; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="prop-field">
      <label className="prop-label">{label}</label>
      <div className="prop-btn-group">
        {options.map((opt) => (
          <button key={opt.value}
            className={`prop-btn-group__btn${active === opt.value ? " prop-btn-group__btn--active" : ""}`}
            onClick={() => onChange(opt.value)} type="button">{opt.label}</button>
        ))}
      </div>
    </div>
  );
}

function Inp({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="prop-field">
      <label className="prop-label" htmlFor={id}>{label}</label>
      <input id={id} className="prop-input" type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, onUpdate, onDelete }) => {
  if (!selectedElement) {
    return <div className="properties-panel-wrapper"><div className="properties-empty">No element selected</div></div>;
  }

  const { id, type } = selectedElement;
  const propsAny = selectedElement.props as Record<string, unknown>;
  const rawTw: string = (propsAny.tailwindClasses as string) ?? "";
  const isText = type === "text";
  const isButton = type === "button";
  const textVal = isText ? (selectedElement.props as TextProps).text : isButton ? (selectedElement.props as ButtonProps).text : "";

  const setTw = (next: string) => onUpdate(id, { tailwindClasses: next } as Partial<TextProps & ButtonProps & ContainerProps>);
  const upd = (fn: (c: string) => string) => setTw(fn(rawTw));

  const isFlex = tw.has(rawTw, "flex");
  const flexDir = tw.activeInGroup(rawTw, "flex-") || "flex-col";
  const alignVal = tw.activeInGroup(rawTw, "items-") || "items-stretch";
  const justifyVal = tw.activeInGroup(rawTw, "justify-") || "justify-start";
  const padVal = tw.activeInGroup(rawTw, "p-") || "";
  const marVal = tw.activeInGroup(rawTw, "m-") || "";

  // Determine which "Display" button is active: prefer flex, block, hidden in that order
  const displayActive = tw.has(rawTw, "flex") ? "flex" : tw.has(rawTw, "hidden") ? "hidden" : tw.has(rawTw, "grid") ? "grid" : "block";

  return (
    <div className="properties-panel-wrapper" key={id}>
      <h3>Properties</h3>
      <p className="properties-panel-id">ID: {id}</p>
      <hr className="properties-panel-divider" />

      {/* Raw Tailwind classes */}
      <div className="prop-field">
        <label className="prop-label">Tailwind Classes</label>
        <textarea className="prop-input prop-input--code" rows={3}
          value={rawTw} onChange={(e) => setTw(e.target.value)}
          placeholder="e.g. flex flex-col p-4 bg-white" />
      </div>

      {/* Layout */}
      <Section title="Layout">
        <BtnGroup label="Display" active={displayActive}
          options={[
            { value: "hidden", label: "✕" },
            { value: "block", label: "Block" },
            { value: "flex", label: "Flex" },
            { value: "grid", label: "Grid" },
          ]}
          onChange={(v) => upd((c) => tw.setGroupClass(c, DISPLAY_GROUP, v))} />

        {isFlex && (
          <>
            <BtnGroup label="Direction" active={flexDir}
              options={[
                { value: "flex-col", label: "↕" },
                { value: "flex-row", label: "↔" },
              ]}
              onChange={(v) => upd((c) => tw.setGroupClass(c, FLEX_DIR_GROUP, v))} />
            <BtnGroup label="Align" active={alignVal}
              options={[
                { value: "items-start", label: "Top" },
                { value: "items-center", label: "Center" },
                { value: "items-end", label: "Bottom" },
                { value: "items-stretch", label: "Stretch" },
              ]}
              onChange={(v) => upd((c) => tw.setGroupClass(c, ALIGN_GROUP, v))} />
            <BtnGroup label="Justify" active={justifyVal}
              options={[
                { value: "justify-start", label: "Start" },
                { value: "justify-center", label: "Center" },
                { value: "justify-end", label: "End" },
                { value: "justify-between", label: "Between" },
              ]}
              onChange={(v) => upd((c) => tw.setGroupClass(c, JUSTIFY_GROUP, v))} />
          </>
        )}
      </Section>

      {/* Spacing */}
      <Section title="Spacing" defaultOpen={false}>
        <label className="prop-label">Padding</label>
        <div className="prop-btn-group" style={{ marginBottom: 8 }}>
          {[0, 1, 2, 3, 4, 6, 8, 12].map((n) => (
            <button key={n}
              className={`prop-btn-group__btn${padVal === `p-${n}` ? " prop-btn-group__btn--active" : ""}`}
              onClick={() => upd((c) => tw.setPrefixed(c, "p-", String(n)))} type="button">{n}</button>
          ))}
        </div>
        <label className="prop-label">Margin</label>
        <div className="prop-btn-group">
          {[0, 1, 2, 3, 4, 6, 8, 12].map((n) => (
            <button key={n}
              className={`prop-btn-group__btn${marVal === `m-${n}` ? " prop-btn-group__btn--active" : ""}`}
              onClick={() => upd((c) => tw.setPrefixed(c, "m-", String(n)))} type="button">{n}</button>
          ))}
        </div>
      </Section>

      {/* Typography */}
      {(isText || isButton) && (
        <Section title="Typography">
          <Inp id="txt-content" label={isText ? "Content" : "Label"} value={textVal}
            onChange={(v) => onUpdate(id, { text: v })} />
          <BtnGroup label="Size"
            active={tw.activeInGroup(rawTw, "text-")}
            options={[
              { value: "text-xs", label: "XS" }, { value: "text-sm", label: "SM" },
              { value: "text-base", label: "Base" }, { value: "text-lg", label: "LG" },
              { value: "text-xl", label: "XL" }, { value: "text-2xl", label: "2XL" },
            ]}
            onChange={(v) => upd((c) => tw.setGroupClass(c, FONT_SIZE_GROUP, v))} />
          <BtnGroup label="Weight"
            active={tw.activeInGroup(rawTw, "font-")}
            options={[
              { value: "font-normal", label: "N" }, { value: "font-medium", label: "M" },
              { value: "font-bold", label: "B" },
            ]}
            onChange={(v) => upd((c) => tw.setGroupClass(c, FONT_WEIGHT_GROUP, v))} />
          <BtnGroup label="Align"
            active={tw.activeInGroup(rawTw, "text-")}
            options={[
              { value: "text-left", label: "L" }, { value: "text-center", label: "C" }, { value: "text-right", label: "R" },
            ]}
            onChange={(v) => upd((c) => tw.setGroupClass(c, TEXT_ALIGN_GROUP, v))} />
        </Section>
      )}

      {/* Colors — use setPrefixed for bg-* and text-* prefixes */}
      <Section title="Colors" defaultOpen={false}>
        <label className="prop-label">Background</label>
        <div className="prop-btn-group" style={{ marginBottom: 8 }}>
          {[
            { v: "bg-white", l: "W" }, { v: "bg-gray-100", l: "G100" }, { v: "bg-gray-200", l: "G200" },
            { v: "bg-gray-800", l: "G800" }, { v: "bg-zinc-900", l: "Z900" },
            { v: "bg-blue-600", l: "Blue" }, { v: "bg-red-500", l: "Red" }, { v: "bg-green-500", l: "Grn" },
          ].map((opt) => (
            <button key={opt.v}
              className={`prop-btn-group__btn${tw.has(rawTw, opt.v) ? " prop-btn-group__btn--active" : ""}`}
              onClick={() => upd((c) => tw.setGroupClass(c, ["bg-white", "bg-gray-100", "bg-gray-200", "bg-gray-800", "bg-zinc-900", "bg-blue-600", "bg-red-500", "bg-green-500"], tw.has(rawTw, opt.v) ? "" : opt.v))}
              type="button">{opt.l}</button>
          ))}
        </div>
        <label className="prop-label">Text Color</label>
        <div className="prop-btn-group">
          {[
            { v: "text-white", l: "W" }, { v: "text-gray-900", l: "900" }, { v: "text-gray-700", l: "700" },
            { v: "text-gray-500", l: "500" }, { v: "text-blue-600", l: "Blue" }, { v: "text-red-500", l: "Red" },
          ].map((opt) => (
            <button key={opt.v}
              className={`prop-btn-group__btn${tw.has(rawTw, opt.v) ? " prop-btn-group__btn--active" : ""}`}
              onClick={() => upd((c) => tw.setGroupClass(c, ["text-white", "text-gray-900", "text-gray-700", "text-gray-500", "text-blue-600", "text-red-500"], tw.has(rawTw, opt.v) ? "" : opt.v))}
              type="button">{opt.l}</button>
          ))}
        </div>
      </Section>

      <button className="editor-btn editor-btn-danger editor-btn-block" onClick={() => onDelete(id)} style={{ marginTop: 20 }}>
        🗑 Delete Element
      </button>
    </div>
  );
};
