
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

// --- Generic Avatars (Fallback) ---
export function AvatarMale(props: SVGProps<SVGSVGElement>) {
  return (
   <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
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
     strokeWidth="1.5"
     strokeLinecap="round"
     strokeLinejoin="round"
     {...props}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="9.5" r="2.5" />
        <path d="M15 16s-2-2-6 0" />
        <path d="M12 12v3.5" />
    </svg>
  )
}

// --- Figma-Inspired Avatars ---

export function AvatarFemale20s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#FFE5D9" />
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#4B0082" />
      <path d="M25,45 C25,20 75,20 75,45 C75,70 60,80 50,90 C40,80 25,70 25,45" fill="#1E1E1E"/>
      <rect x="25" y="65" width="50" height="25" fill="#FFE5D9" />
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#FFE5D9" />
      <circle cx="43" cy="45" r="3" fill="black" />
      <circle cx="57" cy="45" r="3" fill="black" />
      <path d="M48 55 Q 50 60, 52 55" stroke="black" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function AvatarFemale30s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#D2B48C" />
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#000080" />
      <path d="M30 30 Q 50 10, 70 30 T 70 50 Q 50 70, 30 50 T 30 30" fill="#A52A2A"/>
      <rect x="25" y="65" width="50" height="25" fill="#D2B48C" />
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#D2B48C" />
      <circle cx="43" cy="45" r="3" fill="black" />
      <circle cx="57" cy="45" r="3" fill="black" />
      <path d="M45 55 H 55" stroke="black" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function AvatarFemale40s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#F0E68C"/>
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#800080"/>
      <path d="M25 35 C 25 20, 40 15, 50 25 C 60 15, 75 20, 75 35 C 75 55, 65 60, 50 55 C 35 60, 25 55, 25 35" fill="#DAA520"/>
      <rect x="25" y="65" width="50" height="25" fill="#F0E68C"/>
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#F0E68C" />
      <circle cx="43" cy="45" r="3" fill="black" />
      <circle cx="57" cy="45" r="3" fill="black" />
      <path d="M48 55 Q 50 50, 52 55" stroke="black" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function AvatarFemale60s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#E6E6FA"/>
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#4B0082"/>
      <path d="M 30 40 C 30 20, 70 20, 70 40 C 70 60, 50 65, 50 65 C 50 65, 30 60, 30 40" fill="#D3D3D3"/>
      <rect x="25" y="65" width="50" height="25" fill="#E6E6FA"/>
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#E6E6FA" />
      <ellipse cx="43" cy="45" rx="3" ry="1.5" fill="black" />
      <ellipse cx="57" cy="45" rx="3" ry="1.5" fill="black" />
      <path d="M45 55 H 55" stroke="black" strokeWidth="2" fill="none" />
      <path d="M40 40 C 42 38, 46 38, 48 40" stroke="#A9A9A9" strokeWidth="2" fill="none" />
      <path d="M52 40 C 54 38, 58 38, 60 40" stroke="#A9A9A9" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function AvatarMale20s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#ADD8E6"/>
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#006400"/>
      <path d="M 35 25 C 25 25, 25 40, 35 40 L 65 40 C 75 40, 75 25, 65 25 Z" fill="#8B4513"/>
      <rect x="25" y="65" width="50" height="25" fill="#ADD8E6"/>
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#ADD8E6" />
      <circle cx="43" cy="45" r="3" fill="black" />
      <circle cx="57" cy="45" r="3" fill="black" />
      <path d="M48 55 Q 50 60, 52 55" stroke="black" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function AvatarMale30s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#90EE90"/>
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#FF4500"/>
      <path d="M30,35 C30,25 40,20 50,25 C60,20 70,25 70,35 L 70 40 L 30 40 Z" fill="#2F4F4F"/>
      <rect x="25" y="65" width="50" height="25" fill="#90EE90"/>
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#90EE90" />
      <circle cx="43" cy="45" r="3" fill="black" />
      <circle cx="57" cy="45" r="3" fill="black" />
      <path d="M45 55 H 55" stroke="black" strokeWidth="2" fill="none" />
      <path d="M40 60 H 60" stroke="#A9A9A9" strokeWidth="3" fill="none" />
    </svg>
  )
}

export function AvatarMale40s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#FFA07A"/>
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#B22222"/>
      <path d="M35 30 C 25 30, 25 45, 40 45 L 60 45 C 75 45, 75 30, 65 30 L 35 30" fill="#696969"/>
      <path d="M 50 25 C 40 25, 40 15, 50 15 C 60 15, 60 25, 50 25" fill="#696969"/>
      <rect x="25" y="65" width="50" height="25" fill="#FFA07A"/>
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#FFA07A" />
      <circle cx="43" cy="45" r="3" fill="black" />
      <circle cx="57" cy="45" r="3" fill="black" />
      <path d="M48 55 Q 50 50, 52 55" stroke="black" strokeWidth="2" fill="none" />
      <path d="M45 59 H 55" stroke="#A9A9A9" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function AvatarMale60s(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
      <circle cx="50" cy="50" r="50" fill="#F5DEB3"/>
      <path d="M25 75 C30 70, 70 70, 75 75 L75 100 L25 100 Z" fill="#2F4F4F"/>
      <path d="M40 30 C 30 30, 30 45, 40 45 L 60 45 C 70 45, 70 30, 60 30 Z" fill="#D3D3D3"/>
      <rect x="25" y="65" width="50" height="25" fill="#F5DEB3"/>
      <ellipse cx="50" cy="50" rx="20" ry="25" fill="#F5DEB3" />
      <ellipse cx="43" cy="45" rx="3" ry="1.5" fill="black" />
      <ellipse cx="57" cy="45" rx="3" ry="1.5" fill="black" />
      <path d="M45 55 H 55" stroke="black" strokeWidth="2" fill="none" />
      <path d="M40 40 C 42 38, 46 38, 48 40" stroke="#A9A9A9" strokeWidth="2" fill="none" />
      <path d="M52 40 C 54 38, 58 38, 60 40" stroke="#A9A9A9" strokeWidth="2" fill="none" />
      <path d="M40 60 H 60" stroke="#A9A9A9" strokeWidth="3" fill="none" />
    </svg>
  )
}
