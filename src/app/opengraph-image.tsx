import { ImageResponse } from "next/og";
import { STUDIO_NAME } from "@/lib/constants";

// Imagem de preview (Open Graph) que aparece ao compartilhar o link no
// Instagram, WhatsApp, iMessage etc. Gerada por código — sem asset binário.
export const alt = "Delicadeza Nails — Agende seu horário online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdf6f4 0%, #f4ddd6 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: "#b76e79",
            letterSpacing: -2,
            display: "flex",
          }}
        >
          {STUDIO_NAME}
        </div>
        <div style={{ fontSize: 46, color: "#8a7268", marginTop: 12, display: "flex" }}>
          Agende seu horário online
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#ffffff",
            background: "#b76e79",
            padding: "14px 40px",
            borderRadius: 999,
            marginTop: 48,
            display: "flex",
          }}
        >
          Rápido e fácil, confirmação pelo WhatsApp
        </div>
      </div>
    ),
    { ...size }
  );
}
