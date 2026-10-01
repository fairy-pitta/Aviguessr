import { Routes, Route } from "react-router-dom";
import { Providers } from "./providers";
import { InkDefs } from "@/shared/ui";
import { HomePage } from "@/pages/home";
import { GamePage } from "@/pages/game";
import { DailyPage } from "@/pages/daily";

export function App() {
  return (
    <Providers>
      <InkDefs />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:id" element={<GamePage />} />
        <Route path="/daily" element={<DailyPage />} />
      </Routes>
    </Providers>
  );
}
