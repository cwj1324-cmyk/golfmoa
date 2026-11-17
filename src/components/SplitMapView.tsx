import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson } from '../utils/calculator';
import { formatManwon } from '../utils/clubDisplay';
import { GolfCard } from './GolfCard';
import { LocateFixed } from 'lucide-react';

/**
 * 안 B · 지도·목록 분할
 * 왼쪽 목록은 지도에 보이는 범위의 골프장만 보여 주고, 지도 핀에는 1인 비용을 표시한다.
 * 카드에 마우스를 올리면 핀이, 핀을 누르면 카드가 강조된다.
 */
interface SplitMapViewProps {
  clubs: GolfClub[];
  comparedIds: Set<string>;
  onToggleCompare: (club: GolfClub) => void;
  onSelectClub: (club: GolfClub) => void;
  userAvgScore: number;
  /** 지역 등 필터가 바뀌면 지도를 결과에 맞춰 다시 맞춘다 */
  fitKey: string;
}

const LIST_LIMIT = 60;
const iconCache = new Map<string, L.DivIcon>();

type PinState = 'normal' | 'hl' | 'cmp' | 'dot';

function priceIcon(label: string, state: PinState): L.DivIcon {
  const key = state === 'dot' ? 'dot' : `${label}|${state}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: 'price-pin-wrap',
      html: state === 'dot' ? '<span class="price-dot"></span>' : `<span class="price-pin price-pin--${state}">${label}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

/** 지도 이동·확대 때마다 보이는 범위를 알려 준다 */
const BoundsWatcher: React.FC<{ onChange: (b: L.LatLngBounds, zoom: number) => void }> = ({ onChange }) => {
  const map = useMapEvents({
    moveend: () => onChange(map.getBounds(), map.getZoom()),
  });
  useEffect(() => {
    onChange(map.getBounds(), map.getZoom());
  }, [map, onChange]);
  return null;
};

/** 필터 결과가 바뀌면 그 골프장들이 모두 보이게 맞춘다 */
const FitToClubs: React.FC<{ clubs: GolfClub[]; fitKey: string }> = ({ clubs, fitKey }) => {
  const map = useMap();
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    // 필터(fitKey)가 바뀔 때만 다시 맞춘다. 사용자가 옮긴 지도는 그대로 둔다.
    if (lastKey.current === fitKey || clubs.length === 0) return;
    lastKey.current = fitKey;
    const b = L.latLngBounds(clubs.map((c) => [c.coordinates.lat, c.coordinates.lng] as [number, number]));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 11 });
  }, [fitKey, clubs, map]);
  return null;
};

export const SplitMapView: React.FC<SplitMapViewProps> = ({
  clubs,
  comparedIds,
  onToggleCompare,
  onSelectClub,
  userAvgScore,
  fitKey,
}) => {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(7);
  const handleView = useCallback((b: L.LatLngBounds, z: number) => {
    setBounds(b);
    setZoom(z);
  }, []);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => (bounds ? clubs.filter((c) => bounds.contains([c.coordinates.lat, c.coordinates.lng])) : clubs),
    [clubs, bounds],
  );

  const prices = useMemo(() => {
    const m = new Map<string, string>();
    clubs.forEach((c) => m.set(c.id, formatManwon(calculateCostPerPerson(c, false, 4, true).totalPerPerson)));
    return m;
  }, [clubs]);

  const activeId = hoverId ?? pinnedId;
  // 전국 단위로 보면 가격 글자가 겹치므로, 확대했거나 범위 안이 적을 때만 가격을 보여 준다.
  const showLabels = zoom >= 10 || visible.length <= 40;

  const handlePinClick = (club: GolfClub) => {
    setPinnedId(club.id);
    const el = listRef.current?.querySelector(`[data-club-id="${CSS.escape(club.id)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-[440px_1fr] lg:h-[calc(100vh-120px)] lg:min-h-[560px]">
      {/* 지도 (모바일에서는 위) */}
      <div className="relative order-1 lg:order-2 h-[300px] sm:h-[380px] lg:h-full">
        <MapContainer center={[36.6, 127.6]} zoom={7} scrollWheelZoom className="w-full h-full z-10">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsWatcher onChange={handleView} />
          <FitToClubs clubs={clubs} fitKey={fitKey} />
          {clubs.map((club) => {
            const state: PinState =
              club.id === activeId ? 'hl' : comparedIds.has(club.id) ? 'cmp' : showLabels ? 'normal' : 'dot';
            return (
              <Marker
                key={club.id}
                position={[club.coordinates.lat, club.coordinates.lng]}
                icon={priceIcon(prices.get(club.id) ?? '', state)}
                zIndexOffset={state === 'hl' ? 1000 : state === 'cmp' ? 500 : 0}
                title={club.name}
                eventHandlers={{
                  click: () => handlePinClick(club),
                  mouseover: () => setHoverId(club.id),
                  mouseout: () => setHoverId(null),
                }}
              />
            );
          })}
        </MapContainer>
        <div className="absolute left-3 bottom-3 z-20 bg-white/90 rounded-md px-2 py-1 text-[11px] text-slate-600 border border-slate-200">
          {showLabels ? '핀 = 1인 비용(4인·주중)' : '확대하면 1인 비용이 보입니다'} · 지도를 움직이면 목록이 바뀝니다
        </div>
      </div>

      {/* 목록 */}
      <div ref={listRef} className="order-2 lg:order-1 lg:overflow-y-auto border-t lg:border-t-0 lg:border-r border-slate-200 p-3 sm:p-4 space-y-3 bg-slate-50/60">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            지도 범위 안 <b className="text-slate-900">{visible.length}</b>곳
            {visible.length > LIST_LIMIT && <span> · 앞 {LIST_LIMIT}곳 표시</span>}
          </span>
          {pinnedId && (
            <button type="button" onClick={() => setPinnedId(null)} className="inline-flex items-center gap-1 hover:text-slate-900">
              <LocateFixed className="w-3.5 h-3.5" /> 강조 해제
            </button>
          )}
        </div>
        {visible.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">지도 범위 안에 조건에 맞는 골프장이 없습니다. 지도를 축소해 보세요.</p>
        ) : (
          visible.slice(0, LIST_LIMIT).map((club) => (
            <GolfCard
              key={club.id}
              club={club}
              isCompared={comparedIds.has(club.id)}
              onToggleCompare={onToggleCompare}
              onSelectClub={onSelectClub}
              userAvgScore={userAvgScore}
              isHighlighted={club.id === activeId}
              onHover={setHoverId}
            />
          ))
        )}
        {visible.length > LIST_LIMIT && (
          <p className="text-xs text-slate-500 text-center py-2">지도를 확대하면 나머지 골프장도 볼 수 있습니다.</p>
        )}
      </div>
    </div>
  );
};
