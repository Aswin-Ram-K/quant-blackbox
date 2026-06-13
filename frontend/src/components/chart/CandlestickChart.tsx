import React, { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'

interface CandlestickChartProps {
  data: { time: string; open: number; high: number; low: number; close: number }[]
  equityCurve?: number[]
  equityCurveLabel?: string
  height?: number
  showLegend?: boolean
}

export default function CandlestickChart({ data, equityCurve, equityCurveLabel = 'Equity', height = 400, showLegend = true }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const equityRef = useRef<any>(null)
  const chartInstanceRef = useRef<any>(null)

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
        vertLines: { color: 'rgba(100, 100, 120, 0.15)' },
        horzLines: { color: 'rgba(100, 100, 120, 0.15)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(48, 133, 214, 0.5)', style: 2, labelBackgroundColor: '#3085d6' },
        horzLine: { color: 'rgba(48, 133, 214, 0.5)', style: 2, labelBackgroundColor: '#3085d6' },
      },
      rightPriceScale: {
        borderColor: 'rgba(100, 100, 120, 0.3)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(100, 100, 120, 0.3)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    chartInstanceRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    chartRef.current = candlestickSeries

    if (data.length > 0) {
      candlestickSeries.setData(data)
    }

    // Add equity curve overlay if provided
    if (equityCurve && equityCurve.length > 0) {
      const equityData = equityCurve.map((val, i) => {
        if (i < data.length) {
          return { time: data[i].time, value: val }
        }
        return null
      }).filter(Boolean) as { time: string; value: number }[]

      if (equityData.length > 0) {
        const lineSeries = chart.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
          title: equityCurveLabel,
          crosshairMarkerVisible: false,
          lastValueVisible: true,
          priceLineVisible: false,
        })
        equityRef.current = lineSeries
        lineSeries.setData(equityData)
      }
    }

    return () => {
      chart.remove()
      chartInstanceRef.current = null
    }
  }, [data, equityCurve, height, equityCurveLabel])

  // Resize on window change
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="w-full">
      {showLegend && equityCurve && equityCurve.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-green-500 rounded" />
            <span className="text-xs text-muted-foreground">Price</span>
          </div>
          {equityCurve && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="text-xs text-muted-foreground">{equityCurveLabel}</span>
            </div>
          )}
        </div>
      )}
      <div ref={containerRef} className="lightweight-chart" />
    </div>
  )
}
