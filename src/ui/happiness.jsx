import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import dashboardService from "../service/dashboardService";

function HappinessModal({ isOpen, onClose }) {
  const [period, setPeriod] = useState("week");
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGraphData(period);
    }
  }, [isOpen, period]);

  const fetchGraphData = async (selectedPeriod) => {
    setLoading(true);
    try {
      const response = await dashboardService.getHappinessGraphData({
        period: selectedPeriod,
      });
      const items = response?.data?.data || response?.data || [];
      setGraphData(items);
    } catch (err) {
      console.error("Error fetching happiness graph data:", err);
      setGraphData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const maxRate = 100;
  const svgWidth = 700;
  const svgHeight = 350;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 60;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = graphData.map((item, index) => {
    const x =
      graphData.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (index / (graphData.length - 1)) * chartWidth;
    const y =
      paddingTop + chartHeight - (item.happiness_rate / maxRate) * chartHeight;
    return { x, y, label: item.label, happiness_rate: item.happiness_rate };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPoints =
    points.length > 1
      ? `${points[0].x},${paddingTop + chartHeight} ${polylinePoints} ${points[points.length - 1].x},${paddingTop + chartHeight}`
      : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] font-poppins">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Happiness Admin Graph
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <Icon icon="heroicons:x-mark-20-solid" className="w-6 h-6" />
          </button>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                period === p
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Graph Content */}
        {loading ? (
          <div className="flex justify-center items-center h-80 text-gray-400 text-xs">
            Loading graph data...
          </div>
        ) : graphData.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-80 min-w-[550px]"
                style={{ overflow: "visible" }}
              >
                {/* Y-Axis Line */}
                <line
                  x1={paddingLeft}
                  y1={paddingTop}
                  x2={paddingLeft}
                  y2={svgHeight - paddingBottom}
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                />

                {/* X-Axis Line */}
                <line
                  x1={paddingLeft}
                  y1={svgHeight - paddingBottom}
                  x2={svgWidth - paddingRight}
                  y2={svgHeight - paddingBottom}
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                />

                {/* Horizontal Grid lines & Y-Axis Labels */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const yPos =
                    paddingTop + chartHeight - (val / maxRate) * chartHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={paddingLeft}
                        y1={yPos}
                        x2={svgWidth - paddingRight}
                        y2={yPos}
                        stroke="#e5e7eb"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 12}
                        y={yPos + 4}
                        fontSize="11"
                        textAnchor="end"
                        fill="#9ca3af"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Fill under the line chart (only rendered if more than 1 point exists) */}
                {points.length > 1 && (
                  <>
                    <defs>
                      <linearGradient
                        id="fadeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#000000"
                          stopOpacity="0.2"
                        />
                        <stop
                          offset="100%"
                          stopColor="#000000"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    <polygon points={areaPoints} fill="url(#fadeGradient)" />
                  </>
                )}

                {/* Line Path (rendered if more than 1 point exists) */}
                {points.length > 1 ? (
                  <polyline
                    fill="none"
                    stroke="#000000"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                ) : (
                  // Fallback notification text inside SVG if only 1 data point is returned
                  <text
                    x={svgWidth / 2}
                    y={svgHeight / 2 - 20}
                    fontSize="11"
                    textAnchor="middle"
                    fill="#9ca3af"
                  >
                    (Single data point available; line connects when multiple
                    points exist)
                  </text>
                )}

                {/* Data Points and X-Axis Labels */}
                {points.map((p, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="6"
                      className="fill-black stroke-white stroke-2 transition-transform hover:scale-125"
                    />
                    <text
                      x={p.x}
                      y={svgHeight - paddingBottom + 20}
                      fontSize="11"
                      textAnchor="middle"
                      fill="#374151"
                      fontWeight="500"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <Icon
              icon="solar:chart-square-linear"
              className="w-12 h-12 mx-auto mb-2 opacity-50"
            />
            <p className="text-xs">
              No graph data available for this {period}.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-black text-white py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default HappinessModal;
