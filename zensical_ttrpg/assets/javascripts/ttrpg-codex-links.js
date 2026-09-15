// Glossary names become links to the codex page: each <abbr> in the page's
// text is wrapped in <a href="<codex>#<slug of the name>">, keeping the abbr
// and its title, so the tooltip still shows on hover. The codex page gives
// every name and alias an anchor with the same slug. The template loads this
// script only when extra.ttrpg.codex is set, and not on the codex page.
(function () {
  "use strict";

  var script = document.currentScript;
  var codex = script && script.dataset.codex;
  if (!codex) return;

  // Must match the slugs of the codex page's anchors, byte for byte.
  function slug(text) {
    return text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function link(root) {
    root.querySelectorAll(".md-typeset abbr").forEach(function (abbr) {
      // Names already in a link, and names in headings, stay as they are.
      if (abbr.closest("a, h1, h2, h3, h4, h5, h6")) return;
      var anchor = slug(abbr.textContent || "");
      if (!anchor) return;
      var a = document.createElement("a");
      a.className = "ttrpg-codex-link";
      a.href = codex + "#" + anchor;
      abbr.parentNode.insertBefore(a, abbr);
      a.appendChild(abbr);
    });
  }

  link(document);
})();
