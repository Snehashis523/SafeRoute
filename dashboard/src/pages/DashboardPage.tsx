import React, { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [trips, setTrips] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch active trips and alert log from backend
    // Placeholder until dashboard specific GET endpoints are wired
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0056b3' }}>SafeRoute+ Dashboard</h1>
      <section>
        <h2>Active Trips</h2>
        {trips.length === 0 ? <p>No active trips.</p> : null}
      </section>
      
      <section style={{ marginTop: '40px' }}>
        <h2>Alert Log</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
              <th>Time</th>
              <th>Trip ID</th>
              <th>Level</th>
              <th>Reason</th>
              <th>Contacts Notified</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? <tr><td colSpan={5}>No alerts yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

