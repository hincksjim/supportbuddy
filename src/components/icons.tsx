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

// --- Detailed Avatars ---

export function AvatarFemale20s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#f0d1b3"></rect>
                <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(324 18 18) scale(1.2)" fill="#ffc8a0" rx="36"></rect>
                <g transform="translate(-4 -1) rotate(4 18 18)">
                    <path d="M15 19c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <rect x="13" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                    <rect x="20" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                    <path d="M11,26 a1,0.5 0 0,0 14,0" fill="#000000"></path>
                </g>
            </g>
        </svg>
    );
}

export function AvatarFemale30s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#f0d1b3"></rect>
                <rect x="0" y="0" width="36" height="36" transform="translate(3 3) rotate(315 18 18) scale(1.1)" fill="#4c2f19" rx="6"></rect>
                <g transform="translate(1.5 -1) rotate(-5 18 18)">
                    <path d="M15 20c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <rect x="13" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                    <rect x="20" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                    <path d="M11,28 a1,0.4 0 0,0 14,0" fill="#000000"></path>
                </g>
            </g>
        </svg>
    );
}

export function AvatarFemale40s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#edd4c0"></rect>
                <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(190 18 18) scale(1.1)" fill="#7a543d" rx="36"></rect>
                <g transform="translate(-2 0) rotate(10 18 18)">
                    <path d="M15 19c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <rect x="13" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                    <rect x="20" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                     <path d="M13 25 C14 26, 22 26, 23 25" stroke="#000000" fill="none" strokeWidth="1" strokeLinecap="round" />
                </g>
            </g>
        </svg>
    );
}

export function AvatarFemale60s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#f0e2d8"></rect>
                <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(324 18 18) scale(1.2)" fill="#d4d4d4" rx="36"></rect>
                <g transform="translate(0 2) rotate(4 18 18)">
                    <path d="M15 19c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <path d="M13.5,14.5 a0.5,0.5 0 1,0 0,1 a0.5,0.5 0 1,0 0,-1" fill="#000000"></path>
                    <path d="M21.5,14.5 a0.5,0.5 0 1,0 0,1 a0.5,0.5 0 1,0 0,-1" fill="#000000"></path>
                    <path d="M12 24 C14 26, 22 26, 24 24" stroke="#000000" fill="none" strokeWidth="1" strokeLinecap="round" />
                </g>
            </g>
        </svg>
    );
}

export function AvatarMale20s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#f0d1b3"></rect>
                <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(0 18 18) scale(1)" fill="#4c2f19" rx="36"></rect>
                <g transform="translate(0 0) rotate(0 18 18)">
                    <path d="M13 20c1.5 2 4.5 2 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <rect x="13" y="14" width="3.5" height="3.5" rx="1" stroke="none" fill="#000000"></rect>
                    <rect x="20" y="14" width="3.5" height="3.5" rx="1" stroke="none" fill="#000000"></rect>
                </g>
            </g>
        </svg>
    );
}

export function AvatarMale30s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#f0d1b3"></rect>
                <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(0 18 18) scale(1)" fill="#7a543d" rx="12"></rect>
                <g transform="translate(0 2) rotate(0 18 18)">
                    <path d="M13 20c1.5 2 4.5 2 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <rect x="13" y="14" width="3.5" height="3.5" rx="1" stroke="none" fill="#000000"></rect>
                    <rect x="20" y="14" width="3.5" height="3.5" rx="1" stroke="none" fill="#000000"></rect>
                    <path d="M11 25 C 13 24, 23 24, 25 25" stroke="#000000" fill="none" strokeWidth="1" strokeLinecap="round" />
                </g>
            </g>
        </svg>
    );
}


export function AvatarMale40s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#edd4c0"></rect>
                <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(0 18 18) scale(1)" fill="#4c2f19" rx="0"></rect>
                <g transform="translate(0 3) rotate(0 18 18)">
                    <path d="M15 19c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <rect x="13" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                    <rect x="20" y="14" width="3.5" height="3.5" rx="2" stroke="none" fill="#000000"></rect>
                </g>
            </g>
        </svg>
    );
}

export function AvatarMale60s(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" {...props}>
            <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#mask__beam)">
                <rect width="36" height="36" fill="#f0e2d8"></rect>
                <g transform="translate(0 0) rotate(0 18 18)">
                    <path d="M0 36 C0 28, 36 28, 36 36" fill="#d4d4d4"></path>
                    <path d="M15 19c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
                    <path d="M13.5,14.5 a0.5,0.5 0 1,0 0,1 a0.5,0.5 0 1,0 0,-1" fill="#000000"></path>
                    <path d="M21.5,14.5 a0.5,0.5 0 1,0 0,1 a0.5,0.5 0 1,0 0,-1" fill="#000000"></path>
                    <path d="M12 26 C14 25, 22 25, 24 26" stroke="#000000" fill="none" strokeWidth="1" strokeLinecap="round" />
                </g>
            </g>
        </svg>
    );
}
