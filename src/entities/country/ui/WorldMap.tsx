import { MapContainer, GeoJSON } from "react-leaflet";
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
 * A printed range map, not a slippy map: no imagery, two washes, and land that
 * reads as the same stock as the page around it.
 */
const PAPER = "#e1e5dd";
const EDGE = "#b9c3b8";
const INK = "#1b2a28";
const RANGE = "#5e7a2e";
const MISS = "#7d3b4f";

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
        weight: 0.6,
      };

      // No ISO identity means it cannot be guessed, so it reads as inert
      if (!code) return { ...land, fillOpacity: 0.5 };

      if (resultMode && highlightCountries) {
        if (highlightCountries.correct.includes(code)) {
          return {
            fillColor: RANGE,
            fillOpacity: 0.78,
            color: RANGE,
            weight: 1,
          };
        }
        if (code === highlightCountries.incorrect) {
          return { fillColor: MISS, fillOpacity: 0.72, color: MISS, weight: 1 };
        }
        return land;
      }

      if (code === selectedCountry) {
        return { fillColor: INK, fillOpacity: 0.88, color: INK, weight: 1 };
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
      center={[24, 12]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
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
