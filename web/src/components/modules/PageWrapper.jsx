export default function PageWrapper({ children, visible }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "all 0.7s cubic-bezier(.4,0,.2,1)",
        width: "100%",
        maxWidth: "640px",
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      {children}
    </div>
  );
}
