import { getAuthUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_MESSAGES_INBOX_CAP } from "@/lib/performance-limits";
import { ChatViewLazy } from "@/components/chat/chat-view-lazy";

type CoachClientRow = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  avatar_url?: string | null;
};

type MessageRow = {
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  is_read: boolean | null;
};

type AdminConversationItem = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  lastMessage?: string;
  lastAt?: string;
  unread: number;
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ clientId?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const sp = searchParams ? await searchParams : undefined;
  const requestedClientId = sp?.clientId?.trim() || null;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "client";

  if (role !== "admin") {
    redirect("/client/dashboard");
  }

  const { data: myClients } = await supabase
    .from("clients")
    .select("id, user_id, full_name, avatar_url")
    .or(`coach_id.eq.${user.id},coach_id.is.null`);

  const clients: CoachClientRow[] = myClients ?? [];

  const matchedClient = requestedClientId
    ? clients.find(
        (c) => c.user_id === requestedClientId || c.id === requestedClientId,
      )
    : null;
  const initialSelectedUserId =
    matchedClient?.user_id ?? requestedClientId ?? null;

  const userIds = clients
    .map((c) => c.user_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  let conversations: AdminConversationItem[] = [];

  if (userIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("from_user_id, to_user_id, content, created_at, is_read")
      .or(
        `from_user_id.in.(${userIds.join(",")}),to_user_id.in.(${userIds.join(",")})`,
      )
      .order("created_at", { ascending: false })
      .limit(ADMIN_MESSAGES_INBOX_CAP);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const lastByPeer = new Map<
      string,
      { content: string; at: string; unread: number }
    >();

    const unreadByPeer = new Map<string, number>();
    for (const m of (msgs ?? []) as MessageRow[]) {
      const peerId = m.from_user_id === user.id ? m.to_user_id : m.from_user_id;
      if (!lastByPeer.has(peerId)) {
        lastByPeer.set(peerId, {
          content: m.content,
          at: m.created_at,
          unread: 0,
        });
      }
      if (m.to_user_id === user.id && !m.is_read) {
        unreadByPeer.set(peerId, (unreadByPeer.get(peerId) || 0) + 1);
      }
    }
    for (const [pid, last] of lastByPeer) {
      last.unread = unreadByPeer.get(pid) || 0;
    }

    conversations = clients
      .filter((c): c is CoachClientRow & { user_id: string } =>
        Boolean(c.user_id),
      )
      .map((c) => {
        const p = profileMap.get(c.user_id);
        const last = lastByPeer.get(c.user_id);
        return {
          id: c.user_id,
          name: c.full_name || p?.full_name || "Cliente",
          avatarUrl: p?.avatar_url || c.avatar_url,
          lastMessage: last?.content,
          lastAt: last?.at,
          unread: last?.unread ?? 0,
        };
      })
      .sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-1 flex-col bg-background">
      <ChatViewLazy
        currentUserId={user.id}
        role={role}
        otherUser={null}
        conversations={conversations}
        initialSelectedUserId={initialSelectedUserId}
      />
    </div>
  );
}
