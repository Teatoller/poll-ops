// src/components/LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import type { LocationData } from '../../types';
import { resourcesAPI } from '../../services/api';

interface LocationSelectorProps {
  onSelect?: (locationData: LocationData) => void;
  onLocationSelect?: (locationData: LocationData) => void;
  errors?: { [key: string]: string };
  disabled?: boolean;
  required?: boolean;
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
interface Ward {
  id: number;
  name: string;
  pollingStations: string[];
}

interface SubCounty {
  id: number;
  name: string;
  wards: Ward[];
}

interface County {
  id: number;
  name: string;
  subCounties: SubCounty[];
}


const LocationSelector: React.FC<LocationSelectorProps> = ({ onSelect, onLocationSelect, disabled }) => {
  const [tree, setTree] = useState<County[]>([]);
  const [county, setCounty] = useState<County | null>(null);
  const [subCounty, setSubCounty] = useState<SubCounty | null>(null);
  const [ward, setWard] = useState<Ward | null>(null);
  const [pollingStation, setPollingStation] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await resourcesAPI.getCountryTree();
        if (mounted) setTree(data as unknown as County[]);
      } catch (e) {
        console.error('Failed to load location tree', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handler = onLocationSelect || onSelect;
    if (!handler) return;

    handler({
      countyId: county?.id ?? null,
      countyName: county?.name ?? '',
      subCountyId: subCounty?.id ?? null,
      subCountyName: subCounty?.name ?? '',
      wardId: ward?.id ?? null,
      wardName: ward?.name ?? '',
      pollingStation
    });
  }, [county, subCounty, ward, pollingStation, onSelect, onLocationSelect]);

  return (
    <div className="location-selector">
      <div className="form-group">
        <label>County *</label>
        <select
          value={county?.id ?? ''}
          onChange={(e) => {
            const selected = tree.find(c => c.id === Number(e.target.value)) || null;
            setCounty(selected);
            setSubCounty(null);
            setWard(null);
            setPollingStation('');
          }}
          disabled={disabled}
        >
          <option value="">Select County</option>
          {tree.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Sub County *</label>
        <select
          value={subCounty?.id ?? ''}
          disabled={!county || disabled}
          onChange={(e) => {
            const selected = county?.subCounties.find(sc => sc.id === Number(e.target.value)) || null;
            setSubCounty(selected);
            setWard(null);
            setPollingStation('');
          }}
        >
          <option value="">Select Sub County</option>
          {county?.subCounties.map(sc => (
            <option key={sc.id} value={sc.id}>{sc.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Ward *</label>
        <select
          value={ward?.id ?? ''}
          disabled={!subCounty || disabled}
          onChange={(e) => {
            const selected = subCounty?.wards.find(w => w.id === Number(e.target.value)) || null;
            setWard(selected);
            setPollingStation('');
          }}
        >
          <option value="">Select Ward</option>
          {subCounty?.wards.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Polling Station *</label>
        <select
          value={pollingStation}
          disabled={!ward || disabled}
          onChange={(e) => setPollingStation(e.target.value)}
        >
          <option value="">Select Polling Station</option>
          {ward?.pollingStations.map(ps => (
            <option key={ps} value={ps}>{ps}</option>
          ))}
        </select>
      </div>

    </div>
  );
};

export default LocationSelector;