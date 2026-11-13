/**
 * Shows a QR code SVG produced by our own backend (digits / BOX- IDs only,
 * built from a fixed template), sized by its container.
 */
export default function QrSvg({ svg, className = "", style }) {
  return (
    <div
      className={`[&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
