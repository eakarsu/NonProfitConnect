export async function downloadCSV(url: string, filename: string) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Export failed");
  }
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportProjectToPDF(project: any) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Project Report", 14, 22);

  doc.setFontSize(14);
  doc.text(project.title, 14, 35);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Status: ${project.status} | Priority: ${project.priority}`, 14, 43);
  doc.text(`Category: ${project.category}`, 14, 50);
  doc.text(`Requested Amount: $${Number(project.requestedAmount).toLocaleString()}`, 14, 57);
  doc.text(`Timeline: ${project.timeline}`, 14, 64);
  doc.text(`Submitted: ${project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : "N/A"}`, 14, 71);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Description", 14, 85);

  doc.setFontSize(10);
  const splitDescription = doc.splitTextToSize(project.description || "", 180);
  doc.text(splitDescription, 14, 93);

  if (project.fundingStatus) {
    const y = 93 + splitDescription.length * 5 + 15;
    doc.setFontSize(12);
    doc.text("Funding Status", 14, y);
    doc.setFontSize(10);
    doc.text(`Goal: $${project.fundingStatus.goal?.toLocaleString() || 0}`, 14, y + 8);
    doc.text(`Raised: $${project.fundingStatus.total?.toLocaleString() || 0}`, 14, y + 15);
    const pct = project.fundingStatus.goal
      ? Math.round((project.fundingStatus.total / project.fundingStatus.goal) * 100)
      : 0;
    doc.text(`Progress: ${pct}%`, 14, y + 22);
  }

  doc.save(`project-${project.id}-report.pdf`);
}
