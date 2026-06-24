import { Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import LiveDot from '../ui/LiveDot';
import { normalizeCase } from '../../lib/utils';

const MAP_STYLE = 'streets-v2';

const patientIcon = L.divIcon({
  className: 'resqpk-marker',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#EF4444;border:3px solid #fff;box-shadow:0 0 0 4px rgba(239,68,68,0.25)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const hospitalIcon = L.divIcon({
  className: 'resqpk-marker',
  html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:#10B981;color:#fff;font-weight:bold;font-size:20px;line-height:1;border:2px solid #fff">+</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function driverIcon(heading = 0) {
  return L.divIcon({
    className: 'resqpk-marker',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;border:2px solid #fff;transform:rotate(${heading}deg)">🚑</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function LiveMapPanel({
  activeCases = [],
  hospitalLat,
  hospitalLng,
  driverPositions = {},
  onCaseClick,
}) {
  const center = [hospitalLat ?? 25.3792, hospitalLng ?? 68.3683];
  const cases = activeCases
    .map(normalizeCase)
    .filter((c) => Number.isFinite(c.patientLat) && Number.isFinite(c.patientLng));

  return (
    <div className="relative w-full h-full">
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl>
        <TileLayer
          url={`https://api.maptiler.com/maps/${MAP_STYLE}/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
          attribution="© MapTiler © OpenStreetMap contributors"
        />

        {Number.isFinite(hospitalLat) && Number.isFinite(hospitalLng) && (
          <Marker position={[hospitalLat, hospitalLng]} icon={hospitalIcon} />
        )}

        {cases.map((c) => {
          const live = driverPositions[c.driverId];
          const dLat = live?.lat ?? c.driverLat;
          const dLng = live?.lng ?? c.driverLng;
          const hasDriver = Number.isFinite(dLat) && Number.isFinite(dLng);
          return (
            <Fragment key={c.id}>
              <Marker
                position={[c.patientLat, c.patientLng]}
                icon={patientIcon}
                eventHandlers={{ click: () => onCaseClick?.(c.id) }}
              />
              {hasDriver && (
                <>
                  <Marker position={[dLat, dLng]} icon={driverIcon(live?.heading ?? 0)}>
                    <Popup>
                      <div style={{ minWidth: 120 }}>
                        <strong>{c.driverName ?? 'Driver'}</strong>
                        <br />
                        {c.vehicle ?? ''}
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline
                    positions={[
                      [dLat, dLng],
                      [c.patientLat, c.patientLng],
                    ]}
                    pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.8, dashArray: '8 8' }}
                  />
                </>
              )}
            </Fragment>
          );
        })}
      </MapContainer>

      <div className="absolute top-3 right-3 z-[1000] bg-white/90 rounded-full px-3 py-1 text-xs font-medium shadow">
        {cases.length} Active
      </div>
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 rounded-full px-3 py-1 shadow">
        <LiveDot label="Live tracking" />
      </div>
    </div>
  );
}
