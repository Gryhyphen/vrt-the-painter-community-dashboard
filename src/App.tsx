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
        <strong>Version:</strong> 2025.10.29 — Data last refreshed on October 29,
        2025
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
      <ColorMixer />
      <WorldMap style={{marginTop: 20}} />
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
