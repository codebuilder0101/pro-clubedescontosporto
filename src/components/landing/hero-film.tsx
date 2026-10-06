"use client";

import { useEffect, useRef } from "react";

const COLS = ["#D9653B", "#FFC531", "#F6F2EA", "#E58FA0", "#5E8FD8", "#F2A65A", "#FFFFFF", "#8FC7A0", "#E8C07A"];

type House = { x: number; w: number; h: number; c: string; win: { on: boolean; ph: number }[] };
type Boat = { x: number; s: number; y: number };
type Gull = { x: number; y: number; s: number; p: number };

/**
 * Animated Ribeira at sunset (ported from the prototype's canvas "film").
 * Paints over the static SVG fallback rendered by the server. Pauses when
 * off-screen or the tab is hidden; draws a single still frame when the user
 * prefers reduced motion. Movement is time-based, so speed is independent of
 * the display's refresh rate.
 */
export function HeroFilm() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let houses: House[] = [];
    let boats: Boat[] = [];
    let gulls: Gull[] = [];

    const build = () => {
      houses = [];
      let x = -10;
      let i = 0;
      while (x < W * 0.58) {
        const w = W * (0.075 + ((i * 37) % 5) * 0.014);
        const h = H * (0.15 + ((i * 53) % 7) * 0.026);
        houses.push({
          x,
          w,
          h,
          c: COLS[i % COLS.length],
          win: Array.from({ length: 12 }, (_, k) => ({ on: (k * 7 + i) % 3 !== 0, ph: (k * 13 + i * 7) % 10 })),
        });
        x += w - 1;
        i++;
      }
      boats = [
        { x: W * 0.25, s: 0.18, y: 0.86 },
        { x: W * 0.75, s: -0.12, y: 0.92 },
      ];
      // Deterministic spread so server/client and reloads look the same.
      gulls = Array.from({ length: 5 }, (_, i) => ({ x: ((i * 0.37) % 1) * W, y: H * (0.12 + i * 0.05), s: 0.3 + i * 0.08, p: i }));
    };

    const size = () => {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const nextDpr = Math.min(2, window.devicePixelRatio || 1);
      if (r.width === W && r.height === H && nextDpr === dpr) return true;
      W = r.width;
      H = r.height;
      dpr = nextDpr;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      build();
      return true;
    };

    const draw = (t: number, step: number) => {
      if (!size()) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const T = t / 1000;

      // Sky and sun
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.66);
      g.addColorStop(0, "#5E97E0");
      g.addColorStop(0.55, "#B9D5F2");
      g.addColorStop(1, "#FFDFA0");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const sx = W * 0.68;
      const sy = H * 0.5;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.55);
      sg.addColorStop(0, "rgba(255,224,130,.95)");
      sg.addColorStop(0.12, "rgba(255,210,100,.55)");
      sg.addColorStop(1, "rgba(255,200,90,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FFE69A";
      ctx.beginPath();
      ctx.arc(sx, sy, W * 0.06, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      ctx.fillStyle = "rgba(255,255,255,.55)";
      for (let i = 0; i < 4; i++) {
        const cx = ((T * 8 * (1 + i * 0.3) + i * W * 0.4) % (W * 1.6)) - W * 0.3;
        const cy = H * (0.12 + i * 0.07);
        ctx.beginPath();
        ctx.ellipse(cx, cy, W * 0.12, H * 0.018, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + W * 0.06, cy - H * 0.012, W * 0.07, H * 0.02, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Far bank (Gaia)
      const hz = H * 0.6;
      ctx.fillStyle = "#8EA8D8";
      ctx.beginPath();
      ctx.moveTo(W * 0.3, hz);
      for (let x = W * 0.3; x <= W; x += W * 0.05) ctx.lineTo(x, hz - H * (0.03 + 0.025 * Math.sin(x * 0.03)));
      ctx.lineTo(W, hz);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 14; i++) {
        const x = W * 0.32 + i * W * 0.05;
        const h = H * (0.02 + ((i * 31) % 4) * 0.01);
        ctx.fillStyle = "#A9BEE3";
        ctx.fillRect(x, hz - h - H * 0.02, W * 0.035, h + H * 0.02);
        ctx.fillStyle = i % 2 ? "#A9BEE3" : "#C46A4A";
        ctx.fillRect(x, hz - h - H * 0.026, W * 0.035, H * 0.008);
      }

      // Dom Luís I bridge
      const bx0 = W * 0.34;
      const bx1 = W * 1.08;
      const top = H * 0.36;
      const base = hz + H * 0.01;
      ctx.strokeStyle = "#1F3E80";
      ctx.lineWidth = Math.max(3, W * 0.012);
      ctx.beginPath();
      ctx.moveTo(bx0, base);
      ctx.quadraticCurveTo((bx0 + bx1) / 2, top - H * 0.1, bx1, base);
      ctx.stroke();
      ctx.lineWidth = Math.max(2, W * 0.006);
      ctx.beginPath();
      ctx.moveTo(bx0, base);
      ctx.quadraticCurveTo((bx0 + bx1) / 2, top - H * 0.03, bx1, base);
      ctx.stroke();
      ctx.lineWidth = Math.max(3, W * 0.011);
      ctx.beginPath();
      ctx.moveTo(W * 0.26, top);
      ctx.lineTo(W, top);
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(31,62,128,.75)";
      for (let x = bx0 + W * 0.04; x < Math.min(W, bx1 - W * 0.04); x += W * 0.045) {
        const u = (x - bx0) / (bx1 - bx0);
        const ay = (1 - u) * (1 - u) * base + 2 * u * (1 - u) * (top - H * 0.1) + u * u * base;
        if (ay > top + 4) {
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, ay);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#1F3E80";
      ctx.fillRect(W * 0.26, top - 2, W * 0.02, base - top + 4);

      // Metro crossing the upper deck
      const tx = W * 0.27 + ((T * 26) % (W * 0.8));
      ctx.fillStyle = "#FFC531";
      ctx.fillRect(tx, top - H * 0.022, W * 0.09, H * 0.018);
      ctx.fillStyle = "#1F3E80";
      for (let k = 0; k < 4; k++) ctx.fillRect(tx + W * 0.008 + k * W * 0.02, top - H * 0.018, W * 0.011, H * 0.007);

      // Douro
      const rg = ctx.createLinearGradient(0, hz, 0, H);
      rg.addColorStop(0, "#6E9FDA");
      rg.addColorStop(0.4, "#3767B8");
      rg.addColorStop(1, "#163F8E");
      ctx.fillStyle = rg;
      ctx.fillRect(0, hz, W, H - hz);
      for (let i = 0; i < 70; i++) {
        const y = hz + (((i * 37) % 100) / 100) * (H - hz);
        const x = (((i * 91) % 100) / 100) * W + Math.sin(T * 1.2 + i) * 12;
        const a = 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(T * 2 + i * 1.7));
        ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.lineWidth = 1.5 + ((y - hz) / (H - hz)) * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10 + ((i * 13) % 26), y);
        ctx.stroke();
      }
      for (let i = 0; i < 26; i++) {
        const y = hz + 4 + (i * (H - hz)) / 26;
        const w = W * (0.03 + 0.05 * (1 - i / 26)) * (0.6 + 0.4 * Math.sin(T * 3 + i));
        ctx.fillStyle = `rgba(255,215,110,${(0.55 - 0.015 * i).toFixed(3)})`;
        ctx.fillRect(sx - w / 2 + Math.sin(T * 2 + i) * 6, y, w, 2.2);
      }

      // Ribeira houses with flickering windows
      const hb = H * 0.8;
      ctx.fillStyle = "#8D7F6E";
      ctx.fillRect(0, hb, W * 0.6, H * 0.03);
      for (const h of houses) {
        const y = hb - h.h;
        ctx.fillStyle = h.c;
        ctx.fillRect(h.x, y, h.w, h.h);
        ctx.fillStyle = "rgba(15,45,107,.08)";
        ctx.fillRect(h.x + h.w * 0.8, y, h.w * 0.2, h.h);
        ctx.fillStyle = "#B8502D";
        ctx.beginPath();
        ctx.moveTo(h.x - 2, y);
        ctx.lineTo(h.x + h.w / 2, y - h.w * 0.32);
        ctx.lineTo(h.x + h.w + 2, y);
        ctx.fill();
        const rows = Math.max(2, Math.floor(h.h / (H * 0.045)));
        let k = 0;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < 2; c++) {
            const wx = h.x + h.w * (0.18 + c * 0.42);
            const wy = y + H * 0.015 + r * H * 0.042;
            const ww = h.w * 0.24;
            const wh = H * 0.024;
            const win = h.win[k++ % 12];
            const lit = win.on && Math.sin(T * 0.6 + win.ph) > -0.6;
            ctx.fillStyle = lit ? "#FFE08A" : "#2B3E6B";
            ctx.fillRect(wx, wy, ww, wh);
            if (lit) {
              ctx.fillStyle = "rgba(255,224,138,.25)";
              ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
            }
            ctx.fillStyle = "rgba(20,33,61,.5)";
            ctx.fillRect(wx - 1, wy + wh, ww + 2, 2);
          }
      }
      ctx.globalAlpha = 0.18;
      for (const h of houses) {
        ctx.fillStyle = h.c;
        ctx.fillRect(h.x, hb + H * 0.025, h.w, h.h * 0.35 * (0.9 + 0.1 * Math.sin(T * 2 + h.x)));
      }
      ctx.globalAlpha = 1;

      // Rabelo boats
      for (const b of boats) {
        b.x += b.s * step;
        if (b.x > W + 80) b.x = -80;
        if (b.x < -80) b.x = W + 80;
        const y = H * b.y + Math.sin(T * 2 + b.x * 0.02) * 2.5;
        const s = W * 0.0028 * (b.y > 0.9 ? 1.15 : 1) * 5.5;
        ctx.save();
        ctx.translate(b.x, y);
        ctx.scale(s, s);
        ctx.fillStyle = "#5A3416";
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.quadraticCurveTo(0, 2.6, 6, 0);
        ctx.lineTo(5, 1.4);
        ctx.lineTo(-5, 1.4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#3A220F";
        ctx.fillRect(-0.2, -6, 0.4, 6);
        ctx.fillStyle = "#F4EBD6";
        ctx.fillRect(-2.6, -5.6, 5, 4.2);
        ctx.fillStyle = "#C8A26A";
        ctx.fillRect(-3, 0.2, 1.2, 0.6);
        ctx.fillRect(1.5, 0.2, 1.2, 0.6);
        ctx.restore();
      }

      // Gulls
      ctx.strokeStyle = "#14213D";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      for (const gl of gulls) {
        gl.x += gl.s * step;
        if (gl.x > W + 20) gl.x = -20;
        const y = gl.y + Math.sin(T + gl.p) * 6;
        const f = Math.sin(T * 6 + gl.p) * 3;
        ctx.beginPath();
        ctx.moveTo(gl.x - 7, y - f);
        ctx.quadraticCurveTo(gl.x - 3, y - 4, gl.x, y);
        ctx.quadraticCurveTo(gl.x + 3, y - 4, gl.x + 7, y - f);
        ctx.stroke();
      }
    };

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;
    let visible = true;

    const frame = (t: number) => {
      // Normalise movement to a 60 fps step; clamp after tab switches.
      const step = last ? Math.min(3, (t - last) / (1000 / 60)) : 1;
      last = t;
      draw(t, step);
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const update = () => {
      stop();
      if (motion.matches) draw(0, 0); // still frame, no loop
      else if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    io.observe(cv);
    const ro = new ResizeObserver(() => {
      if (motion.matches || !raf) draw(0, 0);
    });
    ro.observe(cv);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    update();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 block size-full" />;
}
