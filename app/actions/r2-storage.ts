"use server";

import { r2AwsClient, r2Endpoint, R2_BUCKET_NAME } from "@/lib/r2";
import { getAuthUser, getUserProfile } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";

async function assertR2PathAuthorized(path: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("No autorizado");

  const normalizedPath = path.trim().replace(/^\/+/, "");
  if (!normalizedPath || normalizedPath.includes("..")) {
    throw new Error("Ruta de archivo no válida");
  }

  const profile = await getUserProfile();
  if (profile?.role === "admin") {
    return normalizedPath;
  }

  if (normalizedPath.startsWith(`avatars/${user.id}/`)) {
    return normalizedPath;
  }

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    client?.id &&
    (normalizedPath.startsWith(`clients/${client.id}/`) ||
      normalizedPath.startsWith(`progress-photos/${client.id}/`) ||
      normalizedPath.startsWith(`progress/clients/${client.id}/`))
  ) {
    return normalizedPath;
  }

  throw new Error("No autorizado para acceder a esta ruta de almacenamiento");
}

/**
 * Genera una URL firmada para subir un archivo directamente desde el cliente a R2.
 * @param path El path dentro del bucket (ej: progress/clients/...)
 * @param contentType El tipo MIME del archivo (ej: image/jpeg)
 */
export async function getR2PresignedUrl(path: string, contentType: string) {
  const authorizedPath = await assertR2PathAuthorized(path);

  const url = new URL(`${r2Endpoint}/${R2_BUCKET_NAME}/${authorizedPath}`);

  const signed = await r2AwsClient.sign(url.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    aws: { signQuery: true },
  });

  return signed.url;
}

/**
 * Elimina un objeto de R2.
 * @param path El path dentro del bucket (ej: progress/clients/...)
 */
export async function deleteR2Object(path: string) {
  const authorizedPath = await assertR2PathAuthorized(path);

  const url = new URL(`${r2Endpoint}/${R2_BUCKET_NAME}/${authorizedPath}`);

  const res = await r2AwsClient.fetch(url.toString(), {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete object from R2");
  }
}
