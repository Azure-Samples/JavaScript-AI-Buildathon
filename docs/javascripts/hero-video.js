(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setButtonState = (video, button) => {
    const label = button.querySelector("[data-hero-toggle-label]");
    const paused = video.paused;
    button.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
    if (label) {
      label.textContent = paused ? "Play animation" : "Pause animation";
    }
  };

  const setupHeroVideo = () => {
    document.querySelectorAll("[data-hero-video]").forEach((video) => {
      const container = video.closest(".hero-media");
      const button = container?.querySelector("[data-hero-toggle]");

      if (!button || button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      if (reduceMotion.matches) {
        video.pause();
      }

      button.addEventListener("click", () => {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
        setButtonState(video, button);
      });

      video.addEventListener("play", () => setButtonState(video, button));
      video.addEventListener("pause", () => setButtonState(video, button));
      setButtonState(video, button);
    });
  };

  if (typeof document$ !== "undefined") {
    document$.subscribe(setupHeroVideo);
  } else {
    document.addEventListener("DOMContentLoaded", setupHeroVideo);
  }
})();
