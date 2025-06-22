"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from "chart.js"

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ActivityData {
  date: string
  plays: number
  downloads: number
}

interface ActivityChartProps {
  data: ActivityData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const chartData: ChartData<"line"> = {
    labels: data.map(item => new Date(item.date).toLocaleDateString("ru-RU", { weekday: "short" })),
    datasets: [
      {
        label: "Прослушивания",
        data: data.map(item => item.plays),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      },
      {
        label: "Скачивания",
        data: data.map(item => item.downloads),
        borderColor: "rgb(14, 165, 233)",
        backgroundColor: "rgba(14, 165, 233, 0.5)",
        tension: 0.3,
      }
    ]
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <div className="w-full h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  )
} 