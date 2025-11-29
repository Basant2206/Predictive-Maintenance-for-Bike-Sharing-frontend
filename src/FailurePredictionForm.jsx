import { useState } from "react";
import "./FailurePredictionForm.css";

function FailurePredictionForm() {
  const [formData, setFormData] = useState({
    ride_duration: 45,
    distance: 12.5,
    avg_vibration: 3.0,
    component_failed: "brakes",
    avg_vibration_last_10_rides: 3.0,
    total_km_since_last_maintenance: 300,
    rain: 0,
    num_rides_in_rain_last_30_days: 20,
    days_since_last_serviced: 60
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "rain") {
      parsedValue = parseInt(value);
    } else if (name !== "component_failed") {
      parsedValue = parseFloat(value);
    }

    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPrediction(null);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setPrediction(data.failure_probability);
    } catch (err) {
      setError("Failed to get prediction. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (label, name, min, max, step = 1) => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <div className="slider-container">
        <input
          id={name}
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={formData[name]}
          onChange={handleChange}
          className="slider"
        />
        <span className="slider-value">{formData[name]}</span>
      </div>
    </div>
  );

  return (
    <div className="fullscreen">
      <div className="card">
        <h2>🚲 Bike Failure Prediction</h2>
        <form onSubmit={handleSubmit}>
          {renderSlider("Ride Duration (min)", "ride_duration", 5, 120)}
          {renderSlider("Distance (km)", "distance", 1, 30, 0.1)}
          {renderSlider("Avg Vibration", "avg_vibration", 0.5, 6, 0.1)}

          <div className="form-group">
            <label htmlFor="component_failed">Component Failed</label>
            <select
              id="component_failed"
              name="component_failed"
              value={formData.component_failed}
              onChange={handleChange}
            >
              <option value="brakes">Brakes</option>
              <option value="tires">Tires</option>
              <option value="chain">Chain</option>
              <option value="gears">Gears</option>
            </select>
          </div>

          {renderSlider("Avg Vibration (last 10 rides)", "avg_vibration_last_10_rides", 0.5, 6, 0.1)}
          {renderSlider("Total KM Since Last Maintenance", "total_km_since_last_maintenance", 100, 800)}

          <div className="form-group">
            <label htmlFor="rain">Rain</label>
            <select id="rain" name="rain" value={formData.rain} onChange={handleChange}>
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>

          {renderSlider("Num Rides in Rain (last 30 days)", "num_rides_in_rain_last_30_days", 0, 115)}
          {renderSlider("Days Since Last Serviced", "days_since_last_serviced", 60, 140)}

          <button type="submit" disabled={loading} className="btn">
            {loading ? "Predicting..." : "Predict Failure"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {prediction !== null && (
          <div className="result">Failure Probability: {prediction}%</div>
        )}
      </div>
    </div>
  );
}

export default FailurePredictionForm;
