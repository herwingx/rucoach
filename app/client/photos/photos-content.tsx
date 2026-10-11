"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoUpload } from "@/components/photos/photo-upload";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { PhotoCompare } from "@/components/photos/photo-compare";
import type { ProgressPhoto } from "@/components/photos/photo-card";
import { LayoutGrid, Diff, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { deleteR2Object } from "@/app/actions/r2-storage";
import { R2_PUBLIC_URL } from "@/lib/constants";

export function PhotosContent({
  clientId,
  initialPhotos,
}: {
  clientId: string;
  initialPhotos: ProgressPhoto[];
}) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(initialPhotos);
  const [activeTab, setActiveTab] = useState("gallery");

  const onUploadSuccess = useCallback((newPhoto: ProgressPhoto) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    setActiveTab("gallery");
    toast.success("¡Foto guardada!", {
      description: "Tu progreso ha sido actualizado correctamente.",
    });
  }, []);

  const onDeleteSuccess = useCallback(
    async (deletedId: string) => {
      try {
        const photoToDelete = photos.find((p) => p.id === deletedId);
        const supabase = createClient();
        const { error } = await supabase
          .from("progress_photos")
          .delete()
          .eq("id", deletedId);

        if (error) throw error;

        if (photoToDelete?.photo_url) {
          try {
            const urlStr = photoToDelete.photo_url;
            let key: string | null = null;
            if (urlStr.startsWith(R2_PUBLIC_URL)) {
              key = urlStr.slice(R2_PUBLIC_URL.length).replace(/^\/+/, "");
            } else if (urlStr.includes(".r2.dev/")) {
              key = new URL(urlStr).pathname.replace(/^\/+/, "");
            }
            if (key) {
              await deleteR2Object(key);
            }
          } catch (r2Err) {
            console.warn("[PhotosContent] R2 delete warning:", r2Err);
          }
        }

        setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
        toast.success("Foto eliminada");
      } catch {
        toast.error("No se pudo eliminar la foto de la base de datos.");
      }
    },
    [photos],
  );

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="no-scrollbar mb-6 flex h-auto w-full items-center justify-start overflow-x-auto rounded-2xl border border-border/40 bg-muted/50 p-1 shadow-sm sm:w-fit">
          <TabsTrigger
            value="gallery"
            className="shrink-0 gap-2 rounded-xl px-4 py-2 data-[state=active]:shadow-md"
          >
            <LayoutGrid className="size-4" />
            <span className="inline">Galería</span>
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="shrink-0 gap-2 rounded-xl px-4 py-2 data-[state=active]:shadow-md"
          >
            <Diff className="size-4" />
            <span className="inline">Comparar</span>
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="shrink-0 gap-2 rounded-xl px-4 py-2 data-[state=active]:shadow-md"
          >
            <UploadCloud className="size-4" />
            <span className="inline">Subir</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="focus-visible:outline-none">
          <PhotoGallery photos={photos} onDeleteSuccess={onDeleteSuccess} />
        </TabsContent>

        <TabsContent value="compare" className="focus-visible:outline-none">
          <PhotoCompare photos={photos} />
        </TabsContent>

        <TabsContent value="upload" className="focus-visible:outline-none">
          <PhotoUpload clientId={clientId} onSuccess={onUploadSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
