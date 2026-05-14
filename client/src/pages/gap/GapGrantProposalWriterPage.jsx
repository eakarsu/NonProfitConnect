// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapGrantProposalWriterPage() {
  return (
    <GapFeaturePage
      title="Grant Proposal Writer"
      description="Grant Proposal Writer"
      slug="grant-proposal-writer"
      aiResultKey="proposal"
      fields={[
  {
    "name": "grantTitle",
    "label": "Grant Title",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "projectDescription",
    "label": "Project Description",
    "type": "textarea",
    "rows": 4,
    "required": true
  }
]}
    />
  )
}
