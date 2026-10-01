// The portrait styles that follow the picture's shape (extra.ttrpg.portrait):
// a print gets data-shape="tall" for a tall or square picture, which makes it
// narrower, and with `auto` a wide picture turns from the print the template
// renders into the cover across the page. Without this script every portrait
// stays a print. The template loads it only on a page with a portrait, for
// `auto` and `print`.
(function () {
  "use strict";

  // Wider than this, width over height, a picture is wide.
  var WIDE = 1.2;

  function shape(figure) {
    var img = figure.querySelector("img");
    if (!img) return;

    function apply() {
      if (!img.naturalWidth || !img.naturalHeight) return;
      var wide = img.naturalWidth / img.naturalHeight > WIDE;
      figure.dataset.shape = wide ? "wide" : "tall";
      if (figure.dataset.portrait === "auto") {
        figure.classList.toggle("ttrpg-figure--cover", wide);
        figure.classList.toggle("ttrpg-figure--print", !wide);
      }
    }

    if (img.complete) apply();
    else img.addEventListener("load", apply);
  }

  document.querySelectorAll(".ttrpg-figure[data-portrait]").forEach(shape);
})();
