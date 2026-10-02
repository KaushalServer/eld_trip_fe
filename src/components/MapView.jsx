import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitRoute({ positions }) {
  const map = useMap();
  if (positions.length > 1) map.fitBounds(positions, { padding: [28, 28] });
  return null;
}

export default function MapView({ route }) {
  if (!route?.geojson?.coordinates?.length) 
    return <div className="map-empty">No route geometry available.</div>;
  const positions = route.geojson.coordinates.map(([lon, lat]) => [lat, lon]);
  const center = positions[Math.floor(positions.length / 2)] || positions[0];
  return <div className="map-wrapper">
    <MapContainer center={center} zoom={5} scrollWheelZoom className="map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitRoute positions={positions} />
      <Polyline positions={positions} pathOptions={{ weight: 5 }} />
      {route.points.map((p, i) => 
      <Marker key={`${p.name}-${i}`} position={[p.lat, p.lon]}>
        <Popup>
          <strong>{p.name}</strong>
          <br />{p.display_name}
        </Popup>
      </Marker>
    )}
    </MapContainer>
  </div>;
}
