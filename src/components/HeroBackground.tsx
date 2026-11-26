import { useEffect, useRef, useState } from "react";

interface DataConnection extends EventTarget {
  saveData?: boolean;
}
const poster = "/branding/hero-graduation-poster.webp";

export function HeroBackground() {
  const [allowed, setAllowed] = useState(false);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const data = window.matchMedia("(prefers-reduced-data: reduce)");
    const connection = (
      navigator as Navigator & { connection?: DataConnection }
    ).connection;
    const update = () =>
      setAllowed(!motion.matches && !data.matches && !connection?.saveData);
    update();
    motion.addEventListener("change", update);
    data.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      data.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    // The background stays visible while scrolling; pause in a hidden tab.
    const update = () => {
      if (!document.hidden) void element.play().catch(() => {});
      else element.pause();
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      element.pause();
    };
  }, [allowed, failed]);

  return (
    <div className="hero-media" aria-hidden="true">
      <img src={poster} alt="" fetchPriority="high" width="1280" height="720" />
      {allowed && !failed && (
        <video
          ref={video}
          src="/branding/hero-graduation.mp4"
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          tabIndex={-1}
          width="1280"
          height="720"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
