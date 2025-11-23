import "leaflet/dist/leaflet.css";
import { GeoJSON, MapContainer } from "react-leaflet";
import L, { CircleMarker } from "leaflet";
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
        style={{ height: "80vh" }}
        center={[0, 0]}
        zoom={0}
        minZoom={-5}
      >
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
                permanent: false, // or true if you want always visible
                direction: "top",
              });
            }
          }}
        />
      </MapContainer>
    </div>
  );
}
