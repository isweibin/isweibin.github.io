const dialog = document.querySelector(".image-lightbox");
const preview = dialog?.querySelector("img");

if (
  dialog instanceof HTMLDialogElement &&
  preview instanceof HTMLImageElement
) {
  let trigger = null;

  const open = (image) => {
    trigger = image;
    preview.src = image.currentSrc || image.src;
    preview.alt = image.alt;
    dialog.showModal();
  };

  // Linked images keep their navigation; inline images remain part of the text flow.
  for (const image of document.querySelectorAll("article img:not(.inline)")) {
    if (image.closest("a")) continue;

    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute(
      "aria-label",
      image.alt ? `Open image preview: ${image.alt}` : "Open image preview",
    );

    image.addEventListener("click", () => open(image));
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      open(image);
    });
  }

  dialog.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    preview.removeAttribute("src");
    trigger?.focus();
    trigger = null;
  });
}
