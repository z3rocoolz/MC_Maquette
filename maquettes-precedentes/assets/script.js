/* Progressive enhancement : le contenu et les liens fonctionnent sans JavaScript. */
"use strict";
(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#navigation");
  const mobile = window.matchMedia("(max-width: 1020px)");
  if (menuButton && navigation) {
    const setMenu = (open) => {
      menuButton.setAttribute("aria-expanded", String(open));
      navigation.dataset.collapsed = String(mobile.matches && !open);
    };
    const syncMenu = () => {
      menuButton.hidden = !mobile.matches;
      setMenu(false);
    };
    menuButton.addEventListener("click", () =>
      setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
    );
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a") && mobile.matches) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuButton.getAttribute("aria-expanded") === "true"
      ) {
        setMenu(false);
        menuButton.focus();
      }
    });
    mobile.addEventListener("change", syncMenu);
    syncMenu();
  }
  const dialog = document.querySelector("#guide-dialog");
  const guide = document.querySelector("#preparer");
  if (dialog && typeof dialog.showModal === "function") {
    if (guide && location.hash !== "#preparer") guide.hidden = true;
    let opener;
    document.querySelectorAll("[data-open-guide]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        opener = link;
        dialog.showModal();
        dialog.querySelector(".close-dialog").focus();
      });
    });
    dialog
      .querySelectorAll(".close-dialog, .dialog-done")
      .forEach((button) =>
        button.addEventListener("click", () => dialog.close()),
      );
    dialog.addEventListener("close", () => {
      if (opener) opener.focus();
    });
    // Le dialogue natif rend le fond inerte. Cette boucle garde Tab dans ses deux boutons.
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const first = dialog.querySelector(".close-dialog");
      const last = dialog.querySelector(".dialog-done");
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    // La touche Échap est gérée par le dialogue natif.
    window.addEventListener("hashchange", () => {
      if (location.hash === "#preparer" && guide) {
        guide.hidden = false;
        guide.scrollIntoView();
      }
    });
  }
})();
