function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeLine(line) {
  return line
    .replace(/^#{1,4}\s*/, "")
    .replace(/^\*\*(.+)\*\*$/, "$1")
    .trim();
}

function isSectionHeading(line) {
  return /^#{2}\s+/.test(line) || /^\*\*[A-Z0-9 /&():-]+\*\*$/.test(line);
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function flushList(items) {
  if (!items.length) return "";

  return `<ul class="feedback-list">${items
    .map((item) => `<li>${formatInline(item)}</li>`)
    .join("")}</ul>`;
}

export function formatResumeFeedback(text) {
  if (!text) return "";

  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let html = "";
  let listItems = [];
  let sectionIndex = 0;

  lines.forEach((line) => {
    if (isSectionHeading(line)) {
      html += flushList(listItems);
      listItems = [];

      if (sectionIndex > 0) {
        html += "</div></section>";
      }

      const title = normalizeLine(line);
      const number = String(sectionIndex + 1).padStart(2, "0");

      html += `<section class="feedback-section-modern">
        <div class="feedback-section-number">${number}</div>
        <div class="feedback-section-body">
          <h3>${formatInline(title)}</h3>`;

      sectionIndex += 1;
      return;
    }

    if (/^[-*•]\s+/.test(line)) {
      listItems.push(line.replace(/^[-*•]\s+/, "").trim());
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s+/, "").trim());
      return;
    }

    html += flushList(listItems);
    listItems = [];

    if (!html.includes('class="feedback-section-modern"')) {
      html += `<section class="feedback-section-modern">
        <div class="feedback-section-number">01</div>
        <div class="feedback-section-body">`;
      sectionIndex = 1;
    }

    html += `<p>${formatInline(line)}</p>`;
  });

  html += flushList(listItems);

  if (sectionIndex > 0) {
    html += "</div></section>";
  }

  return html;
}
