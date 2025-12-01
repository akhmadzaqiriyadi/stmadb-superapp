// src/components/pkl/MapTilerPicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

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
          onLocationSelect(lngLat.lat, lngLat.lng);
          updateCircle(lngLat.lat, lngLat.lng);
        });
      });

      // Handle map click
      map.current.on('click', (e: any) => {
        const { lat, lng } = e.lngLat;
        marker.current.setLngLat([lng, lat]);
        onLocationSelect(lat, lng);
        updateCircle(lat, lng);
      });
    }

    return () => {
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

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainer} 
        className="w-full h-[400px] rounded-lg border overflow-hidden"
      />
      <p className="text-xs text-muted-foreground">
        💡 Klik pada peta atau drag marker untuk memilih lokasi. Lingkaran biru menunjukkan radius validasi GPS ({radius}m).
      </p>
    </div>
  );
}
