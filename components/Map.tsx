"use client"

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"
import { useEffect, useState } from "react"
import "leaflet/dist/leaflet.css"

export default function Map({
  onCountrySelect,
  selectedCountry
}: {
  onCountrySelect: (country: string) => void
  selectedCountry: string | null
}) {
  const [geoData, setGeoData] = useState<any>(null)

  useEffect(() => {
    fetch("/data/world-countries.geo.json")
      .then(res => res.json())
      .then(setGeoData)
  }, [])

  const defaultStyle = {
    fillColor: "lightgray",
    weight: 1,
    color: "black",
    fillOpacity: 0.6
  }

  const highlightStyle = {
    fillColor: "orange",
    weight: 2,
    color: "white",
    fillOpacity: 0.8
  }

  const onEachCountry = (feature: any, layer: any) => {
    layer.on("click", () => {
      const countryName = feature.properties.name
      onCountrySelect(countryName)
    })
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoData && (
        <GeoJSON
          data={geoData}
          onEachFeature={onEachCountry}
          style={(feature) =>
            feature.properties.name === selectedCountry
              ? highlightStyle
              : defaultStyle
          }
        />
      )}
    </MapContainer>
  )
}