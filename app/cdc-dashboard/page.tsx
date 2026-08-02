"use client";

import { useState } from "react";
import CDCDataExplorer from "@/components/CDCDataExplorer";
import StateAssessment from "@/components/StateAssessment";
import DiseaseProgression from "@/components/DiseaseProgression";

type Tab = "explorer" | "assessment" | "progression";

export default function CDCDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("explorer");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "explorer", label: "Data Explorer", icon: "📊" },
    { id: "assessment", label: "State Assessment", icon: "🏥" },
    { id: "progression", label: "Disease Progression", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">CDC Data Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analysis of infectious disease and chronic disease indicators across all 50 states
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "explorer" && <CDCDataExplorer />}
            {activeTab === "assessment" && <StateAssessment />}
            {activeTab === "progression" && <DiseaseProgression />}
          </div>
        </div>
      </div>
    </div>
  );
}
