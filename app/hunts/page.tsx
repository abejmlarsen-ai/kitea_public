import { createClient } from '@/lib/supabase/server'
import HuntsClient from './HuntsClient'

export default async function HuntsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: locations } = await supabase
    .from('hunt_locations')
    .select('id, name, description, latitude, longitude, total_scans')
    .eq('is_active', true)

  const { data: progressList } = user
    ? await supabase
        .from('hunt_progress')
        .select('hunt_location_id, current_question_index, location_revealed, completed_at')
        .eq('user_id', user.id)
    : { data: [] }

  return (
    <HuntsClient
      locations={locations ?? []}
      userId={user?.id ?? null}
      progressList={progressList ?? []}
    />
  )
}
