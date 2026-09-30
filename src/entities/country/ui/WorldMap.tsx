import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import type { Feature, Geometry, GeoJsonProperties, FeatureCollection } from "geojson";
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
      if (!code) return {};

      if (resultMode && highlightCountries) {
        if (highlightCountries.correct.includes(code)) {
          return {
            fillColor: "#22c55e",
            weight: 2,
            color: "#15803d",
            fillOpacity: 0.7,
          };
        }
        if (code === highlightCountries.incorrect) {
          return {
            fillColor: "#ef4444",
            weight: 2,
            color: "#b91c1c",
            fillOpacity: 0.7,
          };
        }
      }

      if (code === selectedCountry) {
        return {
          fillColor: "#f59e0b",
          weight: 2,
          color: "white",
          fillOpacity: 0.8,
        };
      }

      return {
        fillColor: "#d1d5db",
        weight: 1,
        color: "#6b7280",
        fillOpacity: 0.4,
      };
    },
    [selectedCountry, resultMode, highlightCountries]
  );

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJsonProperties>, layer: Layer) => {
      layer.on("click", (_e: LeafletMouseEvent) => {
        const code = featureCountryCode(feature.properties);
        if (!resultMode && onCountrySelect && code) {
          onCountrySelect(code);
        }
      });
    },
    [onCountrySelect, resultMode]
  );

  // Force re-render GeoJSON when style deps change
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle(getStyle);
    }
  }, [getStyle]);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
