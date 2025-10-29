import HistoryData from "../../assets/pigmentCombos/data/enriched/enrichedPigments.json";

type Achievement = (typeof HistoryData)[number];
interface IAchievementHistoryProps {
  className?: string;
  style?: React.CSSProperties;
}

const defaultStyle = {
  padding: "0.5rem",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const emojiForResult = (result: string): string => {
  const normalized = result.toLowerCase();
  if (normalized.includes("mindscape")) return "🧠";
  if (normalized.includes("catdom")) return "🐱";
  if (normalized.includes("tree")) return "🌳";
  if (normalized.includes("mech")) return "🤖";
  if (normalized.includes("village")) return "🏘️";
  if (normalized.includes("railroad")) return "🛤️";
  if (normalized.includes("land afar")) return "🌍";
  if (normalized.includes("heart")) return "❤️";
  if (normalized.includes("abstract")) return "🎨";
  if (normalized.includes("above the clouds")) return "☁️";
  if (normalized.includes("soup kitchen")) return "🥣";
  if (normalized.includes("corroding scrap")) return "🛠️";
  if (normalized.includes("crowd of travellers")) return "👨‍👩‍👧‍👦";
  if (normalized.includes("university-bound students")) return "🎓";
  return "✨";
};

// Helper to group by month
const groupByMonth = (data: Achievement[]): Record<string, Achievement[]> => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return Object.groupBy(data, (item) =>
    formatter.format(new Date(item.datePainted))
  ) as Record<string, Achievement[]>; // I don't understand why groupby returns partials :(
};

const sorted = [...HistoryData].sort((a, b) => {
  // 1. primary: sort by date (newest first)
  const dateDiff =
    new Date(b.datePainted).getTime() -
    new Date(a.datePainted).getTime();
  if (dateDiff !== 0) return dateDiff;

  // 2. secondary: sort by firstResultDiscovery (true first)
  if (a.firstResultDiscovery !== b.firstResultDiscovery) {
    return a.firstResultDiscovery ? -1 : 1;
  }

  // 3. tertiary: sort by painter presence (known painters first)
  const aHasPainter = !!a.painter && a.painter.trim() !== "";
  const bHasPainter = !!b.painter && b.painter.trim() !== "";
  if (aHasPainter !== bHasPainter) {
    return aHasPainter ? -1 : 1;
  }

  // 4. final: sort by result, but push "abstract mess" to the end
  const aIsAbstract = a.result.toLowerCase() === "abstract mess";
  const bIsAbstract = b.result.toLowerCase() === "abstract mess";

  if (aIsAbstract && !bIsAbstract) return 1;   // a goes after b
  if (!aIsAbstract && bIsAbstract) return -1;  // b goes after a

  // normal alphabetical compare if neither/both are "abstract mess"
  return a.result.localeCompare(b.result, undefined, { sensitivity: "base" });
});


const grouped = groupByMonth(sorted);

export default function AchievementHistory(props: IAchievementHistoryProps) {
  return (
    <div
      style={{ ...defaultStyle, ...props.style }}
      className={props.className}
    >
      <h2>History</h2>
      {Object.entries(grouped).map(([monthLabel, items], index) => (
        <div key={monthLabel}>
          {/* Section Header */}
          <h3 style={{ marginBottom: 4 }}>{monthLabel}</h3>

          {/* Subtitle with count */}
          <div style={{ marginBottom: 16, fontSize: "0.95rem", color: "#666" }}>
            {items.length} painting{items.length > 1 ? "s" : ""} submitted
          </div>

          {/* Achievement Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(275px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((x, i) => {
              const isFirst = x.firstResultDiscovery;

              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#ffffff",
                    padding: 12,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: isFirst ? "3px solid transparent" : "none",
                    background: isFirst
                      ? "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #a0e9ff, #1e90ff, #b3ffff) border-box"
                      : "#ffffff",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      fontSize: "2rem",
                      background: isFirst
                        ? "linear-gradient(145deg, #d6f7ff, #a0e9ff)"
                        : "#f0f0f0",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {emojiForResult(x.result)}
                  </div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "1rem",
                        marginBottom: 4,
                      }}
                    >
                      {x.result}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#777" }}>
                      <strong>{x.datePainted}</strong>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>
                      <strong>Painted by:</strong> <em>{x.painter ?? "(unknown)"}</em>
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#555",
                        marginTop: 4,
                      }}
                    >
                      <strong>Combo:</strong> {x.pigment1} + {x.pigment2}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stylish Divider */}
          {index < Object.entries(grouped).length - 1 && (
            <div
              style={{
                marginTop: 32,
                marginBottom: 32,
                height: 1,
                background: "linear-gradient(to right, #ccc, #eee, #ccc)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
