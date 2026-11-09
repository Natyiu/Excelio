import { ImageResponse } from "next/og";

export const alt = "Excelio: learn Excel by doing, in a real spreadsheet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview shown when a page is shared. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#0d6b37", color: "white" }}>
        <div style={{ fontSize: 44, fontWeight: 700, opacity: 0.85 }}>Excelio</div>
        <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>Learn Excel by doing</div>
        <div style={{ fontSize: 40, marginTop: 32, opacity: 0.9 }}>Interactive lessons in a real spreadsheet</div>
      </div>
    ),
    size
  );
}
