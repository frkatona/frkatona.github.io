document.addEventListener("DOMContentLoaded", () => {
  const heading = document.getElementById("shadow");
  const resumeIcon = document.getElementById("resume-icon");
  const pdfContainer = document.getElementById("pdf-container");
  const minimizeBtn = document.getElementById("minimize-btn");
  const projectGrid = document.getElementById("project-grid");
  const extraProjectCardsTemplate = document.getElementById("extra-project-cards");
  const projectFilterInput = document.querySelector("[data-project-filter]");
  const projectPagination = document.querySelector("[data-project-pagination]");
  const projectPageSelect = document.querySelector("[data-page-select]");
  const projectEmptyMessage = document.querySelector("[data-project-empty]");

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

  if (projectGrid) {
    const projectsPerPage = 6;
    const visibleProjectCards = Array.from(projectGrid.querySelectorAll(":scope > .card"));
    const extraProjectCards = extraProjectCardsTemplate
      ? Array.from(extraProjectCardsTemplate.content.querySelectorAll(".card"))
      : [];
    const projectCards = [...visibleProjectCards, ...extraProjectCards].map((card) => {
      const title = card.querySelector("h3")?.textContent.trim() || "";

      return {
        element: card.cloneNode(true),
        title,
        searchableTitle: title.toLowerCase(),
      };
    });
    let filteredProjectCards = projectCards;
    let currentProjectPage = 0;

    function renderProjectPagination(pageCount) {
      if (!projectPagination || !projectPageSelect) {
        return;
      }

      projectPagination.hidden = filteredProjectCards.length === 0;
      projectPageSelect.replaceChildren();

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const option = document.createElement("option");
        option.value = String(pageIndex);
        option.textContent = `${pageIndex + 1} of ${pageCount}`;
        option.selected = pageIndex === currentProjectPage;
        projectPageSelect.appendChild(option);
      }

      projectPageSelect.disabled = pageCount <= 1;

      projectPagination.querySelectorAll("[data-page-action]").forEach((button) => {
        const action = button.dataset.pageAction;
        const isFirstPage = currentProjectPage === 0;
        const isLastPage = currentProjectPage >= pageCount - 1;

        if (action === "previous") {
          button.disabled = isFirstPage;
        }

        if (action === "next") {
          button.disabled = isLastPage;
        }
      });
    }

    function createProjectPlaceholderCard() {
      const placeholder = document.createElement("div");
      placeholder.className = "card card-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      return placeholder;
    }

    function renderProjectPage({ preserveScrollPosition = false } = {}) {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const pageCount = Math.max(Math.ceil(filteredProjectCards.length / projectsPerPage), 1);
      currentProjectPage = Math.min(currentProjectPage, pageCount - 1);
      const startIndex = currentProjectPage * projectsPerPage;
      const pageCards = filteredProjectCards.slice(startIndex, startIndex + projectsPerPage);
      const fragment = document.createDocumentFragment();

      pageCards.forEach((project) => {
        fragment.appendChild(project.element.cloneNode(true));
      });

      if (pageCount > 1) {
        const placeholderCount = projectsPerPage - pageCards.length;

        for (let index = 0; index < placeholderCount; index += 1) {
          fragment.appendChild(createProjectPlaceholderCard());
        }
      }

      projectGrid.replaceChildren(fragment);

      if (projectEmptyMessage) {
        projectEmptyMessage.hidden = filteredProjectCards.length > 0;
      }

      renderProjectPagination(pageCount);

      if (preserveScrollPosition) {
        window.scrollTo(scrollX, scrollY);
        requestAnimationFrame(() => {
          window.scrollTo(scrollX, scrollY);
        });
      }
    }

    function applyProjectFilter() {
      const query = projectFilterInput?.value.trim().toLowerCase() || "";
      filteredProjectCards = query
        ? projectCards.filter((project) => project.searchableTitle.includes(query))
        : projectCards;
      currentProjectPage = 0;
      renderProjectPage();
    }

    if (projectFilterInput) {
      projectFilterInput.addEventListener("input", applyProjectFilter);
    }

    if (projectPageSelect) {
      projectPageSelect.addEventListener("change", () => {
        currentProjectPage = Number(projectPageSelect.value);
        renderProjectPage();
      });
    }

    if (projectPagination) {
      projectPagination.addEventListener("pointerdown", (event) => {
        if (event.target.closest("[data-page-action]")) {
          event.preventDefault();
        }
      });

      projectPagination.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page-action]");

        if (!button || button.disabled) {
          return;
        }

        const pageCount = Math.max(Math.ceil(filteredProjectCards.length / projectsPerPage), 1);
        button.blur();

        if (button.dataset.pageAction === "previous") {
          currentProjectPage -= 1;
        }

        if (button.dataset.pageAction === "next") {
          currentProjectPage += 1;
        }

        currentProjectPage = Math.max(0, Math.min(currentProjectPage, pageCount - 1));
        renderProjectPage({ preserveScrollPosition: true });
      });
    }

    renderProjectPage();
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
