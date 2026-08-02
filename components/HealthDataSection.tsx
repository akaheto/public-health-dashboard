"use client";

import HealthDataCard from "./HealthDataCard";

interface CardConfig {
  datasetId: string;
  title: string;
  description: string;
  color: "red" | "orange" | "amber" | "green" | "blue" | "purple";
}

interface HealthDataSectionProps {
  title: string;
  icon: string;
  cards: CardConfig[];
}

export default function HealthDataSection({ title, icon, cards }: HealthDataSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">{icon}</span>
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <HealthDataCard
            key={card.datasetId}
            datasetId={card.datasetId}
            title={card.title}
            description={card.description}
            color={card.color}
          />
        ))}
      </div>
    </section>
  );
}
