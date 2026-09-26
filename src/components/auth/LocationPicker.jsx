import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin } from 'lucide-react';

const MAP_STYLE = 'streets-v2';

// Hyderabad, Sindh. Somewhere to start that is not the middle of the ocean.
const DEFAULT = { lat: 25.396, lng: 68.3578 };

const pin = L.divIcon({
  className: '',
  html: `<div style="
    width:26px;height:26px;border-radius:50% 50% 50% 0;background:#F4551E;
    border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    transform:rotate(-45deg)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Recentre({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15));
  }, [position, map]);
  return null;
}

/**
 * Where the facility is, picked rather than typed.
 *
 * Camp registration asked for a latitude and a longitude in two text boxes,
 * which is a question almost nobody can answer about their own building. Every
 * wrong answer puts an ambulance or a patient at the wrong address, and a
 * digit dropped from 68.3578 lands them in a different province.
 */
export default function LocationPicker({ lat, lng, onChange }) {
  const [locating, setLocating] = useState(false);

  const position = useMemo(() => {
    const a = Number(lat);
    const b = Number(lng);
    return Number.isFinite(a) && Number.isFinite(b) && a !== 0 ? [a, b] : null;
  }, [lat, lng]);

  const pick = ({ lat: a, lng: b }) =>
    onChange({ lat: a.toFixed(6), lng: b.toFixed(6) });

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pick({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <div className="relative h-[240px] overflow-hidden rounded-lg border border-line">
        <MapContainer
          center={position || [DEFAULT.lat, DEFAULT.lng]}
          zoom={position ? 16 : 13}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            url={`https://api.maptiler.com/maps/${MAP_STYLE}/{z}/{x}/{y}@2x.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
            tileSize={512}
            zoomOffset={-1}
          />
          <ClickToPlace onPick={pick} />
          <Recentre position={position} />
          {position && (
            <Marker
              position={position}
              icon={pin}
              draggable
              eventHandlers={{ dragend: (e) => pick(e.target.getLatLng()) }}
            />
          )}
        </MapContainer>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-medium text-ink-soft shadow-card hover:bg-page disabled:opacity-60"
        >
          <Crosshair size={13} /> {locating ? 'Finding…' : 'Use my location'}
        </button>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-faint">
        <MapPin size={12} />
        {position
          ? `Pinned at ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} — tap the map or drag the pin to adjust`
          : 'Tap the map to drop a pin, or use your current location'}
      </p>
    </div>
  );
}
