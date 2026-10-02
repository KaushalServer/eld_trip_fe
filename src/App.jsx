import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { downloadPdf, health, MOCK_MODE } from './lib/api';
import { restoreSession, signOut as signOutAction } from './store/authSlice';
import { fetchTrips, createPlan, removeTrip as removeTripAction, selectTrip as selectTripAction, clearResult, clearTrips } from './store/tripsSlice';
import AuthPanel from './components/AuthPanel';
import MapView from './components/MapView';
import ELDLogSheet from './components/ELDLogSheet';
import TripHistory from './components/TripHistory';
import './styles.css';

const today = new Date().toISOString().slice(0, 10);
const initialForm = { 
  current_location: 'Dallas, TX', 
  pickup_location: 'Oklahoma City, OK', 
  dropoff_location: 'Kansas City, MO', 
  cycle_used_hours: 12, 
  trip_start_date: today 
};

function Field({ label, ...props }) { return <label>{label}<input {...props} /></label>; }

export default function App() {
  const dispatch = useDispatch();
  const { user, checked: authChecked } = useSelector(state => state.auth);
  const { items: trips, result, selectedId, loading, error: tripError } = useSelector(state => state.trips);
  const [form, setForm] = useState(initialForm);
  const [localError, setLocalError] = useState('');
  const [serviceStatus, setServiceStatus] = useState('checking');
  const error = localError || tripError || '';

  useEffect(() => {
    health().then(() => setServiceStatus('online')).catch(() => setServiceStatus('offline'));
    if (MOCK_MODE) return;
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    if (user && !MOCK_MODE) dispatch(fetchTrips());
  }, [user, dispatch]);

  const plannedTrip = result?.trip;
  const totalDriving = useMemo(() => result?.schedule?.days?.reduce((sum, d) => sum + d.total_driving_hours, 0) || 0, [result]);

  async function submit(e) {
    e.preventDefault();
    const tripPayload = {
      current_location: form.current_location,
      pickup_location: form.pickup_location,
      dropoff_location: form.dropoff_location,
      cycle_used_hours: Number(form.cycle_used_hours),
      trip_start_date: form.trip_start_date,
    };
    setLocalError('');
    const action = await dispatch(createPlan(tripPayload));
    if (createPlan.fulfilled.match(action) && !MOCK_MODE) dispatch(fetchTrips());
  }

  async function removeTrip(id) {
    if (!window.confirm('Delete this trip?')) return;
    setLocalError('');
    await dispatch(removeTripAction(id));
  }

  function loadDemo() {
    setForm(initialForm);
    dispatch(clearResult());
    setLocalError('');
  }

  async function signOut() {
    await dispatch(signOutAction());
    dispatch(clearTrips());
  }

  function selectTrip(id) {
    dispatch(selectTripAction(id));
    setLocalError('');
    const t = trips?.find(x => x.id === id);
    if (!t) return;
    setForm({ 
      current_location: t.current_location, 
      pickup_location: t.pickup_location, 
      dropoff_location: t.dropoff_location, 
      cycle_used_hours: t.cycle_used_hours, 
      trip_start_date: t.trip_start_date 
    });
    if (t.distance_miles) setLocalError('This saved trip contains its route summary. Generate a new plan to load fresh map/HOS details.');
  }

  if (!MOCK_MODE && !authChecked) return <div className="splash">Restoring session…</div>;
  if (!user && !MOCK_MODE) return <AuthPanel />;

  return <div className="app">
    <header className="topbar">
      <div className="brand">
        <div className="logo">ELD</div>
        <div>
          <h1>ELD Trip Planner</h1>
          <span>Route planning · HOS scheduling · Daily logs</span>
        </div>
      </div>
      <div className="top-actions">
        <div className={`mode-pill ${serviceStatus === 'online' ? 'live' : ''}`}>
          <span className="dot" />{serviceStatus === 'online' ? 'API online' : 'API offline'}
        </div>
          {user && 
          <><span className="user-chip">{user.username}</span><button className="secondary compact" onClick={signOut}>Sign out</button>
          </>}
      </div>
    </header>

    <main className="dashboard">
      {MOCK_MODE && 
      <div className="demo-banner">
        <strong>Demo mode.</strong> Set <code>VITE_MOCK_MODE=false</code> to use the complete Node backend.</div>}
      <section className="hero card">
        <div>
          <p className="eyebrow">DRIVER WORKSPACE</p>
          <h2>Build a route and turn it into a daily duty schedule.</h2>
          <p className="muted">Enter the current location, pickup, dropoff, cycle usage and start date. The backend geocodes the stops, calculates a road route, applies the HOS planning rules, and prepares ELD-style daily logs.</p>
        </div>
        <button className="secondary" onClick={loadDemo}>Load sample trip</button>
      </section>

      <section className="workspace-grid">
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STEP 1</p>
              <h2>Trip details</h2>
              <p>Required inputs for the route planner.</p>
            </div>
            <span className="step">LIVE API</span>
          </div>
          <form onSubmit={submit} className="trip-form">
            <Field label="Current location" required value={form.current_location} onChange={e => setForm({ ...form, current_location: e.target.value })} placeholder="Dallas, TX" />
            <Field label="Pickup location" required value={form.pickup_location} onChange={e => setForm({ ...form, pickup_location: e.target.value })} placeholder="Oklahoma City, OK" />
            <Field label="Dropoff location" required value={form.dropoff_location} onChange={e => setForm({ ...form, dropoff_location: e.target.value })} placeholder="Kansas City, MO" />
            <Field label="Current cycle used (hours)" required min="0" max="70" step="0.25" type="number" value={form.cycle_used_hours} onChange={e => setForm({ ...form, cycle_used_hours: e.target.value })} />
            <Field label="Trip start date" required type="date" value={form.trip_start_date} onChange={e => setForm({ ...form, trip_start_date: e.target.value })} />
            <div className="form-action">
              <button disabled={loading}>{loading ? 'Planning route…' : 'Generate trip plan'}</button>
            </div>
          </form>
          {error && <div className="error">{error}</div>}
        </section>
        <section className="card history-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MY TRIPS</p>
              <h2>Saved plans</h2>
              <p>Trips are scoped to the signed-in account.</p>
            </div>
            <span className="tag">{trips?.length}</span>
          </div>
          <TripHistory trips={trips} selectedId={selectedId} onSelect={selectTrip} onDelete={removeTrip} />
        </section>
      </section>

      {result && <>
        <section className="stats">
          <div className="stat">
            <span>ROUTE</span>
            <strong>{plannedTrip.distance_miles}</strong>
            <small>road miles</small>
          </div>
          <div className="stat">
            <span>DRIVING</span>
            <strong>{totalDriving.toFixed(1)}</strong>
            <small>scheduled hours</small>
          </div>
          <div className="stat">
            <span>LOGS</span>
            <strong>{result.schedule.days.length}</strong>
            <small>daily sheets</small>
          </div>
          <div className="stat">
            <span>CYCLE LEFT</span>
            <strong>{result.schedule.cycle_remaining_estimate}</strong>
            <small>estimated hours</small>
          </div>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STEP 2</p>
              <h2>Route & stops</h2>
              <p>{plannedTrip.current_location} to {plannedTrip.dropoff_location} via pickup.</p>
            </div>
            <span className="tag">{plannedTrip.status}</span>
          </div>
          <MapView route={result.route} />
          <div className="stop-grid">
            {result.route.points.map((point, index) => 
            <div className="stop" key={`${point.name}-${index}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{point.name}</strong>
                <small>{point.display_name}</small>
              </div>
            </div>)}
            <div className="stop">
              <span>F</span>
              <div>
                <strong>Fuel planning</strong>
                <small>Inserted when the route crosses the 1,000-mile assumption.</small>
              </div>
            </div>
            <div className="stop">
              <span>B</span>
              <div>
                <strong>30-minute break</strong>
                <small>Inserted after the 8-hour driving threshold.</small>
              </div>
            </div>
          </div>
          <div className="attribution">Routing: OSRM · Geocoding: Nominatim · Map: OpenStreetMap contributors</div>
        </section>
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STEP 3</p>
              <h2>HOS schedule</h2>
              <p>Chronological duty events grouped by calendar day.</p>
            </div>
          </div>
          {result.schedule.days.map((day, index) => 
          <div className="day" key={day.date}>
            <div className="day-header">
              <div>
                <h3>Day {index + 1} · {day.date}</h3>
                <span>{day.total_driving_hours} hours driving · {day.on_duty_hours} hours on duty</span>
              </div>
              <span className="tag">70/8 cycle</span>
            </div>
            <div className="event-list">
              {day.events.filter(e => e.duration_hours > 0).map((event, i) => 
              <div className="event" key={`${event.start}-${i}`}>
                <span>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <strong>{event.label}</strong>
                <span>{event.duration_hours} h</span>
              </div>)}
            </div>
          </div>)}
        </section>
        <section className="card eld-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STEP 4</p>
              <h2>Daily ELD logs</h2>
              <p>Review the planned duty-status visualization and export the PDF generated by Node.</p>
            </div>
            <div className="button-row">
              <button className="secondary" onClick={() => window.print()}>Print</button>
              <button onClick={() => downloadPdf(plannedTrip.id).catch(e => setLocalError(e.message))}>Download PDF</button>
            </div>
          </div>
          <div className="notice">
            <strong>Assignment prototype:</strong> these are planned/proposed duty-status schedules, not certified electronic logging device records.
          </div>
          {result.schedule.days.map(day => <ELDLogSheet key={day.date} day={day} />)}
        </section>
      </>}
      <footer>
        <span>ELD Trip Planner · Node + React</span>
        <span>Secure account · MongoDB · OSRM · Nominatim · PDF export</span>
      </footer>
    </main>
  </div>;
}
