import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Layer, PathOptions } from "leaflet";
import type {
  Feature,
  Geometry,
  GeoJsonProperties,
  FeatureCollection,
} from "geojson";
import { featureCountryCode } from "../lib/featureCode";
import "leaflet/dist/leaflet.css";

type WorldMapProps = {
  onCountrySelect?: (code: string) => void;
  selectedCountry?: string | null;
  resultMode?: boolean;
  highlightCountries?: {
    correct: string[];
    incorrect?: string;
  };
};

/*
 * A printed range map, not a slippy map: no imagery, and land that reads as
 * the same stock as the page around it. Anything marked is hatched rather
 * than flooded, because hatching is how a region gets filled in by hand —
 * the patterns live in InkDefs so every screen hatches identically.
 */
const PAPER = "#e1e5dd";
const EDGE = "#8e9c8d";
const INK = "#1b2a28";
const RANGE = "#5e7a2e";
const MISS = "#7d3b4f";

/*
 * Every country has to be reachable, so the map is fitted to the inhabited
 * world rather than given a fixed centre and zoom: at a fixed zoom a wide,
 * short page cropped Australia off the bottom and Asia off the right.
 */
const WORLD: [[number, number], [number, number]] = [
  [-57, -169],
  [78, 179],
];

/**
 * Leaflet measures its container once, so a map laid out inside a flex column
 * renders at the wrong size the moment anything above or below it changes
 * height.
 */
function Fitter() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    // Once the player has moved the map themselves, a refit would undo it
    let touched = false;
    const markTouched = () => {
      touched = true;
    };
    map.on("zoomstart dragstart", markTouched);

    // A fit against a box with no height produces an overlay of height zero
    // and the map draws nothing at all, so wait for the spread to lay out
    let pending = 0;
    let retries = 0;
    const fit = () => {
      map.invalidateSize();
      const { x, y } = map.getSize();
      if ((x === 0 || y === 0) && retries < 30) {
        retries += 1;
        pending = requestAnimationFrame(fit);
        return;
      }
      if (!touched) map.fitBounds(WORLD, { animate: false });
    };
    fit();

    if (typeof ResizeObserver === "undefined") {
      return () => {
        cancelAnimationFrame(pending);
        map.off("zoomstart dragstart", markTouched);
      };
    }
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => {
      cancelAnimationFrame(pending);
      observer.disconnect();
      map.off("zoomstart dragstart", markTouched);
    };
  }, [map]);

  return null;
}

export function WorldMap({
  onCountrySelect,
  selectedCountry,
  resultMode = false,
  highlightCountries,
}: WorldMapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    fetch("/data/world-countries.geo.json")
      .then((res) => res.json())
      .then(setGeoData);
  }, []);

  const getStyle = useCallback(
    (feature?: Feature<Geometry, GeoJsonProperties>): PathOptions => {
      const code = featureCountryCode(feature?.properties);

      const land: PathOptions = {
        fillColor: PAPER,
        fillOpacity: 1,
        color: EDGE,
        weight: 0.9,
      };

      // No ISO identity means it cannot be guessed, so it reads as inert
      if (!code) return { ...land, fillOpacity: 0.5 };

      if (resultMode && highlightCountries) {
        if (highlightCountries.correct.includes(code)) {
          return {
            fillColor: "url(#hatch-range)",
            fillOpacity: 1,
            color: RANGE,
            weight: 1.3,
          };
        }
        if (code === highlightCountries.incorrect) {
          return {
            fillColor: "url(#hatch-miss)",
            fillOpacity: 1,
            color: MISS,
            weight: 1.3,
          };
        }
        return land;
      }

      if (code === selectedCountry) {
        return {
          fillColor: "url(#hatch-ink)",
          fillOpacity: 1,
          color: INK,
          weight: 1.3,
        };
      }

      return land;
    },
    [selectedCountry, resultMode, highlightCountries]
  );

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJsonProperties>, layer: Layer) => {
      layer.on("click", () => {
        const code = featureCountryCode(feature.properties);
        if (!resultMode && onCountrySelect && code) {
          onCountrySelect(code);
        }
      });
    },
    [onCountrySelect, resultMode]
  );

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle(getStyle);
    }
  }, [getStyle]);

  return (
    <MapContainer
      center={[14, 8]}
      zoom={2}
      minZoom={1}
      maxZoom={6}
      zoomSnap={0}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <Fitter />
      {geoData && (
        <GeoJSON
          ref={geoJsonRef as React.Ref<L.GeoJSON>}
          data={geoData}
          onEachFeature={onEachFeature}
          style={getStyle}
        />
      )}
    </MapContainer>
  );
}
