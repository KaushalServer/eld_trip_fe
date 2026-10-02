export default function TripHistory({
  trips,
  selectedId,
  onSelect,
  onDelete,
}) {
  console.log("Saved trips:", trips);

  if (!trips?.length) {
    return (
      <div className="empty-state">
        <strong>No saved trips yet</strong>
        <span>
          Create your first route above and it will appear here.
        </span>
      </div>
    );
  }

  return (
    <div className="history-list">
      {trips.map((trip) => (
        <article
          className={`history-item ${
            selectedId === trip.id ? "selected" : ""
          }`}
          key={trip.id}
        >
          <button
            className="history-main"
            onClick={() => onSelect(trip.id)}
          >
            <span className="history-status">
              {trip.status}
            </span>

            <strong>
              {trip.current_location} → {trip.dropoff_location}
            </strong>

            <small>
              Pickup: {trip.pickup_location} · {trip.trip_start_date}
            </small>
          </button>

          <div className="history-actions">
            <span>
              {trip.distance_miles
                ? `${trip.distance_miles} mi`
                : "Draft"}
            </span>

            <button
              className="icon-button"
              title="Delete trip"
              onClick={() => onDelete(trip.id)}
            >
              ×
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}