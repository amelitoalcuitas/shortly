import { useState, useEffect } from "react";
import { SpinnerGap, ChartLine } from "@phosphor-icons/react";
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
  ChartOptions,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { urlService } from "../../services";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UrlAnalyticsChartProps {
  urlId: string;
  shortCode: string;
}

const UrlAnalyticsChart = ({ urlId, shortCode }: UrlAnalyticsChartProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    dailyClicks: Array<{ date: string; count: number }>;
  } | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await urlService.getUrlAnalytics(urlId, days);
        setAnalyticsData(data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [urlId, days]);

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
  };

  // Format date for display (e.g., "May 15")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Prepare chart data
  const chartData: ChartData<"line"> | null = analyticsData
    ? {
        labels: analyticsData.dailyClicks.map((item) => formatDate(item.date)),
        datasets: [
          {
            label: "Clicks",
            data: analyticsData.dailyClicks.map((item) => Number(item.count)),
            borderColor: "#ff0054",
            backgroundColor: "rgba(255, 0, 84, 0.1)",
            borderWidth: 2,
            pointBackgroundColor: "#ff0054",
            pointRadius: 4,
            tension: 0.2,
            fill: true,
          },
        ],
      }
    : null;

  // Chart options
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#fff",
        bodyColor: "#fff",
        titleFont: {
          family: "Poppins",
          size: 14,
        },
        bodyFont: {
          family: "Poppins",
          size: 12,
        },
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = Number(context.raw);
            return `${value} click${value === 1 ? "" : "s"}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            family: "Poppins",
          },
          callback: function (value) {
            return Number(value);
          }, // Remove leading zeros
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "Poppins",
          },
        },
      },
    },
  };

  // Calculate total clicks
  const totalClicks = analyticsData
    ? analyticsData.dailyClicks.reduce((sum, item) => sum + item.count, 0)
    : 0;

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">
            Analytics for {shortCode}
          </h3>
          {!isLoading && !error && (
            <p className="text-xs text-gray-500">
              {Number(totalClicks)} click{Number(totalClicks) === 1 ? "" : "s"}{" "}
              in the last {days} days
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleDaysChange(7)}
            className={`text-xs px-2 py-1 rounded-md ${
              days === 7
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => handleDaysChange(14)}
            className={`text-xs px-2 py-1 rounded-md ${
              days === 14
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            14 days
          </button>
          <button
            onClick={() => handleDaysChange(30)}
            className={`text-xs px-2 py-1 rounded-md ${
              days === 30
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            30 days
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <SpinnerGap
              className="animate-spin h-8 w-8 text-primary"
              weight="bold"
            />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>{error}</p>
          </div>
        ) : chartData && analyticsData?.dailyClicks.length ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <ChartLine className="h-12 w-12 mb-2 text-gray-400" weight="thin" />
            <p>No click data available for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrlAnalyticsChart;
