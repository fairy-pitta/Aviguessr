import { Routes, Route } from "react-router-dom";
import { Providers } from "./providers";
import { InkDefs } from "@/shared/ui";
import { HomePage } from "@/pages/home";
import { GamePage } from "@/pages/game";
import { DailyPage } from "@/pages/daily";
import { ListPage } from "@/pages/list";
import { NotFoundPage } from "@/pages/not-found";

export function App() {
  return (
    <Providers>
      <InkDefs />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:id" element={<GamePage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/list" element={<ListPage />} />
        {/*
          Without this the router matched nothing and rendered nothing, so a
          mistyped address — or a link to a page the deployed build does not
          have yet — was a blank white screen.
        */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Providers>
  );
}
