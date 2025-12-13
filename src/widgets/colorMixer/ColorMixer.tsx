import Select from "react-select";
import PigmentData from "../../assets/pigmentCombos/data/enriched/enrichedPigments.json";
import { useMemo, useState } from "react";
import lunr from "lunr";
import LandmarkData from "../../assets/worldData/landmarksGeo.json";

const symmetricalKnownCombos = PigmentData.flatMap((x) => [
  x,
  { ...x, pigment1: x.pigment2, pigment2: x.pigment1 },
]);

const allPossiblePigments = Array.from(
  new Set(symmetricalKnownCombos.map((combo) => combo.pigment1))
);
const allPossibleCombos = allPossiblePigments.flatMap((p1) =>
  allPossiblePigments
    .filter((p2) => p2 !== p1)
    .map((p2) => ({ pigment1: p1, pigment2: p2 }))
);

/**
 * Dirty hack to calculate region compatibility. Should be moved to enrichment in the pipeline at some point.
 * @param pigment1
 * @param pigment2
 * @returns
 */
function CalculateRegionCompatibility(pigment1: string, pigment2: string) {
  // Dirty hack, reusing the landmark datasource because if I had to use the raw pigment data
  // then I would need to backdate, map and cleanup the zone ids.
  // TODO: Enrich pigment data with zones from world data, rather then calculating on the fly.
  const pigment1Landmark = LandmarkData.features.find((x) =>
    x.properties.name.match(new RegExp(pigment1, "i"))
  );
  const pigment2Landmark = LandmarkData.features.find((x) =>
    x.properties.name.match(new RegExp(pigment2, "i"))
  );
  if (!(pigment1Landmark && pigment2Landmark)) return true; // We don't know so assume true

  const zone1 = pigment1Landmark.properties.zone;
  const zone2 = pigment2Landmark.properties.zone;
  // Can't mix pigments in the same region.
  // TODO: Zones != Regions
  // Would need to bring in the backgroundGeo to calculate the regions.
  return zone1 !== zone2;
}

const currentComboKnowledge = allPossibleCombos
  .map(({ pigment1, pigment2 }) => {
    const compatible = CalculateRegionCompatibility(pigment1, pigment2);
    if (!compatible) {
      return {
        pigment1,
        pigment2,
        result: "Impossible",
        tried: false,
      };
    }

    const known = symmetricalKnownCombos.find(
      (combo) => combo.pigment1 === pigment1 && combo.pigment2 === pigment2
    );

    return {
      pigment1,
      pigment2,
      result: known?.result || "Unknown",
      tried: !!known?.result,
    };
  })
  .sort((a, b) => {
    if (a.tried === b.tried) {
      return a.pigment2.localeCompare(b.pigment2);
    }
    return a.tried ? 1 : -1;
  });

function CalculateKnownCombos(pigment: string) {
  const pigmentCombos = symmetricalKnownCombos.filter(
    (x) => x.pigment1 === pigment
  );
  return Object.keys(Object.groupBy(pigmentCombos, (x) => x.result)).length;
}

// Extract unique pigment names
const pigmentOptions = allPossiblePigments
  .map((pigment) => ({
    value: pigment,
    label: `${pigment} (${CalculateKnownCombos(pigment)})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Combo search index
const comboSearchIndex = lunr(function () {
  this.ref("id");
  this.field("pigment1");
  this.field("pigment2");

  currentComboKnowledge.forEach((combo, i) => {
    this.add({
      id: i.toString(),
      pigment2: combo.pigment2,
      pigment1: combo.pigment1,
    });
  });
});

interface IColorMixerProps {
  style?: React.CSSProperties;
}

export default function ColorMixer(props: IColorMixerProps) {
  const [selectedPigment, setSelectedPigment] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [highMatches, lowMatches] = useMemo(() => {
    if (!searchTerm.trim()) {
      const filtered = currentComboKnowledge.filter(
        (combo) => combo.pigment1 === selectedPigment
      );
      return [[], filtered];
    }

    let results: lunr.Index.Result[] = [];
    try {
      results = comboSearchIndex.search(
        `pigment2:${searchTerm}~2 pigment2:${searchTerm}*`
      );
    } catch (err) {
      console.warn("Lunr search error:", err);
      return [
        [],
        currentComboKnowledge.filter(
          (combo) => combo.pigment1 === selectedPigment
        ),
      ];
    }

    const scoreThreshold = -5.0;

    const scoredCombos = results
      .map((r) => ({
        combo: currentComboKnowledge[parseInt(r.ref)],
        score: r.score,
        index: parseInt(r.ref),
      }))
      .filter((x) => x.combo.pigment1 === selectedPigment);

    const highIds = scoredCombos
      .filter((r) => r.score > scoreThreshold)
      .map((r) => r.index);

    const high = scoredCombos
      .filter((r) => r.score > scoreThreshold)
      .map((r) => r.combo);

    const low = currentComboKnowledge
      .filter((_, i) => !highIds.includes(i))
      .filter((combo) => combo.pigment1 === selectedPigment);

    return [high, low];
  }, [searchTerm, selectedPigment]);

  return (
    <div
      style={{
        padding: "0.5rem",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        ...props.style,
      }}
    >
      <h2>Color Mixer</h2>
      <div style={{ marginBottom: "1rem", maxWidth: "400px" }}>
        <label
          htmlFor="pigment-select"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Select a pigment:
        </label>
        <Select
          inputId="pigment-select"
          options={pigmentOptions}
          value={
            pigmentOptions.find((opt) => opt.value === selectedPigment) || null
          }
          onChange={(option) => setSelectedPigment(option?.value || "")}
          placeholder="Choose a pigment..."
          isClearable
        />
      </div>

      {selectedPigment && (
        <>
          <div style={{ marginTop: "1rem" }}>
            <input
              type="text"
              placeholder="Search pigment combinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "95%", padding: "0.5rem" }}
            />
          </div>

          <h3 style={{ marginTop: "1rem" }}>
            All combinations with <em>{selectedPigment}</em>:
          </h3>
        </>
      )}

      {highMatches.length > 0 && (
        <>
          <h4>❗ Most Relevant Matches</h4>
          <ul>
            {highMatches.map(({ pigment2, tried, result }) => (
              <li key={pigment2}>
                {selectedPigment} + {pigment2}{" "}
                {result === "Impossible" ? (
                  <span style={{ color: "orange" }}>→ {result}</span>
                ) : tried ? (
                  <span style={{ color: "green" }}>→ {result}</span>
                ) : (
                  <span style={{ color: "gray" }}>(untried)</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {lowMatches.length > 0 && (
        <>
          <h4 style={{ marginTop: "1rem" }}>🔍 Search Results</h4>
          <ul>
            {lowMatches.map(({ pigment2, pigment1, tried, result }) => (
              <li key={`${pigment1}-${pigment2}`}>
                {pigment1} + {pigment2}{" "}
                {result === "Impossible" ? (
                  <span style={{ color: "orange" }}>→ {result}</span>
                ) : tried ? (
                  <span style={{ color: "green" }}>→ {result}</span>
                ) : (
                  <span style={{ color: "gray" }}>(untried)</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
