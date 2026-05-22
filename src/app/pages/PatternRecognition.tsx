import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTradesContext } from '../data/TradesContext';
import { detectProfitablePatterns, getTopPatterns, generatePatternSummary, TradePattern, PatternInsight } from '../utils/patternRecognition';

export default function PatternRecognition() {
  const { trades } = useTradesContext();
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedPattern, setSelectedPattern] = useState<PatternInsight | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'time' | 'pair' | 'method'>('all');

  useEffect(() => {
    if (trades.length > 0) {
      const insights = detectProfitablePatterns(trades);
      setPatterns(insights);

      const summaryData = generatePatternSummary(trades);
      setSummary(summaryData);

      if (insights.length > 0) {
        setSelectedPattern(insights[0]);
      }
    }
  }, [trades]);

  if (!summary) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Pattern Recognition</h2>
        <p className="text-gray-400">No patterns detected yet. Log more trades to identify profitable patterns.</p>
      </div>
    );
  }

  const patternChartData = patterns.map((p) => ({
    name: p.pattern.name.substring(0, 15),
    winRate: p.pattern.winRate,
    profitFactor: p.pattern.profitFactor * 10, // Scale for visibility
    frequency: p.pattern.frequency,
  }));

  const riskDistribution = [
    { name: 'Low Risk', value: patterns.filter((p) => p.riskLevel === 'low').length },
    { name: 'Medium Risk', value: patterns.filter((p) => p.riskLevel === 'medium').length },
    { name: 'High Risk', value: patterns.filter((p) => p.riskLevel === 'high').length },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Pattern Recognition</h1>
          <p className="text-gray-400">Automatically detect profitable trading patterns and get actionable insights</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 text-white">
            <p className="text-sm text-blue-200 mb-2">Total Patterns Found</p>
            <p className="text-3xl font-bold">{summary.totalPatternsFound}</p>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 text-white">
            <p className="text-sm text-green-200 mb-2">Profitable Patterns</p>
            <p className="text-3xl font-bold">{summary.profitablePatterns}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-6 text-white">
            <p className="text-sm text-purple-200 mb-2">Top Pattern Win Rate</p>
            <p className="text-3xl font-bold">{summary.topPattern ? summary.topPattern.pattern.winRate.toFixed(1) : 0}%</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-6 text-white">
            <p className="text-sm text-orange-200 mb-2">Est. Monthly PnL</p>
            <p className={`text-3xl font-bold ${summary.estimatedMonthlyPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${summary.estimatedMonthlyPnL.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Pattern Performance Chart */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Pattern Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patternChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="winRate" fill="#10b981" name="Win Rate %" />
                <Bar dataKey="profitFactor" fill="#3b82f6" name="Profit Factor (scaled)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Patterns List */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Top Profitable Patterns</h3>

          {patterns.length === 0 ? (
            <p className="text-gray-400">No profitable patterns detected yet. Continue trading to identify patterns.</p>
          ) : (
            <div className="space-y-4">
              {patterns.slice(0, 5).map((insight, idx) => (
                <div
                  key={insight.pattern.id}
                  onClick={() => setSelectedPattern(insight)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedPattern?.pattern.id === insight.pattern.id
                      ? 'bg-blue-900 border-2 border-blue-500'
                      : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-blue-400">#{idx + 1}</span>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{insight.pattern.name}</h4>
                        <p className="text-sm text-gray-400">{insight.pattern.frequency} trades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${insight.pattern.totalPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${insight.pattern.totalPnL.toFixed(0)}
                      </p>
                      <p className="text-sm text-gray-400">{insight.pattern.winRate.toFixed(1)}% Win Rate</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div className="flex-1">
                      <p className="text-gray-400">Profit Factor</p>
                      <p className="text-white font-semibold">{insight.pattern.profitFactor.toFixed(2)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400">Avg Win</p>
                      <p className="text-green-400 font-semibold">${insight.pattern.averageWin.toFixed(0)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400">Avg Loss</p>
                      <p className="text-red-400 font-semibold">${insight.pattern.averageLoss.toFixed(0)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400">Risk Level</p>
                      <p className={`font-semibold ${
                        insight.riskLevel === 'low' ? 'text-green-400' : insight.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {insight.riskLevel.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Pattern Details */}
        {selectedPattern && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Pattern Details: {selectedPattern.pattern.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className="text-white font-semibold">{selectedPattern.pattern.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profit Factor</span>
                    <span className="text-white font-semibold">{selectedPattern.pattern.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades</span>
                    <span className="text-white font-semibold">{selectedPattern.pattern.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-white font-semibold">{selectedPattern.pattern.confidence.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Financial Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Win</span>
                    <span className="text-green-400 font-semibold">${selectedPattern.pattern.averageWin.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Loss</span>
                    <span className="text-red-400 font-semibold">${selectedPattern.pattern.averageLoss.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total PnL</span>
                    <span className={`font-semibold ${selectedPattern.pattern.totalPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${selectedPattern.pattern.totalPnL.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. Monthly PnL</span>
                    <span className={`font-semibold ${selectedPattern.potentialMonthlyPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${selectedPattern.potentialMonthlyPnL.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">Recommendation</h4>
              <p className="text-gray-300">{selectedPattern.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
