import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, predictFieldScore } from '../utils/calculator';
import { getClubMetaLine, getClubTraits } from '../utils/clubDisplay';
import { GolfCard } from './GolfCard';
import { LocateFixed } from 'lucide-react';

/**
 * 안 B · 지도·목록 분할
 * 왼쪽 목록은 지도에 보이는 범위의 골프장만 보여 주고, 지도 핀에는 골프장 이름을 표시한다.
 * 핀에 마우스를 올리면 주요 정보 팝업이 뜨고, 카드에 마우스를 올리면 핀이, 핀을 누르면 카드가 강조된다.
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

const escapeHtml = (t: string) =>
  t.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);

function nameIcon(label: string, state: PinState): L.DivIcon {
  const key = state === 'dot' ? 'dot' : `${label}|${state}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: 'price-pin-wrap',
      html:
        state === 'dot'
          ? '<span class="price-dot"></span>'
          : `<span class="price-pin price-pin--${state}"><span class="pin-text">${escapeHtml(label)}</span></span>`,
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
/** 핀에 마우스를 올렸을 때 보이는 주요 정보 */
const PinInfo: React.FC<{ club: GolfClub; userAvgScore: number }> = ({ club, userAvgScore }) => {
  const cost = calculateCostPerPerson(club, false, 4, true).totalPerPerson;
  const weekendGap = club.pricing.weekendGreenFee - club.pricing.weekdayGreenFee;
  const slope = club.difficultyIndex?.slopeRating;
  const pred = predictFieldScore(slope, club.difficultyIndex?.courseRating, userAvgScore);
  const traits = getClubTraits(club);
  return (
    <div className="w-[240px] text-slate-700">
      <div className="text-sm font-bold text-slate-900 leading-snug whitespace-normal">{club.name}</div>
      <div className="mt-0.5 text-[11.5px] text-slate-500 whitespace-normal">{getClubMetaLine(club)}</div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
        <dt className="text-slate-500">1인 비용</dt>
        <dd className="text-right font-bold text-slate-900 tabular-nums">
          {cost.toLocaleString('ko-KR')}원
          {weekendGap > 0 && (
            <span className="ml-1 font-normal text-slate-500">주말 +{(weekendGap / 10000).toLocaleString('ko-KR')}만</span>
          )}
        </dd>
        <dt className="text-slate-500">내 예상 타수</dt>
        <dd className="text-right font-bold text-slate-900 tabular-nums">
          {pred.isUnrated ? (
            <span className="font-normal text-slate-400">레이팅 없음</span>
          ) : (
            <>
              {pred.expectedScore}타
              <span className="ml-1 font-normal text-slate-500">
                ({pred.diffFromAverage > 0 ? `+${pred.diffFromAverage}` : pred.diffFromAverage})
              </span>
            </>
          )}
        </dd>
        {slope ? (
          <>
            <dt className="text-slate-500">슬로프</dt>
            <dd className="text-right tabular-nums">{slope}</dd>
          </>
        ) : null}
      </dl>
      {traits.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {traits.map((t) => (
            <span
              key={t.label}
              className={`px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${
                t.tone === 'save' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 text-[10.5px] text-slate-400">1인 비용은 4인·주중·캐디 포함 · 누르면 목록에서 강조</div>
    </div>
  );
};

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

  const activeId = hoverId ?? pinnedId;
  // 전국 단위로 보면 이름이 겹치므로, 확대했거나 범위 안이 적을 때만 이름을 보여 준다.
  const showLabels = zoom >= 11 || visible.length <= 30;

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
                icon={nameIcon(club.name, state)}
                zIndexOffset={state === 'hl' ? 1000 : state === 'cmp' ? 500 : 0}
                eventHandlers={{
                  click: () => handlePinClick(club),
                  mouseover: () => setHoverId(club.id),
                  mouseout: () => setHoverId(null),
                }}
              >
                <Tooltip direction="top" offset={[0, state === 'dot' ? -10 : -40]} opacity={1} className="club-tip">
                  <PinInfo club={club} userAvgScore={userAvgScore} />
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
        <div className="absolute left-3 bottom-3 z-20 bg-white/90 rounded-md px-2 py-1 text-[11px] text-slate-600 border border-slate-200">
          {showLabels ? '핀에 마우스를 올리면 주요 정보' : '확대하면 골프장 이름이 보입니다'} · 지도를 움직이면 목록이 바뀝니다
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
