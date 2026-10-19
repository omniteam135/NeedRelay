'use client';

import { useEffect, useRef, useState } from 'react';
import type { Incident, Volunteer } from '@/lib/types';

// Leaflet is loaded from CDN at runtime to avoid bundler resolution issues.
type LeafletModule = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LeafletLayerGroup = import('leaflet').LayerGroup;
type LeafletDivIcon = import('leaflet').DivIcon;
type LeafletMarker = import('leaflet').Marker;

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

interface MapViewProps {
  incidents: Incident[];
  volunteers?: Volunteer[];
  onSelectIncident?: (id: string) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
};

const STATUS_COLOR: Record<string, string> = {
  Resolved: '#10b981',
  'Duplicate Merged': '#6b7280',
};

let leafletPromise: Promise<LeafletModule> | null = null;

function loadLeaflet(): Promise<LeafletModule> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('leaflet can only be loaded in the browser'));
      return;
    }
    const L = (window as unknown as { L?: LeafletModule }).L;
    if (L) {
      resolve(L);
      return;
    }
    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // JS
    const existing = document.querySelector(`script[data-leaflet]`);
    if (existing) {
      existing.addEventListener('load', () => {
        const loaded = (window as unknown as { L?: LeafletModule }).L;
        if (loaded) resolve(loaded);
        else reject(new Error('leaflet failed to initialize'));
      });
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.setAttribute('data-leaflet', 'true');
    script.onload = () => {
      const loaded = (window as unknown as { L?: LeafletModule }).L;
      if (loaded) resolve(loaded);
      else reject(new Error('leaflet failed to initialize'));
    };
    script.onerror = () => reject(new Error('failed to load leaflet from CDN'));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function pinIcon(L: LeafletModule, color: string, pulse = false): LeafletDivIcon {
  return L.divIcon({
    className: 'needrelay-pin',
    html: `<div style="position:relative;width:24px;height:24px;">
      ${pulse ? `<span style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.4;animation:needrelay-pulse 1.6s ease-out infinite;"></span>` : ''}
      <span style="position:absolute;inset:4px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.6);"></span>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function volunteerIcon(L: LeafletModule): LeafletDivIcon {
  return L.divIcon({
    className: 'needrelay-vol',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.5);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function MapView({
  incidents,
  volunteers = [],
  onSelectIncident,
  className,
  center = [30.1575, 71.5249],
  zoom = 6,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const volLayerRef = useRef<LeafletLayerGroup | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load leaflet + init map once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, {
          center,
          zoom,
          zoomControl: true,
          attributionControl: true,
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        volLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        if (!document.getElementById('needrelay-map-style')) {
          const style = document.createElement('style');
          style.id = 'needrelay-map-style';
          style.textContent = `@keyframes needrelay-pulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.4);opacity:0}}`;
          document.head.appendChild(style);
        }
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? 'Failed to load map');
        setStatus('error');
      });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        volLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update incident markers once map is ready or incidents change
  useEffect(() => {
    if (status !== 'ready') return;
    const L = (window as unknown as { L?: LeafletModule }).L;
    if (!L || !layerRef.current || !mapRef.current) return;
    layerRef.current.clearLayers();
    for (const inc of incidents) {
      const { lat, lng } = inc.extraction;
      if (lat == null || lng == null) continue;
      const color =
        STATUS_COLOR[inc.status] ?? SEVERITY_COLOR[inc.severity] ?? '#f97316';
      const pulse = inc.status === 'Active Rescue';
      const marker: LeafletMarker = L.marker([lat, lng], { icon: pinIcon(L, color, pulse) });
      const photo = inc.photoUrl
        ? `<img src="${inc.photoUrl}" style="margin-top:6px;width:100%;border-radius:6px;max-height:120px;object-fit:cover;" />`
        : '';
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:180px;max-width:240px;">
          <div style="font-weight:600;font-size:12px;color:${color};text-transform:uppercase;letter-spacing:0.04em;">${inc.status}</div>
          <div style="font-weight:600;font-size:13px;margin:2px 0;">${inc.extraction.needType} — ${inc.extraction.city}</div>
          <div style="font-size:11px;color:#64748b;line-height:1.4;">${inc.extraction.translatedSummary}</div>
          <div style="font-size:11px;margin-top:4px;">${inc.extraction.affectedPeople} affected &middot; ${inc.severity}</div>
          ${photo}
        </div>`,
      );
      if (onSelectIncident) {
        marker.on('click', () => onSelectIncident(inc.id));
      }
      marker.addTo(layerRef.current);
    }
  }, [incidents, onSelectIncident, status]);

  // Update volunteer markers
  useEffect(() => {
    if (status !== 'ready') return;
    const L = (window as unknown as { L?: LeafletModule }).L;
    if (!L || !volLayerRef.current) return;
    volLayerRef.current.clearLayers();
    for (const v of volunteers) {
      if (v.lat == null || v.lng == null) continue;
      const marker: LeafletMarker = L.marker([v.lat, v.lng], { icon: volunteerIcon(L) });
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:140px;">
          <div style="font-weight:600;font-size:12px;">${v.name}</div>
          <div style="font-size:11px;color:#64748b;">${v.ngoName} &middot; ${v.baseCity}</div>
          <div style="font-size:11px;margin-top:2px;">Status: <b>${v.status}</b></div>
          <div style="font-size:11px;">Skills: ${v.skills.join(', ')}</div>
        </div>`,
      );
      marker.addTo(volLayerRef.current);
    }
  }, [volunteers, status]);

  // Recalculate size when container becomes visible
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !containerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [status]);

  if (status === 'error') {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 360,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: '#0b1220',
          color: '#94a3b8',
          fontSize: 12,
          padding: 16,
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Map failed to load</div>
          <div style={{ opacity: 0.7 }}>{errorMsg}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 360,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#0b1220',
        position: 'relative',
      }}
    >
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          Loading map…
        </div>
      )}
    </div>
  );
}
