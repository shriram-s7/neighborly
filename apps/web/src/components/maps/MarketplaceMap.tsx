import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatINR } from '../../lib/api';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, ArrowRight } from 'lucide-react';

interface MapListingItem {
  id: string;
  title: string;
  price: number;
  pricingType: string;
  distanceKm: number;
  category: { name: string; slug: string };
  provider: {
    id: string;
    name: string;
    headline: string;
    verificationLevel: string;
    trustScore: number;
    lat: number;
    lng: number;
    neighborhoodName: string;
  };
}

interface MarketplaceMapProps {
  listings: MapListingItem[];
  center: [number, number];
  zoom?: number;
  radiusKm?: number;
  selectedId?: string;
  onSelectListing?: (id: string) => void;
}

// Controller to smoothly pan map when center changes
const MapCenterController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Custom SVG Pin Icon
const createCustomPin = (price: number, isSelected: boolean) => {
  const formattedPrice = formatINR(price);
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${isSelected ? '#D97706' : '#1E293B'};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 11px;
        font-weight: 800;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        transform: translate(-50%, -100%);
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <span>📍</span>
        <span>${formattedPrice}</span>
      </div>
    `,
    iconSize: [60, 30],
    iconAnchor: [30, 30],
  });
};

export const MarketplaceMap: React.FC<MarketplaceMapProps> = ({
  listings,
  center,
  zoom = 14,
  radiusKm = 2.5,
  selectedId,
  onSelectListing,
}) => {
  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-amber-200/80 shadow-md">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <MapCenterController center={center} />

        {/* Clean OpenStreetMap CartoDB Positron / OSM tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Neighborhood Radius Circle */}
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#F59E0B',
            fillColor: '#FBBF24',
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6, 6',
          }}
        />

        {/* Provider Markers */}
        {listings.map((l) => (
          <Marker
            key={l.id}
            position={[l.provider.lat, l.provider.lng]}
            icon={createCustomPin(l.price, l.id === selectedId)}
            eventHandlers={{
              click: () => onSelectListing && onSelectListing(l.id),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 space-y-2 max-w-[240px]">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {l.category.name}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                    {l.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="font-bold text-slate-800">{l.provider.name}</span>
                  <span className="font-extrabold text-amber-700">{formatINR(l.price)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Trust {l.provider.trustScore}/100</span>
                  </span>
                  <span className="font-semibold text-slate-600">{l.distanceKm} km away</span>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/providers/${l.provider.id}`}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors text-center"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel px-3.5 py-2 rounded-xl text-xs space-y-1 shadow-md border border-stone-200">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
          <span>Neighborhood Service Area ({radiusKm} km)</span>
        </div>
        <p className="text-[10px] text-slate-700">Click pins to inspect pricing, trust score, and availability</p>
      </div>
    </div>
  );
};
