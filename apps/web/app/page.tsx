"use client";

import { motion } from "framer-motion";
import { ControlSlider } from "../components/control-slider";
import { useExplorationStore } from "../lib/store";

const sampleRecommendations = [
  {
    title: "Patriot",
    reason: "Combina humor oscuro con conspiración y runtime compacto."
  },
  {
    title: "Counterpart",
    reason: "Sci-fi adulta con tono cerebral similar a tus ratings de Severance y Dark."
  },
  {
    title: "The Leftovers",
    reason: "Aumenta exploración con prestigio narrativo y baja obviedad mainstream."
  }
];

export default function HomePage() {
  const { risk, niche, exploration, setControl } = useExplorationStore();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-violet-300">Trackt Recommendation PWA</p>
        <h1 className="text-3xl font-semibold">Recomendaciones híbridas con Trakt + IA</h1>
        <p className="text-sm text-slate-300">
          Mobile-first, installable y con controls para ajustar riesgo, nicho y exploración.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium">Controles de exploración</h2>
        <ControlSlider label="Seguro ↔ Arriesgado" value={risk} onChange={(value) => setControl("risk", value)} />
        <ControlSlider label="Mainstream ↔ Nicho" value={niche} onChange={(value) => setControl("niche", value)} />
        <ControlSlider
          label="Parecido ↔ Exploratorio"
          value={exploration}
          onChange={(value) => setControl("exploration", value)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Resultados explicados (JSON-backed)</h2>
        {sampleRecommendations.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <h3 className="font-semibold text-violet-300">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{item.reason}</p>
          </motion.article>
        ))}
      </section>
    </main>
  );
}
