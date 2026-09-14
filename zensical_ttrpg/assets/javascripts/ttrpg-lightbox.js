// A link around an image that points to an image file (the map, for one)
// opens that file full screen over the page instead of in a new tab: the
// wheel, a pinch or the +/- buttons zoom, dragging pans, a double click
// toggles between fit and zoom, and Esc, the close button or a click on the
// dark border closes it. Without this script the link still opens the file.
(function () {
  "use strict";

  var IMAGE_FILE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
  var LABELS = {
    it: { dialog: "Immagine ingrandita", zoomOut: "Riduci", zoomIn: "Ingrandisci", close: "Chiudi" },
    en: { dialog: "Enlarged image", zoomOut: "Zoom out", zoomIn: "Zoom in", close: "Close" }
  };
  var label = LABELS[(document.documentElement.lang || "en").slice(0, 2)] || LABELS.en;
  var box, image, closeButton, returnFocus;
  var view = { scale: 1, min: 1, max: 4, x: 0, y: 0 };
  var pointers = new Map();
  var gesture = null;
  var pressedBorder = false;

  function build() {
    box = document.createElement("div");
    box.className = "ttrpg-lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", label.dialog);
    box.innerHTML =
      '<img class="ttrpg-lightbox__image" alt="" draggable="false">' +
      '<div class="ttrpg-lightbox__tools">' +
      '<button type="button" data-zoom="0.66" aria-label="' + label.zoomOut + '">−</button>' +
      '<button type="button" data-zoom="1.5" aria-label="' + label.zoomIn + '">+</button>' +
      '<button type="button" data-close aria-label="' + label.close + '">×</button>' +
      "</div>";
    document.body.appendChild(box);
    image = box.querySelector("img");
    closeButton = box.querySelector("[data-close]");

    box.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      if (button.hasAttribute("data-close")) close();
      else zoomAt(innerWidth / 2, innerHeight / 2, Number(button.dataset.zoom));
    });
    box.addEventListener("wheel", function (event) {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0015));
    }, { passive: false });
    box.addEventListener("dblclick", function (event) {
      if (event.target.closest("button")) return;
      if (view.scale > view.min * 1.05) fit();
      else zoomAt(event.clientX, event.clientY, 2.5);
    });
    box.addEventListener("pointerdown", pointerDown);
    box.addEventListener("pointermove", pointerMove);
    box.addEventListener("pointerup", pointerUp);
    box.addEventListener("pointercancel", pointerUp);
    window.addEventListener("resize", function () {
      if (!box.hidden) fit();
    });
  }

  function open(href, alt) {
    if (!box) build();
    returnFocus = document.activeElement;
    image.alt = alt || "";
    image.onload = fit;
    image.src = href;
    box.hidden = false;
    document.documentElement.classList.add("ttrpg-lightbox-open");
    if (image.complete && image.naturalWidth) fit();
    closeButton.focus();
  }

  function close() {
    box.hidden = true;
    pointers.clear();
    gesture = null;
    document.documentElement.classList.remove("ttrpg-lightbox-open");
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  // The whole image in view, centred; it can zoom to four times that, and
  // at least to its own size.
  function fit() {
    var width = image.naturalWidth, height = image.naturalHeight;
    if (!width) return;
    image.style.width = width + "px";
    image.style.height = height + "px";
    view.min = Math.min((innerWidth * 0.94) / width, (innerHeight * 0.9) / height, 1);
    view.max = Math.max(view.min * 4, 1);
    view.scale = view.min;
    view.x = (innerWidth - width * view.scale) / 2;
    view.y = (innerHeight - height * view.scale) / 2;
    render();
  }

  function zoomAt(px, py, factor) {
    var next = Math.min(view.max, Math.max(view.min, view.scale * factor));
    view.x = px - (px - view.x) * (next / view.scale);
    view.y = py - (py - view.y) * (next / view.scale);
    view.scale = next;
    render();
  }

  // Keep the image on screen: centred along an axis where it is smaller than
  // the window, and with no gap at the edges where it is larger.
  function clamp() {
    var width = image.naturalWidth * view.scale;
    var height = image.naturalHeight * view.scale;
    view.x = width <= innerWidth ? (innerWidth - width) / 2 : Math.min(0, Math.max(innerWidth - width, view.x));
    view.y = height <= innerHeight ? (innerHeight - height) / 2 : Math.min(0, Math.max(innerHeight - height, view.y));
  }

  function render() {
    clamp();
    image.style.transform = "translate(" + view.x + "px, " + view.y + "px) scale(" + view.scale + ")";
    box.classList.toggle("ttrpg-lightbox--zoomed", view.scale > view.min * 1.01);
  }

  function pointerDown(event) {
    if (event.target.closest("button")) return;
    if (pointers.size === 0) pressedBorder = event.target === box;
    box.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture = startGesture();
  }

  function pointerMove(event) {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    var now = startGesture();
    if (now.count === 2 && gesture.count === 2) {
      zoomAt(now.x, now.y, now.distance / gesture.distance);
    }
    if (now.count === gesture.count) {
      view.x += now.x - gesture.x;
      view.y += now.y - gesture.y;
      render();
    }
    if (Math.abs(now.x - gesture.startX) + Math.abs(now.y - gesture.startY) > 4) gesture.moved = true;
    now.moved = gesture.moved;
    now.startX = gesture.startX;
    now.startY = gesture.startY;
    gesture = now;
  }

  function pointerUp(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    var tapped = gesture && !gesture.moved && pointers.size === 0;
    if (tapped && event.type === "pointerup" && pressedBorder) close();
    gesture = pointers.size ? startGesture() : null;
  }

  // Where the pointers are: their midpoint and, for two, their distance.
  function startGesture() {
    var list = Array.from(pointers.values());
    var x = 0, y = 0;
    list.forEach(function (p) { x += p.x; y += p.y; });
    x /= list.length || 1;
    y /= list.length || 1;
    var distance = list.length === 2 ? Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y) : 0;
    return { count: list.length, x: x, y: y, distance: distance || 1, startX: x, startY: y, moved: false };
  }

  function keyDown(event) {
    if (event.key === "Escape") {
      close();
    } else if (event.key === "+" || event.key === "=") {
      zoomAt(innerWidth / 2, innerHeight / 2, 1.5);
    } else if (event.key === "-") {
      zoomAt(innerWidth / 2, innerHeight / 2, 0.66);
    } else if (event.key === "0") {
      fit();
    } else if (event.key === "Tab") {
      // Focus stays on the three buttons while the image is open.
      var buttons = Array.from(box.querySelectorAll("button"));
      var index = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  }

  // Keys work while the image is open, wherever the focus went after a drag.
  document.addEventListener("keydown", function (event) {
    if (box && !box.hidden) keyDown(event);
  });

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest(".md-typeset a[href]");
    if (!link || !IMAGE_FILE.test(link.pathname)) return;
    var picture = link.querySelector("img");
    if (!picture) return;
    event.preventDefault();
    open(link.href, picture.alt);
  });
})();
