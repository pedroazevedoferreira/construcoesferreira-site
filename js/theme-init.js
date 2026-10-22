(function () {
  // Apply a saved theme before the first paint. Without storage the system
  // preference is used.
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (error) {
    // localStorage indisponivel (modo privado etc): segue a preferencia do sistema.
  }
})();
