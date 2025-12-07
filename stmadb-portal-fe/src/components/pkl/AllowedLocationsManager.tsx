"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, MapPin } from "lucide-react";
import { assignmentsApi } from "@/lib/api/pkl";
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

interface AllowedLocationsManagerProps {
  assignmentId: number;
  industryLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function AllowedLocationsManager({
  assignmentId,
  industryLocation,
}: AllowedLocationsManagerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    location_name: "",
    location_type: "Secondary", // Default to Secondary (e.g. Home)
    latitude: industryLocation?.latitude || -6.200000,
    longitude: industryLocation?.longitude || 106.816666,
    radius_meters: 100,
  });

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["allowed-locations", assignmentId],
    queryFn: async () => {
      const response = await assignmentsApi.getLocations(assignmentId);
      return response.data;
    },
  });

  const { mutate: addLocation, isPending: isAdding } = useMutation({
    mutationFn: async () => {
      return assignmentsApi.addLocation(assignmentId, newLocation);
    },
    onSuccess: () => {
      toast.success("Lokasi berhasil ditambahkan");
      setIsOpen(false);
      setNewLocation({
        location_name: "",
        location_type: "Secondary",
        latitude: industryLocation?.latitude || -6.200000,
        longitude: industryLocation?.longitude || 106.816666,
        radius_meters: 100,
      });
      queryClient.invalidateQueries({ queryKey: ["allowed-locations", assignmentId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menambahkan lokasi");
    },
  });

  const { mutate: removeLocation, isPending: isRemoving } = useMutation({
    mutationFn: async (locationId: number) => {
      return assignmentsApi.removeLocation(assignmentId, locationId);
    },
    onSuccess: () => {
      toast.success("Lokasi berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["allowed-locations", assignmentId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus lokasi");
    },
  });

  const locations = locationsData || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Daftar Lokasi Diizinkan</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tambah Lokasi Baru</DialogTitle>
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
                <Button onClick={() => addLocation()} disabled={isAdding || !newLocation.location_name}>
                  {isAdding ? "Menyimpan..." : "Simpan Lokasi"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat lokasi...</p>
        ) : locations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Belum ada lokasi tambahan. Hanya lokasi industri yang digunakan (jika Onsite/Hybrid).
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
                onClick={() => removeLocation(loc.id)}
                disabled={isRemoving}
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
