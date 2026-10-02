import { useEffect, useRef } from "react";

const ROWS = [
  { key: "OFF_DUTY", label: "Off Duty" },
  { key: "SLEEPER", label: "Sleeper Berth" },
  { key: "DRIVING", label: "Driving" },
  { key: "ON_DUTY", label: "On Duty (not driving)" },
];

function clampHour(value) {
  return Math.max(0, Math.min(24, Number(value)));
}

function hourFromDate(dateTime) {
  const date = new Date(dateTime);

  return (
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600
  );
}

function eventEndHour(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const startDay = start.toISOString().slice(0, 10);
  const endDay = end.toISOString().slice(0, 10);

  // Event reaches/crosses midnight.
  if (startDay !== endDay) {
    return 24;
  }

  return clampHour(hourFromDate(event.end));
}

function formatEventTime(dateTime) {
  const date = new Date(dateTime);

  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}`;
}

export default function ELDLogSheet({ day }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !day) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const width = 1200;
    const height = 430;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;

    // Reset transform before applying DPR.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const left = 150;
    const right = 24;
    const top = 55;

    const gridWidth = width - left - right;
    const rowHeight = 72;

    const bottom =
      top + rowHeight * ROWS.length;

    /*
    |--------------------------------------------------------------------------
    | Header
    |--------------------------------------------------------------------------
    */

    ctx.fillStyle = "#172033";
    ctx.font =
      "700 18px Inter, system-ui, sans-serif";

    ctx.fillText(
      `Drivers Daily Log — ${day.date}`,
      24,
      30
    );

    ctx.font =
      "13px Inter, system-ui, sans-serif";

    ctx.fillStyle = "#667085";

    ctx.fillText(
      "Planned / proposed schedule · 24-hour grid",
      24,
      48
    );

    /*
    |--------------------------------------------------------------------------
    | Horizontal Grid
    |--------------------------------------------------------------------------
    */

    ctx.strokeStyle = "#98a2b3";
    ctx.lineWidth = 1;

    for (
      let row = 0;
      row <= ROWS.length;
      row++
    ) {
      const y =
        top + row * rowHeight;

      ctx.beginPath();

      ctx.moveTo(left, y);
      ctx.lineTo(left + gridWidth, y);

      ctx.stroke();
    }

    /*
    |--------------------------------------------------------------------------
    | Hour Grid
    |--------------------------------------------------------------------------
    */

    ctx.font =
      "11px Inter, system-ui, sans-serif";

    for (let hour = 0; hour <= 24; hour++) {
      const x =
        left +
        (hour / 24) * gridWidth;

      ctx.strokeStyle = "#cfd4dc";
      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);

      ctx.stroke();

      if (hour < 24) {
        ctx.fillStyle = "#667085";

        ctx.fillText(
          String(hour).padStart(2, "0"),
          x + 3,
          top - 10
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Row Labels
    |--------------------------------------------------------------------------
    */

    ROWS.forEach((row, index) => {
      const y =
        top + index * rowHeight;

      ctx.fillStyle = "#344054";

      ctx.font =
        "600 13px Inter, system-ui, sans-serif";

      ctx.fillText(
        row.label,
        24,
        y + 39
      );
    });

    /*
    |--------------------------------------------------------------------------
    | Prepare Events
    |--------------------------------------------------------------------------
    */

    const events = [...(day.events || [])]
      .filter(
        (event) =>
          Number(event.duration_hours) > 0
      )
      .sort(
        (a, b) =>
          new Date(a.start) -
          new Date(b.start)
      );

    /*
    |--------------------------------------------------------------------------
    | Draw Continuous ELD Line
    |--------------------------------------------------------------------------
    */

    let previousEvent = null;

    events.forEach((event) => {
      const rowIndex =
        ROWS.findIndex(
          (row) =>
            row.key === event.type
        );

      if (rowIndex < 0) {
        return;
      }

      const startHour =
        clampHour(
          hourFromDate(event.start)
        );

      const endHour =
        eventEndHour(event);

      if (endHour <= startHour) {
        return;
      }

      const x1 =
        left +
        (startHour / 24) *
          gridWidth;

      const x2 =
        left +
        (endHour / 24) *
          gridWidth;

      const y =
        top +
        rowIndex * rowHeight +
        rowHeight / 2;

      /*
       * Connect previous duty status
       * to the new duty status.
       */
      if (previousEvent) {
        const previousRow =
          ROWS.findIndex(
            (row) =>
              row.key ===
              previousEvent.type
          );

        if (previousRow >= 0) {
          const previousY =
            top +
            previousRow *
              rowHeight +
            rowHeight / 2;

          ctx.strokeStyle =
            "#101828";

          ctx.lineWidth = 2;

          ctx.beginPath();

          ctx.moveTo(
            x1,
            previousY
          );

          ctx.lineTo(
            x1,
            y
          );

          ctx.stroke();
        }
      }

      /*
       * Draw horizontal duty line.
       */
      ctx.strokeStyle =
        "#101828";

      ctx.lineWidth = 4;

      ctx.beginPath();

      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);

      ctx.stroke();

      previousEvent = event;
    });
  }, [day]);

  return (
    <div className="eld-sheet">
      <canvas
        ref={canvasRef}
        aria-label={`ELD log for ${day?.date || ""}`}
      />

      <div className="eld-meta">
        <span>
          <strong>Driving:</strong>{" "}
          {day?.total_driving_hours ?? 0} h
        </span>

        <span>
          <strong>Events:</strong>{" "}
          {day?.events?.length ?? 0}
        </span>

        <span>
          <strong>Status:</strong>{" "}
          Planned schedule
        </span>
      </div>
      <div className="eld-events">
        <h4>Trip Events</h4>

        {(day?.events || [])
          .filter((event) =>
            [
              "Pickup",
              "Driving",
              "30-minute driving break",
              "Fuel",
              "10-hour reset/rest",
              "Dropoff",
            ].includes(event.label)
          )
          .map((event, index) => (
            <div
              className="eld-event"
              key={`${event.start}-${event.label}-${index}`}
            >
              <span className="eld-event-time">
                {formatEventTime(event.start)}
                {" – "}
                {formatEventTime(event.end)}
              </span>

              <strong>{event.label}</strong>

              {Number(event.miles) > 0 && (
                <span className="eld-event-miles">
                  {Number(event.miles).toFixed(1)} mi
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}