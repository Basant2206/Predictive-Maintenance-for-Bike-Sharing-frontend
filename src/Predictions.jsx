import React, { useEffect, useState } from 'react';
import MapPlanner from './MapPlanner';
import './Predictions.css';

function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [selectedBikes, setSelectedBikes] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/predictions')
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => b.failure_probability - a.failure_probability);
        setPredictions(sorted);
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const getRiskColor = (probability) => {
    if (probability > 0.99) return 'high-risk';
    if (probability > 0.9) return 'medium-risk';
    return 'low-risk';
  };

  const toggleBikeSelection = (bike_id) => {
    setSelectedBikes(prev =>
      prev.includes(bike_id)
        ? prev.filter(id => id !== bike_id)
        : [...prev, bike_id]
    );
  };

  return (
    <div className="dashboard">
      <h1>Sellect Bike Id for Prediction Root</h1>
      
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Bike ID</th>
            <th>Component</th>
            <th>Failure Probability</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((item, index) => (
            <tr key={index} className={getRiskColor(item.failure_probability)}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedBikes.includes(item.bike_id)}
                  onChange={() => toggleBikeSelection(item.bike_id)}
                />
              </td>
              <td>{item.bike_id}</td>
              <td>{item.component_failed}</td>
              <td>{item.failure_probability.toFixed(7)}</td>
              <td>{getRiskColor(item.failure_probability).replace('-', ' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedBikes.length > 0 && (
        <div className="map-section">
          <h3>🗺️ Select Locations for Chosen Bikes</h3>
          <MapPlanner selectedBikes={selectedBikes} />
        </div>
      )}
    </div>
  );
}

export default Predictions;
