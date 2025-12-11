// src/components/pkl/MapTilerPicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface MapTilerPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  radius?: number;
}

export default function MapTilerPicker({
  latitude,
  longitude,
  onLocationSelect,
  radius = 100,
}: MapTilerPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const circle = useRef<any>(null);
  const [apiKey] = useState('hKTeoszJlWlB3Q6YQuq1');
  
  // Manual input state
  const [manualLat, setManualLat] = useState(latitude.toString());
  const [manualLng, setManualLng] = useState(longitude.toString());

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    maptilersdk.config.apiKey = apiKey;

    if (mapContainer.current) {
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: maptilersdk.MapStyle.STREETS,
        center: [longitude, latitude],
        zoom: 13,
      });

      // Wait for map to load before adding marker and circle
      map.current.on('load', () => {
        // Add marker
        marker.current = new maptilersdk.Marker({ draggable: true, color: '#3b82f6' })
          .setLngLat([longitude, latitude])
          .addTo(map.current);

        // Add circle for radius
        updateCircle(latitude, longitude);

        // Handle marker drag
        marker.current.on('dragend', () => {
          const lngLat = marker.current.getLngLat();
          setManualLat(lngLat.lat.toFixed(6));
          setManualLng(lngLat.lng.toFixed(6));
          onLocationSelect(lngLat.lat, lngLat.lng);
          updateCircle(lngLat.lat, lngLat.lng);
        });
      });

      // Handle map click
      map.current.on('click', (e: any) => {
        const { lat, lng } = e.lngLat;
        marker.current.setLngLat([lng, lat]);
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
        onLocationSelect(lat, lng);
        updateCircle(lat, lng);
      });
    }

    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Update marker when lat/lng props change
    if (marker.current && map.current) {
      marker.current.setLngLat([longitude, latitude]);
      map.current.setCenter([longitude, latitude]);
      updateCircle(latitude, longitude);
    }
    // Sync manual input fields
    setManualLat(latitude.toFixed(6));
    setManualLng(longitude.toFixed(6));
  }, [latitude, longitude]);

  const updateCircle = (lat: number, lng: number) => {
    if (!map.current) return;

    if (circle.current) {
      map.current.removeLayer('radius-circle');
      map.current.removeSource('radius-circle');
    }

    // Create circle GeoJSON
    const steps = 64;
    const km = radius / 1000;
    const ret: number[][] = [];
    const distanceX = km / (111.320 * Math.cos((lat * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([lng + x, lat + y]);
    }
    ret.push(ret[0]);

    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [ret],
        },
        properties: {},
      },
    });

    map.current.addLayer({
      id: 'radius-circle',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2,
      },
    });

    circle.current = true;
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }
    
    if (marker.current && map.current) {
      marker.current.setLngLat([lng, lat]);
      map.current.setCenter([lng, lat]);
      updateCircle(lat, lng);
      onLocationSelect(lat, lng);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        ref={mapContainer} 
        className="w-full h-[400px] rounded-lg border overflow-hidden"
      />
      <p className="text-xs text-muted-foreground">
        💡 Klik pada peta atau drag marker untuk memilih lokasi. Lingkaran biru menunjukkan radius validasi GPS ({radius}m).
      </p>
      
      {/* Manual Coordinate Input */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Input Koordinat Manual (Opsional)
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="manual-lat" className="text-xs text-muted-foreground">
              Latitude
            </Label>
            <Input
              id="manual-lat"
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="-6.200000"
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="manual-lng" className="text-xs text-muted-foreground">
              Longitude
            </Label>
            <Input
              id="manual-lng"
              type="number"
              step="0.000001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="106.816666"
              className="text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleManualUpdate}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Set Lokasi
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Masukkan koordinat GPS jika Anda tahu lokasi pastinya. Format: Latitude (-90 s/d 90), Longitude (-180 s/d 180)
        </p>
      </div>
    </div>
  );
}
