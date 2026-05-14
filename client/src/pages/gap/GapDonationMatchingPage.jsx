// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapDonationMatchingPage() {
  return (
    <GapFeaturePage
      title="Donation Matching AI"
      description="Donation Matching AI"
      slug="donation-matching"
      aiResultKey="recommendation"
      fields={[
  {
    "name": "donorProfile",
    "label": "Donor Profile",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "availableProjects",
    "label": "Available Projects",
    "type": "array"
  }
]}
    />
  )
}
