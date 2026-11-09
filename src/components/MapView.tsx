import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, formatPrice } from '../utils/calculator';
import { Star } from 'lucide-react';

interface MapViewProps {
  clubs: GolfClub[];
  onSelectClub: (club: GolfClub) => void;
  comparedIds: Set<string>;
  onToggleCompare: (club: GolfClub) => void;
}

// Custom Leaflet Pin Icon
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const MapView: React.FC<MapViewProps> = ({
  clubs,
  onSelectClub,
  comparedIds,
  onToggleCompare,
}) => {
  // Center of South Korea (around Cheonan / Chungcheong)
  const defaultCenter: [number, number] = [36.8, 127.3];

  return (
    <div className="relative w-full h-[650px] rounded-3xl overflow-hidden border border-slate-200 shadow-md">
      <MapContainer
        center={defaultCenter}
        zoom={8}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {clubs.map((club) => {
          const cost = calculateCostPerPerson(club, false, 4, true);
          const isCompared = comparedIds.has(club.id);

          return (
            <Marker
              key={club.id}
              position={[club.coordinates.lat, club.coordinates.lng]}
              icon={customIcon}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {club.region} ({club.address.split(' ')[0] || club.region})
                    </span>
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {club.rating.toFixed(1)}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                    {club.name}
                  </h4>

                  <div className="text-[11px] text-slate-600 mb-2 space-y-0.5">
                    <div>잔디: <span className="font-bold">{club.grass.fairway}</span></div>
                    <div>1인 실부담: <span className="font-bold text-emerald-700">{formatPrice(cost.totalPerPerson)}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100">
                    <button
                      onClick={() => onSelectClub(club)}
                      className="py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => onToggleCompare(club)}
                      className={`py-1 rounded text-[11px] font-bold border transition-all ${isCompared
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      {isCompared ? '비교중' : '비교 담기'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Info Pill on Map */}
      <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md text-xs font-bold text-slate-800 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>지도에 표시된 골프장 {clubs.length}개</span>
      </div>
    </div>
  );
};
