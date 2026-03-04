"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export interface RadarDataItem {
  subject: string;
  [key: string]: string | number;
}

interface RadarChartComponentProps {
  data: RadarDataItem[];
  dataKeys: { key: string; color: string; name: string }[];
}

export default function RadarChartComponent({
  data,
  dataKeys,
}: RadarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E8E8E8" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#666666", fontSize: 12 }} />
        <PolarRadiusAxis tick={{ fill: "#666666", fontSize: 10 }} />
        {dataKeys.map((dk) => (
          <Radar
            key={dk.key}
            name={dk.name}
            dataKey={dk.key}
            stroke={dk.color}
            fill={dk.color}
            fillOpacity={0.15}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8E8E8", fontSize: "13px" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
