import { getAuthUser, getCurrentClientRecord } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateLevel } from "@/lib/types";
import {
  CLIENT_DATA_PAGE_SHELL,
  ClientStackPageHeader,
} from "@/components/client/client-app-page-parts";
import {
  UserProfileContent,
  type ClientMembershipSummary,
  type ClientPaymentHistoryItem,
} from "./user-profile-content";

export default async function ClientProfilePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [supabase, cachedClient] = await Promise.all([
    createClient(),
    getCurrentClientRecord(user.id),
  ]);

  const [{ data: profile }, { data: client }, paymentsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("clients")
      .select(
        "id, phone, birth_date, gender, status, membership_start, membership_end, current_plan_id, membership_plans(name, price, duration_days, description)",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    cachedClient?.id
      ? supabase
          .from("payments")
          .select(
            "id, amount, paid_at, period_start, period_end, payment_method, reference, membership_plans(name)",
          )
          .eq("client_id", cachedClient.id)
          .order("created_at", { ascending: false })
          .limit(24)
      : Promise.resolve({ data: null }),
  ]);

  const paymentHistory: ClientPaymentHistoryItem[] = (
    paymentsRes.data ?? []
  ).map((p) => {
    const planRel = (
      p as { membership_plans?: { name: string } | { name: string }[] | null }
    ).membership_plans;
    const planObj =
      planRel == null
        ? null
        : Array.isArray(planRel)
          ? (planRel[0] ?? null)
          : planRel;
    return {
      id: p.id,
      amount: p.amount,
      paid_at: p.paid_at,
      period_start: p.period_start,
      period_end: p.period_end,
      payment_method: p.payment_method,
      reference: p.reference,
      plan_name: planObj?.name ?? null,
    };
  });

  const clientPlanRel = (
    client as {
      membership_plans?:
        | { name: string; price: number; duration_days: number; description?: string | null }
        | { name: string; price: number; duration_days: number; description?: string | null }[]
        | null;
    } | null
  )?.membership_plans;

  const clientPlan =
    clientPlanRel == null
      ? null
      : Array.isArray(clientPlanRel)
        ? (clientPlanRel[0] ?? null)
        : clientPlanRel;

  const membershipInfo: ClientMembershipSummary | null = client
    ? {
        status: client.status ?? "active",
        membershipStart: client.membership_start ?? null,
        membershipEnd: client.membership_end ?? null,
        planName: clientPlan?.name ?? null,
        planPrice: clientPlan?.price ?? null,
        planDurationDays: clientPlan?.duration_days ?? null,
        planDescription: clientPlan?.description ?? null,
      }
    : null;

  const levelFromXp = calculateLevel(profile?.xp_points ?? 0).level;
  if (profile?.id != null && profile.level !== levelFromXp) {
    await supabase
      .from("profiles")
      .update({ level: levelFromXp })
      .eq("id", profile.id);
  }

  const mergedProfile = {
    ...(profile || {}),
    phone: profile?.phone || client?.phone || undefined,
    birth_date: profile?.birth_date || client?.birth_date || undefined,
    gender: profile?.gender || client?.gender || undefined,
    level: levelFromXp,
  };

  return (
    <>
      <ClientStackPageHeader
        title="Mi perfil"
        subtitle="Datos personales, membresía, pagos y preferencias de entreno."
      />
      <div className={CLIENT_DATA_PAGE_SHELL}>
        <UserProfileContent
          initialProfile={mergedProfile}
          userId={user.id}
          userEmail={user.email ?? ""}
          clientId={client?.id}
          membershipInfo={membershipInfo}
          paymentHistory={paymentHistory}
        />
      </div>
    </>
  );
}
