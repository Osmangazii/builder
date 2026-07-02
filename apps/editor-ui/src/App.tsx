import { useState } from "react";
import type { UIElement, ElementType } from "@fs-builder/core-schema";
import { exportToHtml } from "@fs-builder/exporters";
import "./App.css";
import { ElementRenderer } from "./components/ElementRenderer";
import { PropertiesPanel } from "./components/PropertiesPanel";

// A sample schema to serve as the initial state
const initialSchema: UIElement = {
  id: "root-container",
  type: "container",
  props: {},
  children: [
    {
      id: "text-1",
      type: "text",
      props: { text: "Welcome to the Visual Builder" },
      children: [],
    },
    {
      id: "main-content",
      type: "container",
      props: {},
      children: [
        {
          id: "button-1",
          type: "button",
          props: { text: "Click me!" },
          children: [],
        },
      ],
    },
  ],
};

// =================================================================
// UTILITY & HELPER FUNCTIONS
// =================================================================

/**
 * Generates a short, unique-enough ID for new elements.
 */
const generateId = (type: ElementType) =>
  `${type}-${Math.random().toString(36).substr(2, 9)}`;

function findElementById(element: UIElement, id: string): UIElement | null {
  if (element.id === id) {
    return element;
  }
  if ("children" in element && element.children) {
    for (const child of element.children) {
      const found = findElementById(child, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function addElementRecursive(
  currentElement: UIElement,
  parentId: string,
  newElement: UIElement,
): UIElement {
  if (currentElement.id === parentId) {
    if (currentElement.type !== "container") {
      console.error("Cannot add child to non-container element");
      return currentElement;
    }
    return {
      ...currentElement,
      children: [...currentElement.children, newElement],
    };
  }

  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) =>
        addElementRecursive(child, parentId, newElement),
      ),
    };
  }

  return currentElement;
}

function updateElementRecursive(
  currentElement: UIElement,
  elementId: string,
  newProps: Partial<UIElement["props"]>,
): UIElement {
  if (currentElement.id === elementId) {
    return {
      ...currentElement,
      props: { ...currentElement.props, ...newProps },
    };
  }

  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) =>
        updateElementRecursive(child, elementId, newProps),
      ),
    };
  }

  return currentElement;
}

function removeElementRecursive(
  currentElement: UIElement,
  elementId: string,
): UIElement | null {
  if (currentElement.id === elementId) {
    return null;
  }

  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children
        .map((child) => removeElementRecursive(child, elementId))
        .filter((child): child is UIElement => child !== null),
    };
  }

  return currentElement;
}

function App() {
  const [schema, setSchema] = useState<UIElement>(initialSchema);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );

  const addElement = (parentId: string, newElement: UIElement) => {
    const newSchema = addElementRecursive(schema, parentId, newElement);
    setSchema(newSchema);
  };

  const updateElement = (
    elementId: string,
    newProps: Partial<UIElement["props"]>,
  ) => {
    const newSchema = updateElementRecursive(schema, elementId, newProps);
    setSchema(newSchema);
  };

  const removeElement = (elementId: string) => {
    if (schema.id === elementId) {
      console.error("Cannot remove the root element.");
      return;
    }
    const newSchema = removeElementRecursive(schema, elementId);
    if (newSchema) {
      setSchema(newSchema);
    }
    setSelectedElementId(null);
  };

  const handleSelectElement = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  const handleAddNewElement = (type: ElementType) => {
    const id = generateId(type);
    let newElement: UIElement;

    switch (type) {
      case "text":
        newElement = {
          id,
          type: "text",
          props: { text: "New Text" },
          children: [],
        };
        break;
      case "button":
        newElement = {
          id,
          type: "button",
          props: { text: "New Button" },
          children: [],
        };
        break;
      case "container":
        newElement = { id, type: "container", props: {}, children: [] };
        break;
    }

    // If a container is selected, add the new element inside it.
    // Otherwise, add it to the root container.
    const selectedElement = selectedElementId
      ? findElementById(schema, selectedElementId)
      : null;

    const parentId =
      selectedElement && selectedElement.type === "container"
        ? selectedElement.id
        : schema.id; // Default to root

    addElement(parentId, newElement);
    // Select the new element automatically
    setSelectedElementId(id);
  };

  const handleExportHtml = () => {
    const htmlContent = exportToHtml(schema);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exported-page.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedElement = selectedElementId
    ? findElementById(schema, selectedElementId)
    : null;

  return (
    <main>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h1>FS-Builder</h1>
        <button onClick={handleExportHtml}>Export HTML</button>
      </div>
      <div className="app-wrapper">
        <div
          className="renderer-wrapper"
          onClick={() => setSelectedElementId(null)}
        >
          <ElementRenderer
            element={schema}
            selectedElementId={selectedElementId}
            onSelect={handleSelectElement}
          />
        </div>
        <div className="sidebar-wrapper">
          <div className="toolbox-wrapper">
            <h3>Toolbox</h3>
            <div className="toolbox-buttons">
              <button onClick={() => handleAddNewElement("container")}>
                Add Container
              </button>
              <button onClick={() => handleAddNewElement("text")}>
                Add Text
              </button>
              <button onClick={() => handleAddNewElement("button")}>
                Add Button
              </button>
            </div>
          </div>
          <PropertiesPanel
            selectedElement={selectedElement}
            onUpdate={updateElement}
            onDelete={removeElement}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
