import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Product, ApprovalItem } from '../types/index.ts';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Package,
  Zap,
  RefreshCw,
  Cpu,
  Check
} from 'lucide-react';

interface NeonSynapticThreadChartProps {
  products: Product[];
  approvals: ApprovalItem[];
  onTriggerRestock?: (productId: number) => void;
  triggeringId?: number | null;
}

type ClusterCategory = 'CRITICAL' | 'OPTIMAL' | 'SURPLUS' | 'APPROVALS';

export const NeonSynapticThreadChart: React.FC<NeonSynapticThreadChartProps> = ({
  products,
  approvals,
  onTriggerRestock,
  triggeringId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramCanvasRef = useRef<HTMLDivElement>(null);

  // Pin measurement DOM refs
  const corePinRef = useRef<HTMLDivElement>(null);
  const midLeftPinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const midRightPinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leafPinRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeCluster, setActiveCluster] = useState<ClusterCategory>('CRITICAL');
  const [growthKey, setGrowthKey] = useState<number>(0);

  // IntersectionObserver for AOS entry animation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setGrowthKey((k) => k + 1);
          observer.disconnect();
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -10px 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-trigger growing laser thread animation when active cluster changes
  useEffect(() => {
    setGrowthKey((k) => k + 1);
  }, [activeCluster]);

  // Compute cluster items
  const criticalItems = useMemo(
    () => products.filter((p) => p.currentStock < p.safetyThreshold),
    [products]
  );
  const optimalItems = useMemo(
    () =>
      products.filter(
        (p) => p.currentStock >= p.safetyThreshold && p.currentStock <= p.targetStock
      ),
    [products]
  );
  const surplusItems = useMemo(
    () => products.filter((p) => p.currentStock > p.targetStock),
    [products]
  );

  // Active leaf items based on selected cluster (capped at 4 to fit in viewport without scrolling)
  const activeLeafItems = useMemo(() => {
    if (activeCluster === 'CRITICAL') {
      return criticalItems.length > 0 ? criticalItems.slice(0, 4) : products.slice(0, 3);
    }
    if (activeCluster === 'OPTIMAL') {
      return optimalItems.length > 0 ? optimalItems.slice(0, 4) : products.slice(0, 3);
    }
    if (activeCluster === 'SURPLUS') {
      return surplusItems.length > 0 ? surplusItems.slice(0, 4) : products.slice(0, 3);
    }
    if (activeCluster === 'APPROVALS') {
      if (approvals.length === 0) {
        // Fallback steady-state placeholder so a terminal pin always exists to connect to
        return [
          {
            id: -999,
            sku: 'AUTO-STEADY',
            name: 'All Reorder Approvals Cleared',
            currentStock: 100,
            safetyThreshold: 20,
            targetStock: 100,
            unitCost: 0,
            supplierName: 'Autonomous Agent Dispatch',
            supplierEmail: ''
          }
        ];
      }
      return approvals.slice(0, 4).map((app) => {
        const prod = app.restockRequest?.product || products.find((p) => p.id === app.restockRequest?.productId);
        return (
          prod || {
            id: app.id,
            sku: `REQ-${app.id}`,
            name: app.restockRequest?.product?.name || `Approval Request #${app.id}`,
            currentStock: 0,
            safetyThreshold: 10,
            targetStock: app.restockRequest?.quantity || 25,
            unitCost: 45,
            supplierName: 'Pending Reorder',
            supplierEmail: ''
          }
        );
      });
    }
    return products.slice(0, 4);
  }, [activeCluster, criticalItems, optimalItems, surplusItems, approvals, products]);

  // Middle cluster definition cards with ultra-vibrant fluorescent neon pigments
  const clusters = useMemo(() => [
    {
      id: 'CRITICAL' as ClusterCategory,
      title: 'Alerts & Shortages',
      count: criticalItems.length,
      subtitle: 'Critical buffer breach',
      color: '#ff0055', // Electric Fluorescent Rose
      colorGlow: 'rgba(255, 0, 85, 0.75)',
      gradient: ['#ff0055', '#ff3377', '#ff0080'],
      icon: AlertTriangle,
      tag: 'Urgent'
    },
    {
      id: 'OPTIMAL' as ClusterCategory,
      title: 'Optimal Fleet Band',
      count: optimalItems.length,
      subtitle: 'Healthy stock balance',
      color: '#00ff88', // High-Voltage Neon Electric Emerald
      colorGlow: 'rgba(0, 255, 136, 0.75)',
      gradient: ['#00ff88', '#00f5a0', '#00d9f5'],
      icon: CheckCircle2,
      tag: 'Balanced'
    },
    {
      id: 'SURPLUS' as ClusterCategory,
      title: 'Surplus Capital',
      count: surplusItems.length,
      subtitle: 'Excess storage buffer',
      color: '#b000ff', // Ultra Neon Fluorescent Violet
      colorGlow: 'rgba(176, 0, 255, 0.75)',
      gradient: ['#b000ff', '#d946ef', '#f43f5e'],
      icon: Package,
      tag: 'Holding'
    },
    {
      id: 'APPROVALS' as ClusterCategory,
      title: 'Reorder Approvals',
      count: approvals.length,
      subtitle: 'Autonomous AI dispatch',
      color: '#00f0ff', // High-Energy Laser Electric Cyan
      colorGlow: 'rgba(0, 240, 255, 0.75)',
      gradient: ['#00f0ff', '#38bdf8', '#0284c7'],
      icon: Zap,
      tag: 'In Flight'
    }
  ], [criticalItems.length, optimalItems.length, surplusItems.length, approvals.length]);

  const currentClusterObj = clusters.find((c) => c.id === activeCluster) || clusters[0];

  // Dynamic Subpixel Pin Coordinates State measured directly from actual DOM pins
  const [pinCoords, setPinCoords] = useState<{
    core: { x: number; y: number } | null;
    midLeft: ({ x: number; y: number } | null)[];
    midRight: ({ x: number; y: number } | null)[];
    leaves: ({ x: number; y: number } | null)[];
  }>({
    core: null,
    midLeft: [],
    midRight: [],
    leaves: []
  });

  // Measure pins directly from DOM bounding rectangles to guarantee exact connection
  const updatePinCoordinates = () => {
    if (!diagramCanvasRef.current) return;
    const canvasRect = diagramCanvasRef.current.getBoundingClientRect();

    let core: { x: number; y: number } | null = null;
    if (corePinRef.current) {
      const r = corePinRef.current.getBoundingClientRect();
      core = {
        x: Number((r.left - canvasRect.left + r.width / 2).toFixed(1)),
        y: Number((r.top - canvasRect.top + r.height / 2).toFixed(1))
      };
    }

    const midLeft = midLeftPinRefs.current.map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Number((r.left - canvasRect.left + r.width / 2).toFixed(1)),
        y: Number((r.top - canvasRect.top + r.height / 2).toFixed(1))
      };
    });

    const midRight = midRightPinRefs.current.map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Number((r.left - canvasRect.left + r.width / 2).toFixed(1)),
        y: Number((r.top - canvasRect.top + r.height / 2).toFixed(1))
      };
    });

    const leaves = leafPinRefs.current.slice(0, activeLeafItems.length).map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Number((r.left - canvasRect.left + r.width / 2).toFixed(1)),
        y: Number((r.top - canvasRect.top + r.height / 2).toFixed(1))
      };
    });

    setPinCoords({ core, midLeft, midRight, leaves });
  };

  // Multi-pass measurement to ensure layout calculation has settled cleanly
  useLayoutEffect(() => {
    leafPinRefs.current = leafPinRefs.current.slice(0, activeLeafItems.length);
    updatePinCoordinates();
    const frame1 = requestAnimationFrame(updatePinCoordinates);
    const frame2 = requestAnimationFrame(() => requestAnimationFrame(updatePinCoordinates));
    const timer = setTimeout(updatePinCoordinates, 75);
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      clearTimeout(timer);
    };
  }, [activeCluster, activeLeafItems, products]);

  // ResizeObserver on canvas container to immediately re-align if window resizes
  useEffect(() => {
    if (!diagramCanvasRef.current) return;
    const ro = new ResizeObserver(() => {
      updatePinCoordinates();
    });
    ro.observe(diagramCanvasRef.current);
    window.addEventListener('resize', updatePinCoordinates);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePinCoordinates);
    };
  }, []);

  // Primary Splines: Core Orb right pin -> Middle Cards left pins
  const coreSplines = useMemo(() => {
    if (!pinCoords.core) return [];

    return clusters.map((cluster, i) => {
      const targetPin = pinCoords.midLeft[i];
      if (!targetPin) return null;

      const startX = pinCoords.core!.x;
      const startY = pinCoords.core!.y;
      const endX = targetPin.x;
      const endY = targetPin.y;

      const cp1X = startX + (endX - startX) * 0.45;
      const cp2X = startX + (endX - startX) * 0.72;
      const pathD = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

      return {
        id: cluster.id,
        color: cluster.color,
        colorGlow: cluster.colorGlow,
        isSelected: activeCluster === cluster.id,
        pathD,
        startX,
        startY,
        endX,
        endY
      };
    }).filter(Boolean);
  }, [pinCoords, clusters, activeCluster]);

  // Secondary Radiant Fan Splines: Active Middle Card right pin -> Leaf Cards left pins
  const fanSplines = useMemo(() => {
    const activeIdx = clusters.findIndex((c) => c.id === activeCluster);
    const startPin = pinCoords.midRight[activeIdx];
    if (!startPin) return [];

    return activeLeafItems.map((item, idx) => {
      const targetPin = pinCoords.leaves[idx];
      if (!targetPin) return null;

      const startX = startPin.x;
      const startY = startPin.y;
      const endX = targetPin.x;
      const endY = targetPin.y;

      const cp1X = startX + (endX - startX) * 0.42;
      const cp2X = startX + (endX - startX) * 0.78;
      const pathD = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

      return {
        id: item.id,
        pathD,
        startX,
        startY,
        endX,
        endY,
        delay: idx * 0.1
      };
    }).filter(Boolean);
  }, [pinCoords, clusters, activeCluster, activeLeafItems]);

  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock * Number(p.unitCost), 0);
  }, [products]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)'
      }}
    >
      <style>{`
        /* Dynamic Laser Thread Growth synchronized with photon movement */
        @keyframes dynamicLaserGrow {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.1;
          }
          15% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        /* High-Velocity Photon Streak Flow along laser path */
        @keyframes photonLaserStream {
          0% {
            stroke-dashoffset: 120;
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -20;
            opacity: 0.3;
          }
        }

        /* Continuous Energetic Laser Ripple Pulse */
        @keyframes laserEnergyPulse {
          0%, 100% {
            stroke-opacity: 0.75;
          }
          50% {
            stroke-opacity: 1;
          }
        }
      `}</style>

      {/* Subtle Coordinate Dot-Matrix Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 0.65px, transparent 0.65px)',
          backgroundSize: '18px 18px'
        }}
      />
      <div className="absolute -top-16 left-1/4 w-72 h-72 bg-cyan-100/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-1/4 w-72 h-72 bg-purple-100/35 rounded-full blur-3xl pointer-events-none" />

      {/* Compact Executive Header Bar */}
      <div className="relative z-20 px-5 py-2.5 border-b border-slate-200/80 bg-white/85 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="p-1 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-xs">
            <Cpu className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Synaptic Supply Nexus & Neural Restock Threads</span>
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Active 60FPS Flux</span>
              </span>
            </h3>
          </div>
        </div>

        {/* Global Summary Metrics */}
        <div className="flex items-center space-x-2.5 text-xs font-mono font-semibold">
          <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-[10.5px]">Equilibrium:</span>
            <span className="text-emerald-600 font-bold text-[11px]">
              {Math.round(((optimalItems.length + surplusItems.length) / Math.max(1, products.length)) * 100)}%
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center space-x-1.5">
            <span className="text-slate-500 text-[10.5px]">Capital:</span>
            <span className="text-slate-900 font-bold text-[11px] font-mono">
              ${Math.round(totalValuation).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Diagram Canvas (Calibrated ~360px height to guarantee no vertical scrolling) */}
      <div
        ref={diagramCanvasRef}
        className="relative z-10 px-5 py-3 h-[360px] min-h-[350px] overflow-hidden flex items-center justify-between"
      >
        {/* ============================================================ */}
        {/* COLUMN 1: CENTRAL HOLOGRAPHIC NUCLEUS (LEFT)                 */}
        {/* ============================================================ */}
        <div className="w-[170px] shrink-0 flex flex-col items-center text-center relative z-20">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer Pulsating Corona Aura */}
            <div
              className={`w-24 h-24 rounded-full absolute transition-transform duration-700 ${
                isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
              }`}
              style={{
                background:
                  'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(0, 240, 255, 0.18) 50%, transparent 75%)',
                boxShadow: '0 0 35px rgba(168, 85, 247, 0.35)'
              }}
            />

            {/* Electric Coronal SVG Ring */}
            <svg
              viewBox="0 0 100 100"
              className="w-24 h-24 absolute pointer-events-none animate-spin"
              style={{ animationDuration: '24s' }}
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#b000ff"
                strokeWidth="0.8"
                strokeDasharray="4 8 2 10"
                opacity="0.65"
              />
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="0.75"
                strokeDasharray="5 12"
                opacity="0.55"
              />
            </svg>

            {/* 3D Radiant Core Sphere */}
            <div
              className="w-14 h-14 rounded-full relative z-10 flex flex-col items-center justify-center text-white shadow-lg cursor-pointer"
              style={{
                background:
                  'radial-gradient(circle at 32% 32%, #f3e8ff 0%, #b000ff 40%, #7e22ce 80%, #3b0764 100%)',
                boxShadow:
                  '0 6px 18px -2px rgba(176, 0, 255, 0.55), inset 0 -2px 6px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.85)'
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="text-[7.5px] font-black tracking-widest uppercase mt-0.5">CORE</span>
            </div>

            {/* Central Nucleus Right Connector Pin */}
            <div
              ref={corePinRef}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-purple-600 border border-white shadow-xs z-20 pointer-events-none"
              style={{
                boxShadow: '0 0 8px #b000ff'
              }}
            />
          </div>

          <div className="mt-1.5 space-y-0.5">
            <h4 className="text-[11.5px] font-black text-slate-900 tracking-tight">StockPilot Core</h4>
            <p className="text-[9.5px] text-slate-500 font-medium">Supply Nexus</p>
            <div className="pt-0.5">
              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold font-mono bg-purple-100 text-purple-800 border border-purple-200">
                {products.length} Catalog SKUs
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 2: MIDDLE TIER CLUSTER CARDS                          */}
        {/* ============================================================ */}
        <div className="w-[200px] shrink-0 space-y-2 relative z-20">
          {clusters.map((cluster, idx) => {
            const isSelected = activeCluster === cluster.id;
            const Icon = cluster.icon;

            return (
              <div
                key={cluster.id}
                onClick={() => setActiveCluster(cluster.id)}
                className={`group relative p-2 rounded-xl cursor-pointer select-none flex items-center justify-between transition-colors duration-150 ${
                  isSelected
                    ? 'bg-white border-2 shadow-md'
                    : 'bg-white/85 hover:bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
                style={{
                  borderColor: isSelected ? cluster.color : undefined
                }}
              >
                {/* Left Connector Pin (Target for core thread) */}
                <div
                  ref={(el) => (midLeftPinRefs.current[idx] = el)}
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white z-30 pointer-events-none"
                  style={{
                    backgroundColor: cluster.color,
                    boxShadow: isSelected ? `0 0 8px ${cluster.color}` : `0 0 3px ${cluster.color}`
                  }}
                />

                {/* Right Output Pin (Origin for fan threads) */}
                <div
                  ref={(el) => (midRightPinRefs.current[idx] = el)}
                  className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white z-30 pointer-events-none"
                  style={{
                    backgroundColor: isSelected ? cluster.color : '#94a3b8',
                    boxShadow: isSelected ? `0 0 10px ${cluster.color}` : 'none'
                  }}
                />

                {/* Card Info */}
                <div className="flex items-center space-x-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cluster.color}15`,
                      color: cluster.color
                    }}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-slate-900 truncate block group-hover:text-blue-600 transition">
                      {cluster.title}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {cluster.subtitle}
                    </span>
                  </div>
                </div>

                <span
                  className="font-mono text-[11px] font-black shrink-0 ml-1.5"
                  style={{ color: cluster.color }}
                >
                  {cluster.count}
                </span>

                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      boxShadow: `0 0 12px ${cluster.colorGlow}`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* COLUMN 3: LEAF DETAIL CARDS (RIGHT COLUMN)                   */}
        {/* ============================================================ */}
        <div className="w-[330px] shrink-0 space-y-1.5 relative z-20">
          {activeLeafItems.map((item, idx) => {
            const target = Math.max(1, item.targetStock);
            const fillPct = Math.round((item.currentStock / target) * 100);
            const isLow = item.currentStock < item.safetyThreshold;
            const isOptimal = item.currentStock >= item.safetyThreshold && item.currentStock <= item.targetStock;
            const isPlaceholder = item.id === -999;
            const assetVal = (item.currentStock * Number(item.unitCost)).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD'
            });

            return (
              <div
                key={`${item.id}-${idx}`}
                className="group relative px-2.5 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-colors duration-150 flex items-center justify-between gap-2 text-xs"
              >
                {/* Left Terminal Pin (Target for fan thread) */}
                <div
                  ref={(el) => (leafPinRefs.current[idx] = el)}
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white z-30 pointer-events-none"
                  style={{
                    backgroundColor: currentClusterObj.color,
                    boxShadow: `0 0 8px ${currentClusterObj.color}`
                  }}
                />

                {/* SKU, Name, Valuation */}
                <div className="min-w-0 flex-1 pl-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[9px] font-bold text-slate-500">
                      {item.sku}
                    </span>
                    <span className="text-[8.5px] px-1.5 py-0.1 rounded bg-slate-100 text-slate-600 font-medium truncate">
                      {item.supplierName || 'General'}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 truncate text-[11px] group-hover:text-blue-600 transition">
                    {item.name}
                  </h5>
                  {!isPlaceholder && (
                    <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 font-mono">
                      <span>{item.currentStock} / {item.targetStock} units</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">{assetVal}</span>
                    </div>
                  )}
                </div>

                {/* Status Indicator / Restock Action */}
                <div className="text-right shrink-0 flex flex-col items-end space-y-0.5">
                  {isPlaceholder ? (
                    <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>CLEARED</span>
                    </span>
                  ) : isLow ? (
                    <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      ALERT {fillPct}% 🟥
                    </span>
                  ) : isOptimal ? (
                    <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      OPTIMAL 🟩
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      +{fillPct - 100}% SURPLUS 🟪
                    </span>
                  )}

                  {!isPlaceholder && isLow && onTriggerRestock && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerRestock(item.id);
                      }}
                      disabled={triggeringId === item.id}
                      className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center space-x-1 shadow-2xs"
                    >
                      {triggeringId === item.id ? (
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Zap className="w-2.5 h-2.5 fill-slate-950" />
                      )}
                      <span>Restock</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* DYNAMIC SVG NEON THREADS LAYER (Grows dynamically as photons move) */}
        {/* ============================================================ */}
        <svg
          key={`growth-canvas-${growthKey}`}
          className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
        >
          <defs>
            {/* White-Hot High-Intensity Photon Bead Filter */}
            <filter id="whiteHotPhotonGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="1.8" result="blur1" />
              <feGaussianBlur stdDeviation="3.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radiant Fan Thread High-Voltage Gradient */}
            <linearGradient id="vibrantFanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentClusterObj.color} stopOpacity="1" />
              <stop offset="65%" stopColor="#00f0ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* 1. Core-to-Cluster Primary Spline Lines */}
          {coreSplines.map((thread) => {
            if (!thread) return null;
            return (
              <g key={`core-${thread.id}`}>
                {/* Terminal Docking Rings (Mathematically aligned at endpoints) */}
                <circle
                  cx={thread.startX}
                  cy={thread.startY}
                  r="1.8"
                  fill="#ffffff"
                  stroke={thread.color}
                  strokeWidth="0.8"
                />
                <circle
                  cx={thread.endX}
                  cy={thread.endY}
                  r="1.8"
                  fill="#ffffff"
                  stroke={thread.color}
                  strokeWidth="0.8"
                />

                {/* Dynamic Growing Neon Laser Filament (Ultra-thin 0.85px razor thread) */}
                <path
                  d={thread.pathD}
                  pathLength="100"
                  fill="none"
                  stroke={thread.color}
                  strokeWidth="0.85"
                  strokeDasharray="100"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 3px ${thread.color}) drop-shadow(0 0 6px ${thread.colorGlow})`,
                    animation: 'dynamicLaserGrow 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards, laserEnergyPulse 2s ease-in-out infinite'
                  }}
                />

                {/* Traveling High-Voltage Photon Laser Streak on Active Path */}
                {thread.isSelected && (
                  <path
                    d={thread.pathD}
                    pathLength="100"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.1"
                    strokeDasharray="18 82"
                    strokeLinecap="round"
                    style={{
                      animation: 'photonLaserStream 1.8s linear infinite',
                      filter: `drop-shadow(0 0 4px ${thread.color})`
                    }}
                  />
                )}

                {/* Leading White-Hot Photon Particle Bead */}
                {thread.isSelected && (
                  <circle
                    r="2.2"
                    fill="#ffffff"
                    stroke={thread.color}
                    strokeWidth="1.2"
                    filter="url(#whiteHotPhotonGlow)"
                  >
                    <animateMotion
                      path={thread.pathD}
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* 2. Middle-to-Leaf Radiant Fan Threads (Ultra-thin 0.85px, grows as photon moves) */}
          {fanSplines.map((thread, idx) => {
            if (!thread) return null;
            return (
              <g key={`fan-spline-${thread.id}-${idx}`}>
                {/* Terminal Docking Rings */}
                <circle
                  cx={thread.startX}
                  cy={thread.startY}
                  r="1.8"
                  fill="#ffffff"
                  stroke={currentClusterObj.color}
                  strokeWidth="0.8"
                />
                <circle
                  cx={thread.endX}
                  cy={thread.endY}
                  r="1.8"
                  fill="#ffffff"
                  stroke={currentClusterObj.color}
                  strokeWidth="0.8"
                />

                {/* Dynamic Growing Neon Thread (0.85px razor-thin) */}
                <path
                  d={thread.pathD}
                  pathLength="100"
                  fill="none"
                  stroke="url(#vibrantFanGrad)"
                  strokeWidth="0.85"
                  strokeDasharray="100"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 3px ${currentClusterObj.color}) drop-shadow(0 0 6px ${currentClusterObj.colorGlow})`,
                    animation: 'dynamicLaserGrow 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards, laserEnergyPulse 2s ease-in-out infinite',
                    animationDelay: `${thread.delay}s, 0.9s`
                  }}
                />

                {/* Continuous Moving Photon Laser Streak */}
                <path
                  d={thread.pathD}
                  pathLength="100"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.1"
                  strokeDasharray="16 84"
                  strokeLinecap="round"
                  style={{
                    animation: 'photonLaserStream 1.6s linear infinite',
                    animationDelay: `${thread.delay}s`,
                    filter: `drop-shadow(0 0 4px ${currentClusterObj.color})`
                  }}
                />

                {/* Leading White-Hot Photon Particle Bead */}
                <circle
                  r="2.2"
                  fill="#ffffff"
                  stroke={currentClusterObj.color}
                  strokeWidth="1.2"
                  filter="url(#whiteHotPhotonGlow)"
                >
                  <animateMotion
                    path={thread.pathD}
                    dur="1.6s"
                    begin={`${thread.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
