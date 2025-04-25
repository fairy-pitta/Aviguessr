'use client'

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import BirdImage from "@/components/BirdImage"

const Map = dynamic(() => import("../components/Map"), { ssr: false })

type Bird = {
  name: string
  imageUrl: string
  countries: string[]
}

export default function HomePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [bird, setBird] = useState<Bird | null>(null)

  useEffect(() => {
    const fetchBird = async () => {
      try {
        const res = await fetch("/data/birds.json")
        const birds: Bird[] = await res.json()
        const random = birds[Math.floor(Math.random() * birds.length)]
        setBird(random)
      } catch (err) {
        console.error("鳥データの取得に失敗しました:", err)
      }
    }
    fetchBird()
  }, [])

  return (
    <main className="relative">
      <Map
        selectedCountry={selectedCountry}
        onCountrySelect={(name) => {
          console.log("選択された国:", name)
          setSelectedCountry(name)
        }}
      />
      {bird && (
        <BirdImage
          imageUrl={bird.imageUrl}
          name={bird.name}
        />
      )}
    </main>
  )
}