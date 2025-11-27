import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ImageOverlay, MapContainer, GeoJSON } from "react-leaflet";
import createSparkleIcon from "./components/SparkleIcon";
import backgroundGeo from "../../assets/worldData/mapimages/backgroundGeo.json";
import type { FeatureCollection, Point } from "geojson";
import rawLandmarkGeo from "../../assets/worldData/landmarksGeo.json";
import { useEffect, useRef, useState } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { useTransform } from "motion/react";
const landmarkGeo = rawLandmarkGeo as FeatureCollection<Point>;

interface IProps {
  style?: React.CSSProperties;
}

// --- Trick prettier ---

// lets prettier format my css strings correctly without me using js-in-css
// (this is the identity for template literals)
function css(strings: TemplateStringsArray, ...exprs: unknown[]): string {
  return String.raw({ raw: strings }, ...exprs);
}

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

// --- Image data ---
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

// --- Menu button ---

const POSITION_CLASSES = {
  bottomleft: "leaflet-bottom leaflet-left",
  bottomright: "leaflet-bottom leaflet-right",
  topleft: "leaflet-top leaflet-left",
  topright: "leaflet-top leaflet-right",
};

const snapPoints = [0, 0.5, 1];

export default function WorldMap(props: IProps) {
  const mapRef = useRef<L.Map | null>(null);
  useEffect(() => {
    setTimeout(() => {
      const map = mapRef.current;
      if (!map) throw new Error("Map wasn't loaded!");

      map.zoomControl.setPosition("bottomright");
    }, 0);
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const ref = useRef<SheetRef>(null);
  // Add padding bottom based on how far the sheet is from being fully open
  const paddingBottom = useTransform(() => {
    return ref.current?.y.get() ?? 0;
  });
  const [activeZone, setActiveZone] = useState("lahanVillage");
  useEffect(() => {
    const backgroundGeoElement = backgroundGeo.features.find(
      (x) => x.id === activeZone
    );
    if (!backgroundGeoElement) return;
    mapRef.current?.fitBounds(getImageProps(backgroundGeoElement).bounds, { animate: true, duration: 1 });
  });
  // lil hack to make the first time someone clicks on an item, it brings up the menu
  const [activePickup, setActivePickup] = useState("none selected");

  return (
    <>
      <div style={{ ...props.style }}>
        <MapContainer
          ref={mapRef}
          crs={CustomCRS}
          style={{ height: "100%", width: "100%" }}
          center={[0, 0]}
          zoom={0}
          minZoom={-5}
        >
          <div
            className={POSITION_CLASSES["topleft"]}
            style={{ display: "flex" }}
          >
            <div
              className="leaflet-control leaflet-bar"
              style={{ alignSelf: "center" }}
            >
              <a
                href="#"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  setDrawerOpen((current) => !current);
                }}
              >
                <span aria-hidden="true">☰</span>
              </a>
            </div>
          </div>
          {backgroundGeo.features.map((img) => {
            return (
              <ImageOverlay
                {...getImageProps(img)}
                key={getImageProps(img).key}
                opacity={1}
                zIndex={10}
              />
            );
          })}
          <GeoJSON
            data={landmarkGeo}
            pointToLayer={(feature, latlng) =>
              L.marker(latlng, {
                icon: createSparkleIcon(
                  feature.properties?.category === "item"
                    ? "#9d00ff"
                    : "#ffffff"
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

        <Sheet
          ref={ref}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          snapPoints={snapPoints}
          initialSnap={1}
        >
          <Sheet.Container>
            <Sheet.Header style={{ backgroundColor: "rgb(249, 249, 249)" }} />
            <Sheet.Content
              scrollStyle={{ paddingBottom }}
              disableDrag
              className="inspector"
            >
              <style>
                {css`
                  .inspector {
                    font-family: sans-serif;

                    menu {
                      margin: 0;
                      padding: 0;
                      list-style: none;
                    }

                    li {
                      padding: 12px 15px;
                      border-bottom: 1px solid #2a2a2a;

                      font-size: 14px;
                      cursor: pointer;
                      transition: all 0.2s;

                      //   &:last-child {
                      //     border-bottom: none;
                      //   }

                      &.active {
                        border-left: 4px solid #9d00ff;
                        background: #b2b2b2;
                      }

                      &:hover {
                        background: #e0e0e0;
                      }
                    }

                    .tabs {
                      display: grid;
                      grid-template-columns: repeat(3, 1fr);
                      grid-template-rows: auto 1fr;

                      details {
                        display: grid;
                        grid-column: 1 / -1;
                        grid-row: 1 / span 2;
                        grid-template-columns: subgrid;
                        grid-template-rows: subgrid;

                        &::details-content {
                          grid-row: 2;
                          grid-column: 1 / -1;
                          padding: 1rem;
                          z-index: 1;
                        }
                        &:not([open])::details-content {
                          display: none;
                        }
                        &[open] > summary {
                          pointer-events: none;
                        }
                      }

                      summary {
                        background-color: rgb(249, 249, 249);
                        grid-column: var(--n) / span 1;
                        grid-row: 1;
                        display: grid;
                        cursor: pointer;
                        z-index: 1;
                        grid-template-rows: auto auto;
                        justify-items: center;
                        align-items: center;
                        position: sticky;
                        top: 0;
                        z-index: 10;
                      }

                      details[open] summary {
                        font-weight: bold;

                        .pill {
                          display: inline-flex;
                          align-items: center;
                          justify-content: center;
                          background-color: rgba(157, 0, 255, 0.2);
                          border-radius: 9999px;
                          padding: 0.2rem 1.25rem;
                          transition: padding 0.3s ease-in-out;
                        }
                      }
                      .pill {
                        padding: 0.2rem 0rem;
                      }
                    }
                  }
                `}
              </style>
              <div className="tabs">
                <details name="alpha" open>
                  <summary
                    style={{
                      gridColumn: "1 / span 1",
                    }}
                  >
                    <span className="pill">
                      <span
                        style={{ fontSize: "1rem", filter: "grayscale(100%)" }}
                      >
                        🗺️
                      </span>
                    </span>
                    <span style={{ fontSize: "0.9rem", color: "#555" }}>
                      Zones
                    </span>
                  </summary>
                  <div>
                    <menu
                      onClick={(e: React.MouseEvent<HTMLMenuElement>) =>
                        setActiveZone((e.target as HTMLElement).innerText)
                      }
                    >
                      {backgroundGeo.features.map((x) => (
                        <li
                          key={x.id}
                          className={`${x.id === activeZone && "active"}`}
                        >
                          {x.id}
                        </li>
                      ))}
                    </menu>
                  </div>
                </details>
                <details name="alpha">
                  <summary
                    style={{
                      gridColumn: "2 / span 1",
                    }}
                  >
                    <span className="pill">
                      <span
                        style={{ fontSize: "1rem", filter: "grayscale(100%)" }}
                      >
                        ✨
                      </span>
                    </span>
                    <span style={{ fontSize: "0.9rem", color: "#555" }}>
                      Items
                    </span>
                  </summary>
                  <div>
                    <menu
                      onClick={(e: React.MouseEvent<HTMLMenuElement>) =>
                        setActivePickup((e.target as HTMLElement).innerText)
                      }
                    >
                      {rawLandmarkGeo.features
                        .filter((x) => x.properties.zone === activeZone)
                        .map((x) => (
                          <li
                            key={x.properties.name}
                            className={`${
                              x.properties.name === activePickup && "active"
                            }`}
                          >
                            {x.properties.name}
                          </li>
                        ))}
                    </menu>
                  </div>
                </details>
                <details
                  name="alpha"
                  open={
                    activePickup ===
                    rawLandmarkGeo.features.find(
                      (x) => x.properties.name === activePickup
                    )?.properties.name
                  }
                >
                  <summary
                    style={{
                      gridColumn: "3 / span 1",
                    }}
                  >
                    <span className="pill">
                      <span
                        style={{ fontSize: "1rem", filter: "grayscale(100%)" }}
                      >
                        📚
                      </span>
                    </span>
                    <span style={{ fontSize: "0.9rem", color: "#555" }}>
                      Details
                    </span>
                  </summary>
                  <div>TODO: Implement this</div>
                </details>
              </div>
            </Sheet.Content>
          </Sheet.Container>
        </Sheet>
      </div>
    </>
  );
}
