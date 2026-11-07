import { useEffect, useState } from "react";

// Width of the app's own left sidebar, so the chat sits next to it
export default function useAppSidebarWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = document.querySelector("div.fixed.left-0.top-0.bg-black");

    const update = () => {
      if (window.innerWidth < 768) return setWidth(0);
      setWidth(el ? el.getBoundingClientRect().width : window.innerWidth * 0.2);
    };

    update();
    const ro =
      typeof ResizeObserver !== "undefined" && el
        ? new ResizeObserver(update)
        : null;
    if (el) ro?.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return width;
}
