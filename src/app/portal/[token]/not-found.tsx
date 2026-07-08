export default function PortalNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#E9E3D4",
        color: "#262420",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Link not found</h1>
        <p style={{ color: "#7A7362", fontSize: 14 }}>
          This selections link isn&apos;t valid. Double-check the URL your builder sent you.
        </p>
      </div>
    </div>
  );
}
