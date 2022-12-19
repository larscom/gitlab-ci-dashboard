export default function StatusSuccess({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path fill="#2da160" d="M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z" />
        <path fill="#FFF" d="M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z" />
        <path
          fill="#2da160"
          d="M6.278 7.697L5.045 6.464a.296.296 0 0 0-.42-.002l-.613.614a.298.298 0 0 0 .002.42l1.91 1.909a.5.5 0 0 0 .703.005l.265-.265L9.997 6.04a.291.291 0 0 0-.009-.408l-.614-.614a.29.29 0 0 0-.408-.009L6.278 7.697z"
        />
      </g>
    </svg>
  )
}
