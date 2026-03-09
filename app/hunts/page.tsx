import { redirect } from 'next/navigation'

// /hunts has no index page — redirect to the map view
export default function HuntsPage() {
  redirect('/map')
}
