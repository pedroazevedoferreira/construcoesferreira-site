(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (error) {
    // localStorage indisponivel (modo privado etc): segue a preferencia do sistema.
  }

  try {
    var path = window.location.pathname.replace(/\/+$/, "");
    var isHome = path === "" || /\/index\.html$/i.test(path);
    var reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (
      isHome &&
      !reduceMotion &&
      !sessionStorage.getItem("ferreira-home-intro-v3")
    ) {
      document.documentElement.classList.add("home-intro");
      sessionStorage.setItem("ferreira-home-intro-v3", "seen");
    }
  } catch (error) {
    // sessionStorage indisponivel: a pagina continua visivel, sem depender da animacao.
  }
})();
