import type { SVGProps } from "react"

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M15.5 9.5a2.5 2.5 0 0 0-5 0" />
      <path d="M8.5 9.5a2.5 2.5 0 0 1 5 0" />
      <path d="M12 18a4 4 0 0 0-4-4h8a4 4 0 0 0-4 4z" />
    </svg>
  )
}

export function AvatarMale(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 14c-2.76 0-5-1.12-5-2.5S9.24 9 12 9s5 1.12 5 2.5-2.24 2.5-5 2.5z" />
      <path d="M12 14v4" />
      <path d="M10 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="M14 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="M9 10.5s.5-1.5 3-1.5 3 1.5 3 1.5" />
    </svg>
  )
}

export function AvatarFemale(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 14c-2.76 0-5-1.12-5-2.5S9.24 9 12 9s5 1.12 5 2.5-2.24 2.5-5 2.5z" />
      <path d="M12 14v4" />
      <path d="M10 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="M14 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="M9 10s.5-2 3-2 3 2 3 2" />
      <path d="M10 18s.5-2 2-2 2 2 2 2" />
    </svg>
  )
}
