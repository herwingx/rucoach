import { getAuthUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CLIENT_DATA_PAGE_SHELL,
  ClientStackPageHeader,
} from "@/components/client/client-app-page-parts";
import { PhotosContent } from "./photos-content";

export default async function ClientPhotosPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const { data: clientRecord } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientRecord) redirect("/client/dashboard");

  const [{ data: photos }, { data: latestMeasurement }] = await Promise.all([
    supabase
      .from("progress_photos")
      .select("id, photo_url, view_type, weight_kg, notes, taken_at, created_at")
      .eq("client_id", clientRecord.id)
      .order("taken_at", { ascending: false }),
    supabase
      .from("body_measurements")
      .select("weight")
      .eq("client_id", clientRecord.id)
      .not("weight", "is", null)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const photoList = photos || [];
  const latestWeightKg =
    latestMeasurement?.weight != null ? Number(latestMeasurement.weight) : null;
  const n = photoList.length;
  const photosSubtitle =
    n === 0
      ? "Registra tu punto de partida con tus perfiles de Frente, Perfil y Espalda."
      : `${n} ${n === 1 ? "foto registrada" : "fotos registradas"} · seguimiento visual y comparador Antes / Después`;

  return (
    <>
      <ClientStackPageHeader title="Fotos" subtitle={photosSubtitle} />
      <div className={CLIENT_DATA_PAGE_SHELL}>
        <PhotosContent
          clientId={clientRecord.id as string}
          initialPhotos={photoList}
          latestWeightKg={
            latestWeightKg != null && Number.isFinite(latestWeightKg)
              ? latestWeightKg
              : null
          }
        />
      </div>
    </>
  );
}
