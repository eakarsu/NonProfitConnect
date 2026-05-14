// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapDonorSegmentationPage() {
  return (
    <GapFeaturePage
      title="Donor Segmentation"
      description="Donor Segmentation"
      slug="donor-segmentation"
      aiResultKey="segments"
      fields={[
  {
    "name": "donorData",
    "label": "Donor Data (JSON array)",
    "type": "json"
  }
]}
    />
  )
}
