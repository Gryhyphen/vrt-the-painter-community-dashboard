import L from "leaflet";

export default function createSparkleIcon(shadowColor = "#9d00ff") {
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