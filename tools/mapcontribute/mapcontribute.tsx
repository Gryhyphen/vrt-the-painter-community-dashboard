import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  ImageOverlay,
  MapContainer,
  useMapEvents,
  CircleMarker,
  Popup,
} from "react-leaflet";
import backgroundGeo from "../../src/assets/worldData/mapimages/backgroundGeo.json";
import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

const AVAILABLE_ZONES = Array.from(
  new Set(backgroundGeo.features.map((f) => f.id))
).sort();

type LatLngBoundsExpression = [[number, number], [number, number]];

interface GeoPointFeature {
  type: "Feature";
  properties: {
    zone: string;
    name: string;
    category: "item" | "pigment";
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

const CustomCRS = L.extend({}, L.CRS.Simple, {
  projection: {
    project(latlng: any) {
      const X = latlng.lng,
        Y = latlng.lat;
      return new L.Point(Y, -X);
    },
    unproject(point: any) {
      return new L.LatLng(point.x, -point.y);
    },
  },
});

function LocationFinder({
  setCoords,
}: {
  setCoords: (z: number, x: number) => void;
}) {
  useMapEvents({
    click(e: { latlng: { lng: number; lat: number } }) {
      const newX = parseFloat(e.latlng.lng.toFixed(3));
      const newZ = parseFloat(e.latlng.lat.toFixed(3));
      setCoords(newZ, newX);
    },
  });
  return null;
}

const mapImageModules = import.meta.glob(
  "/src/assets/worlddata/mapimages/*.png",
  { eager: true, query: "?url", import: "default" }
);

function getImageProps(item: (typeof backgroundGeo.features)[number]) {
  function getImageUrl(fileName: string) {
    const fullPath = `/src/assets/worlddata/mapimages/${fileName}`;
    return mapImageModules[fullPath] as string;
  }

  function getImageBounds(p: {
    height: number;
    width: number;
    x: number;
    y: number;
  }) {
    return [
      [p.x, -p.y], // Top-Left
      [p.x + p.width, -(p.y + p.height)], // Bottom-Right
    ] as L.LatLngBoundsExpression;
  }

  return {
    key: item.id,
    url: getImageUrl(item.properties.image),
    bounds: getImageBounds(item.properties.placement),
  };
}

function App() {
  const [formState, setFormState] = useState({
    zone: AVAILABLE_ZONES[0] || "dazil",
    name: "New Item",
    category: "item" as "item" | "pigment",
    x: 0,
    z: 0,
  });

  const [geoJsonPreview, setGeoJsonPreview] = useState<GeoPointFeature | null>(
    null
  );

  useEffect(() => {
    const safeX = isNaN(formState.x) ? 0 : formState.x;
    const safeZ = isNaN(formState.z) ? 0 : formState.z;

    const feature: GeoPointFeature = {
      type: "Feature",
      properties: {
        zone: formState.zone,
        name:
          formState.category === "item"
            ? `Item: ${formState.name}`
            : `Pigment: ${formState.name}`,
        category: formState.category,
      },
      geometry: {
        type: "Point",
        coordinates: [safeX, safeZ],
      },
    };
    setGeoJsonPreview(feature);
  }, [formState]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    let cleanValue: string | number = value;
    if (name === "x" || name === "z") {
      cleanValue = value === "" ? 0 : parseFloat(value);
    }

    setFormState((prev) => ({
      ...prev,
      [name]: cleanValue,
    }));
  };

  const handleSetCoords = (z: number, x: number) => {
    setFormState((prev) => ({ ...prev, z, x }));
  };

  const downloadJson = () => {
    if (!geoJsonPreview) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(geoJsonPreview, null, 2));
    const filename = `${formState.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.json`;

    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const copyToClipboard = () => {
    const jsonText = JSON.stringify(geoJsonPreview);
    const textarea = document.createElement("textarea");
    textarea.value = jsonText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      alert("Copied raw JSON to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy. Please copy manually from the text area.");
    }
    document.body.removeChild(textarea);
  };

  // --- STYLES ---
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  const toolPanelStyle: React.CSSProperties = {
    height: "50%",
    backgroundColor: "rgb(249, 249, 249)",
    color: "#333",
    padding: "20px",
    overflowY: "auto",
    borderBottom: "1px solid #ddd",
    boxSizing: "border-box",
  };

  const inputGroupStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    maxWidth: "800px",
    marginBottom: "20px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "4px",
    fontWeight: 500,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    color: "#333",
    borderRadius: "4px",
    fontSize: "0.9rem",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    marginRight: "10px",
    backgroundColor: "#007acc",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  };

  if (!MapContainer || !ImageOverlay || !CircleMarker) {
    return (
      <div style={containerStyle}>
        <p className="p-4 text-red-600">
          Error: Mapping components (React-Leaflet) are not available. Cannot
          render the map editor.
        </p>
        <div style={toolPanelStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "20px",
              color: "#333",
              fontSize: "1.2rem",
            }}
          >
            Map Point Editor (JSON Only)
          </h2>
          <div style={{ maxWidth: "800px" }}>
            <label style={labelStyle}>JSON Preview</label>
            <textarea
              readOnly
              value={
                geoJsonPreview ? JSON.stringify(geoJsonPreview, null, 2) : ""
              }
              style={{
                ...inputStyle,
                fontFamily: "monospace",
                height: "150px",
                resize: "vertical",
                backgroundColor: "#f4f4f4",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={toolPanelStyle}>
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#333",
            fontSize: "1.2rem",
          }}
        >
          Map Point Editor
        </h2>
        <p>
          Please paste the output of "Copy Json" into the
          <a
            href="https://docs.google.com/spreadsheets/d/12VMjZh63YEKQ3GSN5Saf4jmJjQErpRrsmLdi1e1SLAY/edit?gid=660683806#gid=660683806"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: "0.3rem",
              color: "#0077cc",
              textDecoration: "underline",
            }}
          >
            worldDataLandmarks sheet
          </a> as a new row.
        </p>

        <div style={inputGroupStyle}>
          <div>
            <div className="mb-4">
              <label style={labelStyle}>Zone ID</label>
              <select
                name="zone"
                value={formState.zone}
                onChange={handleInputChange}
                style={inputStyle}
              >
                {AVAILABLE_ZONES.map((z, i) => (
                  <option key={`${z}-${i}`} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label style={labelStyle}>Category</label>
              <select
                name="category"
                value={formState.category}
                onChange={handleInputChange}
                style={inputStyle}
              >
                <option value="item">Item</option>
                <option value="pigment">Pigment</option>
              </select>
            </div>

            <div className="mb-4">
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="e.g. Spare Tire"
              />
            </div>
          </div>

          <div>
            <div className="mb-4">
              <label style={labelStyle}>X Coordinate</label>
              <input
                type="number"
                name="x"
                value={formState.x}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>

            <div className="mb-4">
              <label style={labelStyle}>Z Coordinate</label>
              <input
                type="number"
                name="z"
                value={formState.z}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>

            <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "10px" }}>
              <i>Tip: Click on the map below to auto-fill coordinates.</i>
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "800px" }}>
          <label style={labelStyle}>JSON Preview</label>
          <div style={{ marginTop: "15px" }}>
            <button onClick={copyToClipboard} style={buttonStyle}>
              Copy JSON
            </button>
            {/* <button onClick={downloadJson} style={{ ...buttonStyle, backgroundColor: "#28a745" }}>Download .json</button> */}
          </div>
        </div>
        <textarea
          readOnly
          value={geoJsonPreview ? JSON.stringify(geoJsonPreview, null, 2) : ""}
          style={{
            ...inputStyle,
            fontFamily: "monospace",
            height: "80px",
            resize: "vertical",
            backgroundColor: "#f4f4f4",
          }}
        />
      </div>

      <div style={{ height: "50%", width: "100%", position: "relative" }}>
        <MapContainer
          crs={CustomCRS}
          style={{ height: "100%", width: "100%", background: "#e5e5e5" }}
          center={[0, 0]}
          zoom={0}
          minZoom={-5}
        >
          <LocationFinder setCoords={handleSetCoords} />

          {backgroundGeo.features.map((img, index) => {
            const props = getImageProps(img);
            return (
              <ImageOverlay
                {...props}
                key={`${props.key}-${index}`}
                opacity={0.6}
                zIndex={10}
              />
            );
          })}

          {!isNaN(formState.x) && !isNaN(formState.z) && (
            <CircleMarker
              center={[formState.z, formState.x]}
              pathOptions={{
                color: "red",
                fillColor: "#f03",
                fillOpacity: 0.8,
              }}
              radius={10}
            >
              <Popup>New Point Position</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
