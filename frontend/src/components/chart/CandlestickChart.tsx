import React, { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import type { CandlestickSeries, LineSeries, IChartApi } from 'lightweight-charts'

interface CandlestickChartProps {
  data: { time: string; open: number; high: number; low: number; close: number }[]
  equityCurve?: number[]
  equityCurveLabel?: string
  height?: number
  showLegend?: boolean
}

export default function CandlestickChart({
  data,
  equityCurve,
  equityCurveLabel = 'Equity',
  height = 400,
  showLegend = true,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const candleSeriesRef = useRef<SeriesTypes.Candlestick | null>(null)
  const lineSeriesRef = useRef<SeriesTypes.Line | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0f' },
        textColor: '#a1a1aa',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(100, 100, 120, 0.12)' },
        horzLines: { color: 'rgba(100, 100, 120, 0.12)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(48, 133, 214, 0.4)', style: 2, labelBackgroundColor: '#3085d6' },
        horzLine: { color: 'rgba(48, 133, 214, 0.4)', style: 2, labelBackgroundColor: '#3085d6' },
      },
      rightPriceScale: {
        borderColor: 'rgba(100, 100, 120, 0.25)',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: 'rgba(100, 100, 120, 0.25)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candleSeriesRef.current = candleSeries

    if (data.length > 0) {
      candleSeries.setData(data)
    }

    // Add equity curve overlay
    if (equityCurve && equityCurve.length > 0) {
      const equityData = equityCurve
        .map((val, i) => {
          if (i < data.length) {
            return { time: data[i].time, value: val }
          }
          return null
        })
        .filter(Boolean) as { time: string; value: number }[]

      if (equityData.length > 0) {
        const lineSeries = chart.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
          title: equityCurveLabel,
          crosshairMarkerVisible: false,
          lastValueVisible: true,
          priceLineVisible: false,
        })
        lineSeriesRef.current = lineSeries
        lineSeries.setData(equityData)
      }
    }

    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [data, equityCurve, height, equityCurveLabel])

  // Resize on window change
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="w-full">
      {showLegend && equityCurve && equityCurve.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border/40 bg-card/30">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-green-500 rounded" />
            <span className="text-xs text-muted-foreground">Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-500 rounded" />
            <span className="text-xs text-muted-foreground">{equityCurveLabel}</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="lightweight-chart" />
    </div>
  )
}
