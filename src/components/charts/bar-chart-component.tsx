"use client";

import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
} from "recharts";

interface BarDataItem {
  name: string;
  [key: string]: string | number;
}

interface BarDataKey {
  key: string;
  color: string;
  name: string;
}

interface BarChartComponentProps {
  data: BarDataItem[];
  dataKeys: BarDataKey[];
  title?: string;
  xAxisKey?: string;
}

export default function BarChartComponent({
  data,
  dataKeys,
  title,
  xAxisKey = "name",
}: BarChartComponentProps) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: "#1A1A1A", fontSize: 12 }}
            tickLine={{ stroke: "#d1d5db" }}
            axisLine={{ stroke: "#d1d5db" }}
          />
          <YAxis
            tick={{ fill: "#1A1A1A", fontSize: 12 }}
            tickLine={{ stroke: "#d1d5db" }}
            axisLine={{ stroke: "#d1d5db" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "#1B3A5C", fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
          />
          {dataKeys.map((dk) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.name}
              fill={dk.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
