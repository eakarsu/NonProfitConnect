// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapTaxReceiptGenerationPage() {
  return (
    <GapFeaturePage
      title="Tax Receipt / 1099 Generation"
      description="Tax Receipt / 1099 Generation"
      slug="tax-receipt-generation"
      aiResultKey="receipt"
      fields={[
  {
    "name": "donorId",
    "label": "Donor ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "totalDonated",
    "label": "Total Donated",
    "type": "number"
  },
  {
    "name": "taxYear",
    "label": "Tax Year",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
