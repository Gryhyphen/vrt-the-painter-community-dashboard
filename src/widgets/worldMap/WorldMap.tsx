import "leaflet/dist/leaflet.css";
import { GeoJSON, ImageOverlay, MapContainer } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection, Point } from "geojson";
import rawLandmarkData from "../../assets/worldData/landmarksGeo.json";
const landmarkData = rawLandmarkData as FeatureCollection<Point>;

// --- Custom CRS ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CustomCRS = L.extend({}, L.CRS.Simple, {
  projection: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    project(latlng: any) {
      const X = latlng.lng,
        Y = latlng.lat;
      return new L.Point(Y, -X);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unproject(point: any) {
      return new L.LatLng(point.x, -point.y);
    },
  },
});

interface IProps {
  style?: React.CSSProperties;
}

function createSparkleIcon(shadowColor = "#9d00ff") {
  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: rgba(20, 20, 20, 0.75);
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        transition: transform 0.2s ease;
      ">
        <span style="
          display: block;
          text-shadow: 0 0 0 ${shadowColor};
          font-size: 18px;
          color: transparent;
          user-select: none;
        ">⭐</span>
      </div>
    `,
    className: "", // no external css (otherwise it has a default)
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

const imageData = [
  {
    name: "DazilResized.png",
    zoneId: "dazil",
    placement: { x: -289.2, y: 129.1, width: 173.85, height: 97.79 },
  },
  {
    name: "LahanVillageResized.png",
    zoneId: "lahanVillage",
    placement: { x: -59.22, y: 74.95, width: 129.04, height: 134.53 },
  },
  {
    name: "BledavikResized.png",
    zoneId: "bledavik",
    placement: { x: -254.38, y: 305.26, width: 79.64, height: 125.01 },
  },
  {
    name: "Bledavik2Resized.png",
    zoneId: "bledavik_2",
    placement: { x: -417.13, y: -42.49, width: 86.76, height: 85.99 },
  },
  {
    name: "SandCaven1Resized.png",
    zoneId: "sandcavern",
    placement: { x: -488.24, y: -398.77, width: 108.87, height: 154.46 },
  },
  {
    name: "Nortune1Resize.png",
    zoneId: "nortune",
    placement: { x: -629.75, y: 330.75, width: 122.33, height: 142.29 },
  },
  {
    name: "Noctune2Resize.png",
    zoneId: "nortune_2",
    placement: { x: -639.22, y: 112.25, width: 134, height: 174.93 },
  },
];

const mapImageModules = import.meta.glob(
  "/src/assets/worlddata/mapimages/*.png",
  { eager: true, query: "?url", import: "default" }
);

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

/**
export default function WorldMap(props: IProps) {
  return (
    <div
      style={{
        padding: "0.5rem",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        ...props?.style,
      }}
    >
      <h2>World Map</h2>
      <MapContainer
        crs={CustomCRS}
        style={{ height: "100%", width: "100%" }}
        center={[0, 0]}
        zoom={0}
        minZoom={-5}
      >
{imageData.map((img) => {
          const bounds = getImageBounds(img.placement);
          const imageUrl = getImageUrl(img.name);
          if (!imageUrl) return null;
          return (
            <ImageOverlay
              key={img.zoneId}
              url={imageUrl}
              bounds={bounds}
              opacity={1}
              zIndex={10}
            />
          );
        })}
        <GeoJSON
          data={landmarkData}
          pointToLayer={(feature, latlng) =>
            L.marker(latlng, {
              icon: createSparkleIcon(
                feature.properties?.category === "item" ? "#9d00ff" : "#ffffff"
              ),
            })
          }
          onEachFeature={(feature, layer) => {
            if (feature.properties?.name) {
              layer.bindTooltip(feature.properties.name, {
                permanent: false,
                direction: "top",
              });
            }
          }}
        />
      </MapContainer>
    </div>
  );
}
