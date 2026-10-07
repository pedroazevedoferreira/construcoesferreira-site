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

  // Revelacao ao rolar: so prepara quando main.js pode assumir. Se ele nao
  // carregar em 2,5s, o conteudo volta a ficar visivel.
  var root = document.documentElement;
  if (
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    root.classList.add("reveal-ready");
    setTimeout(function () {
      if (!root.classList.contains("reveal-live"))
        root.classList.remove("reveal-ready");
    }, 2500);
  }
})();
