import React, { useState } from "react";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (html: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ open, onClose, onImport }) => {
  const [html, setHtml] = useState("");

  if (!open) return null;

  const handleImport = () => {
    if (!html.trim()) return;
    onImport(html);
    setHtml("");
  };

  const handleCancel = () => {
    setHtml("");
    onClose();
  };

  return (
    <div className="import-overlay" onClick={handleCancel}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="import-modal__header">
          <h3>Import Component</h3>
          <button className="import-modal__close" onClick={handleCancel}>✕</button>
        </div>
        <p className="import-modal__desc">
          Paste raw Tailwind HTML below to import it onto the canvas.
        </p>
        <textarea
          className="import-modal__textarea"
          rows={10}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder={`<div class="flex items-center gap-4 p-4 bg-white rounded-lg shadow">\n  <p class="text-lg font-medium">Hello</p>\n  <button class="bg-blue-600 text-white px-4 py-2 rounded">Click</button>\n</div>`}
          spellCheck={false}
        />
        <div className="import-modal__actions">
          <button className="editor-btn" onClick={handleCancel}>Cancel</button>
          <button className="editor-btn editor-btn-primary" onClick={handleImport} disabled={!html.trim()}>
            Import Component
          </button>
        </div>
      </div>
    </div>
  );
};
