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
    {...props}>
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="7" r="4" />
    <path d="M12 11v2" />
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
        <path d="M18 21a6 6 0 0 0-12 0" />
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11v2" />
    </svg>
  )
}
