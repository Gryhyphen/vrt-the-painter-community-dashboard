import YoutubeFeed from "./widgets/youtubeFeed/YoutubeFeed";
import youtubeData from "./assets/youtubeData/youtubeData.ts";
import AchievementHistory from "./widgets/achievementHistory/AchievementHistory.tsx";
import ColorMixer from "./widgets/colorMixer/ColorMixer.tsx";
import WorldMap from "./widgets/worldMap/WorldMap.tsx";

function App() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h1>VRT: The Painter 1 Revised - Community Dashboard</h1>
      <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1rem" }}>
        <strong>Version:</strong> 2025.12.07 — Data last refreshed on December
        04, 2025
      </div>

      <div>
        <p>
          🧪 This pigment combination data was lovingly collected by the VRT
          community and is available in the
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
            community spreadsheet
          </a>
          .
        </p>
        <p>
          📣 Want to help? Please consider contributing your own results and
          discoveries to the spreadsheet. Every entry helps!
        </p>
      </div>

      <details
        open
        style={{
          backgroundColor: "rgb(249, 249, 249)",
          marginTop: "0.5rem",
          paddingTop: 20,
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            color: "#007BFF",
            fontWeight: 500,
            paddingBottom: "0.5rem",
          }}
        >
          <span style={{ marginRight: "0.25rem" }}>Hide/Show World Map</span>
        </summary>
        <a
          href="/vrt-the-painter-community-dashboard/tools/mapcontribute/index.html"
          style={{
            fontSize: "0.8rem",
            color: "#28a745",
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          + Add location
        </a>
        <WorldMap
          style={{
            marginTop: -20,
            paddingBottom: "1.5rem",
            height: "90vh",
          }}
        />
      </details>

      <ColorMixer style={{ marginTop: 20 }} />
      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexWrap: "wrap", // allow right column to wrap under left
          gap: 20, // spacing between columns
          alignItems: "flex-start", // align tops
        }}
      >
        <AchievementHistory style={{ flexGrow: 2 }} />
        <YoutubeFeed videoUrls={youtubeData} />
      </div>
    </div>
  );
}

export default App;
