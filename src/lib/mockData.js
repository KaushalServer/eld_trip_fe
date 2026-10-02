const routeCoordinates = [
  [-96.797, 32.777],
  [-97.35, 33.0],
  [-97.52, 33.2],
  [-97.74, 33.42],
  [-97.94, 33.63],
  [-97.52, 34.03],
  [-97.42, 34.75],
  [-96.65, 35.46],
  [-95.99, 36.15],
  [-95.37, 36.15],
  [-94.57, 36.93],
  [-94.58, 37.69],
  [-94.58, 38.25],
  [-94.58, 38.95],
  [-94.58, 39.10],
];

const points = [
  { name: "Current", display_name: "Dallas, TX", lat: 32.777, lon: -96.797 },
  { name: "Pickup", display_name: "Oklahoma City, OK", lat: 35.4676, lon: -97.5164 },
  { name: "Dropoff", display_name: "Kansas City, MO", lat: 39.0997, lon: -94.5786 },
];

export function buildMockResult(form) {
  const start = form.trip_start_date || new Date().toISOString().slice(0, 10);
  const cycleUsed = Number(form.cycle_used_hours || 12);

  return {
    mode: "mock",
    trip: {
      id: "frontend-demo",
      current_location: form.current_location || "Dallas, TX",
      pickup_location: form.pickup_location || "Oklahoma City, OK",
      dropoff_location: form.dropoff_location || "Kansas City, MO",
      distance_miles: 730,
      route_duration_hours: 11.7,
      pickup_hours: 1,
      dropoff_hours: 1,
      fuel_stops: 1,
      cycle_used_hours: cycleUsed,
    },
    route: {
      points,
      geojson: { coordinates: routeCoordinates },
    },
    schedule: {
      cycle_remaining_estimate: Math.max(0, 70 - cycleUsed - 14.7).toFixed(2),
      days: [
        {
          date: start,
          total_driving_hours: 8,
          events: [
            { type: "OFF_DUTY", label: "Off Duty", start: `${start}T00:00:00`, duration_hours: 7 },
            { type: "DRIVING", label: "Driving", start: `${start}T07:00:00`, duration_hours: 4 },
            { type: "ON_DUTY", label: "Pickup", start: `${start}T11:00:00`, duration_hours: 1 },
            { type: "DRIVING", label: "Driving", start: `${start}T12:00:00`, duration_hours: 4 },
            { type: "ON_DUTY", label: "Fuel", start: `${start}T16:00:00`, duration_hours: 0.5 },
            { type: "OFF_DUTY", label: "30-min break", start: `${start}T16:30:00`, duration_hours: 0.5 },
            { type: "DRIVING", label: "Driving", start: `${start}T17:00:00`, duration_hours: 0 },
            { type: "OFF_DUTY", label: "Off Duty", start: `${start}T17:00:00`, duration_hours: 7 },
          ],
        },
        {
          date: addDays(start, 1),
          total_driving_hours: 3.7,
          events: [
            { type: "OFF_DUTY", label: "Off Duty", start: `${addDays(start, 1)}T00:00:00`, duration_hours: 6 },
            { type: "DRIVING", label: "Driving", start: `${addDays(start, 1)}T06:00:00`, duration_hours: 3.7 },
            { type: "ON_DUTY", label: "Dropoff", start: `${addDays(start, 1)}T09:42:00`, duration_hours: 1 },
            { type: "OFF_DUTY", label: "Off Duty", start: `${addDays(start, 1)}T10:42:00`, duration_hours: 13.3 },
          ],
        },
      ],
    },
  };
}

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}
