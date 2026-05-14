// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapRecurringDonationsPage() {
  return (
    <GapFeaturePage
      title="Recurring Donations"
      description="Recurring Donations"
      slug="recurring-donations"
      aiResultKey="subscription"
      fields={[
  {
    "name": "donorId",
    "label": "Donor ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "monthlyAmount",
    "label": "Monthly Amount",
    "type": "number"
  },
  {
    "name": "projectId",
    "label": "Project ID",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
