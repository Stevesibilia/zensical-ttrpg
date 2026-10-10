// The menu marks each campaign that has a binding (extra.ttrpg.bindings)
// with a small spine in its colour. A campaign's section is the deepest
// section of the menu that holds every page under the binding's folder and
// no other, as for the shelf on the home page. The template passes the
// bindings (folder: light colour) and the site's root.
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;
  var bindings;
  try {
    bindings = JSON.parse(script.dataset.bindings || "{}");
  } catch (error) {
    return;
  }
  var root = new URL(script.dataset.root || ".", document.baseURI).pathname;
  if (!root.endsWith("/")) root += "/";

  // A link's path from the site's root, with a trailing slash: "kulthos/sabaoth/sessione1/".
  function path(a) {
    var url = new URL(a.getAttribute("href"), document.baseURI);
    if (url.origin !== location.origin || !url.pathname.startsWith(root)) return null;
    var rest = url.pathname.slice(root.length).replace(/index\.html$/, "");
    return rest.endsWith("/") ? rest : rest + "/";
  }

  function pages(element) {
    var found = new Set();
    element.querySelectorAll("a.md-nav__link[href]").forEach(function (a) {
      var p = path(a);
      if (p) found.add(p);
    });
    return Array.from(found);
  }

  function mark(nav) {
    var all = pages(nav);
    var sections = Array.from(nav.querySelectorAll("li.md-nav__item--nested"));
    Object.keys(bindings).forEach(function (key) {
      var prefix = key.replace(/^\/+|\/+$/g, "") + "/";
      var total = all.filter(function (p) { return p.startsWith(prefix); }).length;
      if (!total) return;
      var best = null;
      var bestDepth = -1;
      sections.forEach(function (li) {
        var mine = pages(li);
        if (mine.length !== total) return;
        if (!mine.every(function (p) { return p.startsWith(prefix); })) return;
        var depth = 0;
        for (var up = li.parentElement; up && up !== nav; up = up.parentElement) {
          if (up.matches("li.md-nav__item--nested")) depth++;
        }
        if (depth > bestDepth) {
          best = li;
          bestDepth = depth;
        }
      });
      if (best) {
        best.classList.add("ttrpg-nav-book");
        best.style.setProperty("--ttrpg-book", bindings[key]);
      }
    });
  }

  document.querySelectorAll(".md-sidebar--primary .md-nav--primary").forEach(mark);
})();
