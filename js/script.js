document.addEventListener("DOMContentLoaded", () => {
  const heading = document.getElementById("shadow");
  const resumeIcon = document.getElementById("resume-icon");
  const pdfContainer = document.getElementById("pdf-container");
  const minimizeBtn = document.getElementById("minimize-btn");

  if (heading) {
    const shadowMaxDistance = 400;
    const shadowMaxLength = 10;

    document.addEventListener("mousemove", (event) => {
      const rect = heading.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      const angle = Math.atan2(deltaY, deltaX);
      const shadowLength =
        Math.min(distance / shadowMaxDistance, 1) * shadowMaxLength;
      const shadowX = -Math.cos(angle) * shadowLength;
      const shadowY = -Math.sin(angle) * shadowLength;

      heading.style.textShadow = `${shadowX}px ${shadowY}px 3px rgba(0, 0, 0, 0.5)`;
    });
  }

  if (!resumeIcon || !pdfContainer || !minimizeBtn) {
    return;
  }

  const resumeIconInitialDisplay =
    window.getComputedStyle(resumeIcon).display || "block";
  const pdfSrc = pdfContainer.dataset.pdfSrc;
  let resumeLoaded = false;

  function ensureResumeEmbed() {
    if (resumeLoaded || !pdfSrc) {
      return;
    }

    const object = document.createElement("object");
    object.data = pdfSrc;
    object.type = "application/pdf";
    object.width = "100%";
    object.height = "100%";
    object.innerHTML = `
      <p>
        It appears you don't have a PDF plugin for this browser.
        Please <a href="${pdfSrc}">download the PDF file</a>.
      </p>
    `;

    pdfContainer.appendChild(object);
    resumeLoaded = true;
  }

  function showResume() {
    ensureResumeEmbed();
    pdfContainer.hidden = false;
    pdfContainer.setAttribute("aria-hidden", "false");
    minimizeBtn.hidden = false;
    resumeIcon.style.display = "none";
  }

  function hideResume() {
    pdfContainer.hidden = true;
    pdfContainer.setAttribute("aria-hidden", "true");
    minimizeBtn.hidden = true;
    resumeIcon.style.display = resumeIconInitialDisplay;
  }

  resumeIcon.addEventListener("click", showResume);
  minimizeBtn.addEventListener("click", hideResume);
});
