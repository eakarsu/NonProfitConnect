// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapContentModerationPage() {
  return (
    <GapFeaturePage
      title="Content Moderation"
      description="Content Moderation"
      slug="content-moderation"
      aiResultKey="moderation"
      fields={[
  {
    "name": "content",
    "label": "Content to Moderate",
    "type": "textarea",
    "rows": 4,
    "required": true
  }
]}
    />
  )
}
