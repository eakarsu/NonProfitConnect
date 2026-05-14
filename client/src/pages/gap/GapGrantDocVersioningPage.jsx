// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapGrantDocVersioningPage() {
  return (
    <GapFeaturePage
      title="Grant Document Versioning"
      description="Grant Document Versioning"
      slug="grant-doc-versioning"
      aiResultKey="document"
      fields={[
  {
    "name": "grantId",
    "label": "Grant ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "version",
    "label": "Version",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "content",
    "label": "Content",
    "type": "textarea",
    "rows": 4,
    "required": false
  }
]}
    />
  )
}
