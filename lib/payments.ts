import { createClient } from '@/lib/supabase/server'

export async function getPayments() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      clients (full_name, email),
      membership_plans:plan_id (name, price)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }

  return data || []
}

export async function getPaymentsByClient(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }

  return data || []
}

export async function getMembershipPlans() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching plans:', error)
    return []
  }

  return data || []
}

export async function getTotalRevenue() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .not('paid_at', 'is', null)

  if (error) {
    console.error('Error calculating revenue:', error)
    return 0
  }

  return data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
}

export async function getPendingPayments() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .is('paid_at', null)

  if (error) {
    console.error('Error fetching pending payments:', error)
    return []
  }

  return data || []
}
