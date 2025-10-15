import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapPlanner.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function MapPlanner({ selectedBikes = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [bikeCoords, setBikeCoords] = useState({});
  const [route, setRoute] = useState(null);
  


  // Initialize map once
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [88.3639, 22.5726], // Kolkata
      zoom: 12,
    });
  }, []);

  // Attach click handler after map is ready
  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e) => {
      const lngLat = [e.lngLat.lng, e.lngLat.lat];

      setBikeCoords(prev => {
        const nextBike = selectedBikes.find(id => !(id in prev));
        if (nextBike) {
          new mapboxgl.Marker()
            .setLngLat(lngLat)
            .setPopup(new mapboxgl.Popup().setText(`Bike: ${nextBike}`))
            .addTo(map.current);
          return { ...prev, [nextBike]: lngLat };
        }
        return prev;
      });
    };

    map.current.on('click', handleClick);
    return () => map.current.off('click', handleClick);
  }, [selectedBikes]);

  // Draw route when available
  useEffect(() => {
    if (!map.current || !route) return;

    if (map.current.getSource('route')) {
      map.current.getSource('route').setData(route);
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: route,
      });
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ff0000', 'line-width': 4 },
      });
    }
  }, [route]);

  const planRoute = () => {
  const assigned = selectedBikes.filter(id => id in bikeCoords);
  const missing = selectedBikes.filter(id => !(id in bikeCoords));

  if (missing.length > 0) {
    alert(`Please click on the map to assign locations for: ${missing.join(', ')}`);
    return;
  }

  if (assigned.length < 2) {
    alert('Please assign locations to at least two bikes to plan a route.');
    return;
  }

  const payload = {
    bike_ids: assigned,
    locations: bikeCoords,
  };

  fetch('http://localhost:8000/plan_route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(res => res.json())
    .then(data => {
      if (!data.trips || data.trips.length === 0) {
        alert('Mapbox did not return a route. Please check coordinates or try again.');
        return;
      }
      setRoute(data.trips[0].geometry);
    })
    .catch(err => {
      console.error('Route planning failed:', err);
      alert('Route planning failed. Please check backend logs.');
    });
};


  return (
    <div>
      <p>🖱️ Click on the map to assign locations to selected bikes.</p>
      <button onClick={planRoute}>Plan Route</button>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default MapPlanner;
