export default function JointImage({ type = "knee", size = 112, label }) {
  const normalizedType = String(type).toLowerCase();
  const isHip = ["hip", "hip_tep", "huefte", "hüfte"].includes(normalizedType);

  if (isHip) {
    return (
      <svg
        aria-label={label || "Hip illustration"}
        role="img"
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="160" height="160" rx="34" fill="currentColor" opacity="0.08" />

        <path
          d="M75 24c-13 0-25 7-31 19-6 11-5 24 2 35l11 17c3 5 5 11 5 17v18"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <path
          d="M86 24c13 0 25 7 31 19 6 11 5 24-2 35l-11 17c-3 5-5 11-5 17v18"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <circle cx="80" cy="75" r="20" fill="currentColor" opacity="0.18" />

        <circle
          cx="80"
          cy="75"
          r="11"
          stroke="currentColor"
          strokeWidth="8"
        />

        <path
          d="M80 86v48"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-label={label || "Knee illustration"}
      role="img"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="160" height="160" rx="34" fill="currentColor" opacity="0.08" />

      <path
        d="M70 24c0 20-2 33-9 46-4 7-8 15-8 26 0 19 12 32 27 32"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path
        d="M93 24c0 21 1 34 8 47 4 8 7 16 7 27 0 19-12 30-27 30"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />

      <circle cx="80" cy="88" r="21" fill="currentColor" opacity="0.18" />

      <path
        d="M58 88h44"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path
        d="M80 109v31"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}