import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ImageOverlay, MapContainer, GeoJSON } from "react-leaflet";
import createSparkleIcon from "./components/SparkleIcon";
import backgroundGeo from "../../assets/worldData/mapimages/backgroundGeo.json";
import type { FeatureCollection, Point } from "geojson";
import { useEffect, useRef, useState } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { useTransform } from "motion/react";
import Markdown from "react-markdown";
import slugify from "@sindresorhus/slugify";
import remarkGfm from "remark-gfm";
import rawLandmarkGeo from "../../assets/worldData/landmarksGeo.json";
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
  "/src/assets/worldData/mapimages/*.png",
  { eager: true, query: "?url", import: "default" }
);
// Build a lookup keyed by basename
const imageLookup: Record<string, string> = {};
for (const [path, url] of Object.entries(mapImageModules)) {
  const fileName = path.split("/").pop()!;
  imageLookup[fileName] = url as string;
}

function getImageProps(item: (typeof backgroundGeo.features)[number]) {
  function getImageUrl(fileName: string) {
    return imageLookup[fileName];
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

// --- details data ---
const detailsModules = import.meta.glob<string>(
  "/src/assets/worldData/details/*.md",
  { eager: true, query: "?raw", import: "default" }
);

const detailsLookup: Record<string, string> = {};
for (const [path, content] of Object.entries(detailsModules)) {
  const fileName = path.split("/").pop()!; // e.g. "foo.md"
  detailsLookup[fileName] = content;
}

function getDetails(slug: string) {
  return detailsLookup[`${slug}.md`];
}

export default function WorldMap(props: IProps) {
  const mapRef = useRef<L.Map | null>(null);
  useEffect(() => {
    setTimeout(() => {
      const map = mapRef.current;
      if (!map) throw new Error("Map wasn't loaded!");

      map.zoomControl.setPosition("bottomright");
    }, 1);
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const sheetRef = useRef<SheetRef>(null);
  const infoTabRef = useRef<HTMLDetailsElement>(null);
  // Add padding bottom based on how far the sheet is from being fully open
  const paddingBottom = useTransform(() => {
    return sheetRef.current?.y.get() ?? 0;
  });
  const [activeZone, setActiveZone] = useState("lahanVillage");
  useEffect(() => {
    const backgroundGeoElement = backgroundGeo.features.find(
      (x) => x.id === activeZone
    );
    if (!backgroundGeoElement) return;
    mapRef.current?.fitBounds(getImageProps(backgroundGeoElement).bounds, {
      animate: true,
      duration: 1,
    });
  }, [activeZone]);
  const [activePickup, setActivePickup] = useState("none selected");

  const hasDetails =
    !!detailsModules[
      `/src/assets/worldData/details/${slugify(activePickup)}.md`
    ];

  return (
    <div style={{ backgroundColor: "rgb(249, 249, 249)", ...props.style }}>
      <h2>World Map</h2>

      <MapContainer
        ref={mapRef}
        crs={CustomCRS}
        style={{ height: "80vh", width: "100%" }}
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
                feature.properties?.category === "item" ? "#9d00ff" : "#ffffff"
              ),
            })
          }
          onEachFeature={(feature, layer) => {
            if (feature.properties?.name && feature.geometry.type === "Point" && feature.geometry?.coordinates) {
              const [x, z] = feature.geometry.coordinates;

              // Tooltip content: name + coordinates
              const tooltipContent = `
                <div>
                  <strong>${feature.properties.name}</strong><br/>
                  x: ${x}, z: ${z}
                </div>
              `;

              layer.bindTooltip(tooltipContent, {
                permanent: false,
                direction: "top",
              });

              layer.on("click", () => {
                setActivePickup(feature.properties.name);
                setActiveZone(feature.properties?.zone);
                setDrawerOpen(true);
                setTimeout(() => (infoTabRef.current!.open = true), 2);
              });
            }
          }}
        />
      </MapContainer>
      <div style={{ textAlign: "right" }}>
        World by{" "}
        <a href="#" target="_blank">
          PMONickpop123
        </a>{" "}
        | Map renders created with Magic Compass by{" "}
        <a href="#" target="_blank">
          Melting3D
        </a>
      </div>

      <Sheet
        ref={sheetRef}
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

                    details[open] > summary {
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
                    onClick={(e: React.MouseEvent<HTMLMenuElement>) => {
                      const name = (e.target as HTMLElement).innerText;
                      setActivePickup(name);

                      const map = mapRef.current;
                      if (!map) return;

                      // Close existing
                      map.eachLayer((l) => {
                        if (l.getTooltip && l.getTooltip()) {
                          l.closeTooltip();
                        }
                      });
                      // open current
                      map.eachLayer((layer) => {
                        if (layer instanceof L.Marker) {
                          const feature = layer.feature;
                          if (feature?.properties?.name === name) {
                            layer.openTooltip();
                          }
                        }
                      });
                      const landmark = landmarkGeo.features.find(
                        (x) => x?.properties?.name === name
                      );

                      if (!landmark) return;
                      // GeoJSON coordinates are [lng, lat], so flip them
                      const [lng, lat] = landmark.geometry.coordinates;
                      map.flyTo([lat, lng], 3, {
                        animate: true,
                        duration: 1,
                      });
                    }}
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
              <details name="alpha" ref={infoTabRef}>
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
                <div>
                  {hasDetails ? (
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Disabling because node is used to exclude it from props
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            style={{ maxWidth: "100%", height: "auto" }}
                            loading="lazy"
                          />
                        ),
                      }}
                    >
                      {getDetails(slugify(activePickup))}
                    </Markdown>
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <p>No details available for this item yet.</p>
                      <a
                        href="https://docs.google.com/spreadsheets/d/12VMjZh63YEKQ3GSN5Saf4jmJjQErpRrsmLdi1e1SLAY/edit?gid=660683806#gid=660683806"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Contribute a description or image
                      </a>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </Sheet.Content>
        </Sheet.Container>
      </Sheet>
    </div>
  );
}
