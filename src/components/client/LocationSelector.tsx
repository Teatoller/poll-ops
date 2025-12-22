// src/components/LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import type { LocationData } from '../../types';

interface LocationSelectorProps {
  onSelect: (locationData: LocationData) => void;
  errors: { [key: string]: string };
}

interface Division {
  id: number;
  name: string;
  pollingStations: string[];
}

interface County {
  id: number;
  name: string;
  divisions: Division[];
}

// Mock data - replace with actual API calls
const locationData: County[] = [
  {
    id: 1,
    name: 'Nairobi',
    divisions: [
      {
        id: 1,
        name: 'Westlands',
        pollingStations: ['Station A', 'Station B', 'Station C']
      },
      {
        id: 2,
        name: 'Dagoretti',
        pollingStations: ['Station D', 'Station E', 'Station F']
      }
    ]
  },
  {
    id: 2,
    name: 'Mombasa',
    divisions: [
      {
        id: 3,
        name: 'Mvita',
        pollingStations: ['Station G', 'Station H', 'Station I']
      }
    ]
  }
];

const LocationSelector: React.FC<LocationSelectorProps> = ({ onSelect, errors }) => {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedPollingStation, setSelectedPollingStation] = useState<string>('');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [pollingStations, setPollingStations] = useState<string[]>([]);

  useEffect(() => {
    if (selectedCounty) {
      const county = locationData.find(c => c.name === selectedCounty);
      setDivisions(county ? county.divisions : []);
      setSelectedDivision('');
      setSelectedPollingStation('');
    }
  }, [selectedCounty]);

  useEffect(() => {
    if (selectedDivision) {
      const division = divisions.find(d => d.name === selectedDivision);
      setPollingStations(division ? division.pollingStations : []);
      setSelectedPollingStation('');
    }
  }, [selectedDivision, divisions]);

  useEffect(() => {
    onSelect({
      county: selectedCounty,
      division: selectedDivision,
      pollingStation: selectedPollingStation
    });
  }, [selectedCounty, selectedDivision, selectedPollingStation, onSelect]);

  return (
    <div className="location-selector">
      <div className="form-group">
        <label htmlFor="county">County *</label>
        <select
          id="county"
          value={selectedCounty}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCounty(e.target.value)}
          className={errors.county ? 'error' : ''}
          required
        >
          <option value="">Select County</option>
          {locationData.map(county => (
            <option key={county.id} value={county.name}>
              {county.name}
            </option>
          ))}
        </select>
        {errors.county && <span className="error-message">{errors.county}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="division">Division *</label>
        <select
          id="division"
          value={selectedDivision}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDivision(e.target.value)}
          disabled={!selectedCounty}
          className={errors.division ? 'error' : ''}
          required
        >
          <option value="">Select Division</option>
          {divisions.map(division => (
            <option key={division.id} value={division.name}>
              {division.name}
            </option>
          ))}
        </select>
        {errors.division && <span className="error-message">{errors.division}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="pollingStation">Polling Station *</label>
        <select
          id="pollingStation"
          value={selectedPollingStation}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPollingStation(e.target.value)}
          disabled={!selectedDivision}
          className={errors.pollingStation ? 'error' : ''}
          required
        >
          <option value="">Select Polling Station</option>
          {pollingStations.map((station, index) => (
            <option key={index} value={station}>
              {station}
            </option>
          ))}
        </select>
        {errors.pollingStation && (
          <span className="error-message">{errors.pollingStation}</span>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;