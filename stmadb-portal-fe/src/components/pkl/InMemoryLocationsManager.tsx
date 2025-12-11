// src/components/pkl/InMemoryLocationsManager.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MapTilerPicker from "./MapTilerPicker";

interface InMemoryLocationsManagerProps {
  locations: any[];
  onChange: (locations: any[]) => void;
  industryLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function InMemoryLocationsManager({
  locations,
  onChange,
  industryLocation,
}: InMemoryLocationsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    location_name: "",
    location_type: "Secondary",
    latitude: industryLocation?.latitude || -6.200000,
    longitude: industryLocation?.longitude || 106.816666,
    radius_meters: 100,
  });

  const handleAdd = () => {
    if (!newLocation.location_name.trim()) {
      toast.error("Nama lokasi harus diisi");
      return;
    }

    const locationToAdd = {
      ...newLocation,
      id: Date.now(), // Temporary ID for UI
      is_active: true,
    };

    onChange([...locations, locationToAdd]);
    toast.success("Lokasi ditambahkan");
    
    setIsOpen(false);
    setNewLocation({
      location_name: "",
      location_type: "Secondary",
      latitude: industryLocation?.latitude || -6.200000,
      longitude: industryLocation?.longitude || 106.816666,
      radius_meters: 100,
    });
  };

  const handleRemove = (id: number) => {
    onChange(locations.filter(loc => loc.id !== id));
    toast.success("Lokasi dihapus");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Lokasi Alternatif (Opsional)</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tambah Lokasi Alternatif</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Lokasi</Label>
                  <Input
                    id="name"
                    value={newLocation.location_name}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, location_name: e.target.value })
                    }
                    placeholder="Contoh: Rumah, Kos, Site B"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipe Lokasi</Label>
                  <Select
                    value={newLocation.location_type}
                    onValueChange={(value) =>
                      setNewLocation({ ...newLocation, location_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary">Primary (Utama)</SelectItem>
                      <SelectItem value="Secondary">Secondary (Alternatif)</SelectItem>
                      <SelectItem value="Temporary">Temporary (Sementara)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Pilih Titik Lokasi</Label>
                <MapTilerPicker
                  latitude={newLocation.latitude}
                  longitude={newLocation.longitude}
                  radius={newLocation.radius_meters}
                  onLocationSelect={(lat, lng) =>
                    setNewLocation({ ...newLocation, latitude: lat, longitude: lng })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAdd} disabled={!newLocation.location_name}>
                  Simpan Lokasi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Belum ada lokasi alternatif. Siswa hanya bisa tap in/out di lokasi industri utama.
          </p>
        ) : (
          locations.map((loc: any) => (
            <div
              key={loc.id}
              className="flex items-center justify-between p-3 border rounded-md bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{loc.location_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {loc.location_type} • Radius {loc.radius_meters}m
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemove(loc.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
