// Navigation helpers (placeholder)
function showSection(id) {
  const sections = document.querySelectorAll("[data-section]");
  sections.forEach(s => s.style.display = "none");
  const target = document.querySelector(`[data-section="${id}"]`);
  if (target) target.style.display = "block";
}
