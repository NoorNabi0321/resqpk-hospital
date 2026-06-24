import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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

const STATUS_TEXT = {
  searching: 'Finding an ambulance…',
  driver_assigned: 'Ambulance on the way',
  en_route: 'Patient in ambulance, heading to hospital',
  arrived: 'Ambulance has arrived',
  completed: 'Patient has reached the hospital',
  cancelled: 'This emergency was cancelled',
};

// Keeps the map framed around all available points as they move.
function FitPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (valid.length === 1) map.setView(valid[0], 15);
    else if (valid.length > 1) map.fitBounds(valid, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function expiryLabel(expiresAt) {
  if (!expiresAt) return null;
  const hrs = (new Date(expiresAt) - Date.now()) / 3600000;
  if (hrs <= 0) return 'This link has expired';
  if (hrs < 1) return `This link expires in ${Math.round(hrs * 60)} minutes`;
  return `This link expires in ${Math.round(hrs)} hour${Math.round(hrs) === 1 ? '' : 's'}`;
}

export default function TrackingPage() {
  const { token } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['track', token],
    queryFn: async () => (await axios.get(`${API_URL}/api/cases/track/${token}`)).data.data,
    refetchInterval: 10000,
    retry: false,
  });

  const patient = data?.patientLocation;
  const driver = data?.driverLocation;
  const hospital = data?.hospitalLocation;
  const etaMin = data?.etaSeconds ? Math.round(data.etaSeconds / 60) : null;

  const points = [
    patient && [Number(patient.lat), Number(patient.lng)],
    driver && [Number(driver.lat), Number(driver.lng)],
    hospital && [Number(hospital.lat), Number(hospital.lng)],
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col shadow-sm">
        {/* Banner */}
        <header className="bg-emergency-red text-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">ResQPK</span>
            <span className="text-white/80 text-sm">Live Emergency Tracking</span>
          </div>
          {data && (
            <p className="text-[11px] text-white/70 mt-0.5">{expiryLabel(data.expiresAt)}</p>
          )}
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading tracking…
          </div>
        ) : isError || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-2">
            <p className="text-lg font-semibold text-gray-800">Link expired or invalid</p>
            <p className="text-sm text-gray-500">
              This tracking link is no longer active. Please contact the family member who shared it.
            </p>
          </div>
        ) : (
          <>
            {/* Map */}
            <div className="h-[350px]">
              {points.length > 0 && (
                <MapContainer
                  center={points[0]}
                  zoom={14}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl
                >
                  <TileLayer
                    url={`https://api.maptiler.com/maps/${MAP_STYLE}/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
                    attribution="© MapTiler © OpenStreetMap contributors"
                  />
                  {patient && Number.isFinite(Number(patient.lat)) && (
                    <Marker position={[Number(patient.lat), Number(patient.lng)]} icon={patientIcon} />
                  )}
                  {driver && Number.isFinite(Number(driver.lat)) && (
                    <Marker
                      position={[Number(driver.lat), Number(driver.lng)]}
                      icon={driverIcon(driver.heading ?? 0)}
                    />
                  )}
                  {hospital && Number.isFinite(Number(hospital.lat)) && (
                    <Marker
                      position={[Number(hospital.lat), Number(hospital.lng)]}
                      icon={hospitalIcon}
                    />
                  )}
                  <FitPoints points={points} />
                </MapContainer>
              )}
            </div>

            {/* Status card */}
            <div className="px-5 py-5 flex-1">
              <div className="rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emergency-red animate-pulse" />
                  <p className="text-lg font-semibold text-gray-900">
                    {STATUS_TEXT[data.status] ?? 'Tracking your ambulance'}
                  </p>
                </div>
                {etaMin != null && data.status !== 'completed' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Estimated arrival: <span className="font-semibold">{etaMin} minutes</span>
                  </p>
                )}
                {data.hospitalName && (
                  <p className="text-sm text-gray-600 mt-1">
                    Destination: <span className="font-medium">{data.hospitalName}</span>
                  </p>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emergency-red" /> Patient
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Ambulance
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emergency-green" /> Hospital
                </span>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="px-5 py-4 border-t border-gray-100 text-center">
          <p className="text-sm font-semibold text-gray-800">For emergencies call: 1122</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Powered by ResQPK</p>
        </footer>
      </div>
    </div>
  );
}
