
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

// --- Professional Cartoon Avatars ---

export function AvatarFemale20s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#E0F7FA"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#FFDAB9"/>
      {/* <!-- Hair --> */}
      <path d="M22 60 C 20 30, 80 30, 78 60 C 90 40, 90 90, 70 95 C 70 95, 30 95, 30 95 C 10 90, 10 40, 22 60 Z" fill="#A52A2A"/>
      <path d="M25 45 C 20 25, 50 20, 50 35 L 30 45 Z" fill="#8B0000"/>
      <path d="M75 45 C 80 25, 50 20, 50 35 L 70 45 Z" fill="#8B0000"/>
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="4" ry="6" fill="white"/>
      <ellipse cx="58" cy="50" rx="4" ry="6" fill="white"/>
      <circle cx="42" cy="51" r="2.5" fill="#2E8B57"/>
      <circle cx="58" cy="51" r="2.5" fill="#2E8B57"/>
      <circle cx="43" cy="50" r="1" fill="black"/>
      <circle cx="59" cy="50" r="1" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 43 Q 42 41, 46 43" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M54 43 Q 58 41, 62 43" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M48 58 C 50 60, 52 60, 52 58" stroke="#D2691E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 65 Q 50 68, 55 65" stroke="#C71585" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#4682B4"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#FFDAB9"/>
    </svg>
    )
}

export function AvatarFemale30s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#FFF0F5"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#FFE4C4"/>
      {/* <!-- Hair --> */}
      <path d="M25 35 C 10 45, 15 80, 30 90 L 70 90 C 85 80, 90 45, 75 35 C 60 20, 40 20, 25 35 Z" fill="#FFD700"/>
      <path d="M20 50 C 30 30, 70 30, 80 50 L 75 95 L 25 95 Z" fill="#FFD700" />
      <path d="M50 32 C 40 25, 60 25, 50 32" stroke="#DAA520" strokeWidth="2" fill="none" />
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="4" ry="6" fill="white"/>
      <ellipse cx="58" cy="50" rx="4" ry="6" fill="white"/>
      <circle cx="42" cy="51" r="2.5" fill="#4682B4"/>
      <circle cx="58" cy="51" r="2.5" fill="#4682B4"/>
      <circle cx="43" cy="50" r="1" fill="black"/>
      <circle cx="59" cy="50" r="1" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 44 Q 42 42, 46 44" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M54 44 Q 58 42, 62 44" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M48 58 L 52 58" stroke="#D2691E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 65 Q 50 67, 55 65" stroke="#DB7093" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#9370DB"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#FFE4C4"/>
    </svg>
    )
}

export function AvatarFemale40s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#F0FFF0"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#F5DEB3"/>
      {/* <!-- Hair --> */}
      <path d="M25 35 C 20 25, 80 25, 75 35 C 90 45, 85 80, 70 90 L 30 90 C 15 80, 10 45, 25 35 Z" fill="#696969"/>
      <circle cx="50" cy="30" r="20" fill="#696969"/>
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="4" ry="5" fill="white"/>
      <ellipse cx="58" cy="50" rx="4"ry="5" fill="white"/>
      <circle cx="42" cy="50.5" r="2.5" fill="#8B4513"/>
      <circle cx="58" cy="50.5" r="2.5" fill="#8B4513"/>
      <circle cx="43" cy="50" r="1" fill="black"/>
      <circle cx="59" cy="50" r="1" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 44 Q 42 43, 46 44" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M54 44 Q 58 43, 62 44" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M48 58 C 50 60, 52 60, 52 58" stroke="#A0522D" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 65 H 55" stroke="#C71585" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#8B008B"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#F5DEB3"/>
    </svg>
    )
}

export function AvatarFemale60s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#FAFAD2"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#FFF5EE"/>
      {/* <!-- Hair --> */}
      <path d="M25 35 C 20 25, 80 25, 75 35 C 90 45, 85 70, 75 80 L 25 80 C 15 70, 10 45, 25 35 Z" fill="#DCDCDC"/>
      <circle cx="35" cy="35" r="10" fill="#DCDCDC"/>
      <circle cx="65" cy="35" r="10" fill="#DCDCDC"/>
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="3.5" ry="4.5" fill="white"/>
      <ellipse cx="58" cy="50" rx="3.5" ry="4.5" fill="white"/>
      <circle cx="42" cy="50.5" r="2" fill="#B0C4DE"/>
      <circle cx="58" cy="50.5" r="2" fill="#B0C4DE"/>
      <circle cx="42.5" cy="50" r="0.8" fill="black"/>
      <circle cx="58.5" cy="50" r="0.8" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 44 Q 42 43, 46 44" stroke="#A9A9A9" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M54 44 Q 58 43, 62 44" stroke="#A9A9A9" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M48 58 L 52 58" stroke="#D2B48C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 65 Q 50 66, 55 65" stroke="#DB7093" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#5F9EA0"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#FFF5EE"/>
    </svg>
    )
}

// --- Male Avatars ---

export function AvatarMale20s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#E6F7FF"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#FFDAB9"/>
      {/* <!-- Hair --> */}
      <path d="M25 30 C 20 20, 80 20, 75 30 C 75 30, 75 55, 75 55 L 25 55 Z" fill="#2F4F4F"/>
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="4" ry="6" fill="white"/>
      <ellipse cx="58" cy="50" rx="4" ry="6" fill="white"/>
      <circle cx="42" cy="51" r="2.5" fill="#4169E1"/>
      <circle cx="58" cy="51" r="2.5" fill="#4169E1"/>
      <circle cx="43" cy="50" r="1" fill="black"/>
      <circle cx="59" cy="50" r="1" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 44 H 46" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M54 44 H 62" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M50 58 L 48 62 L 52 62 Z" fill="#D2691E" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 68 Q 50 70, 55 68" stroke="#A52A2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#3CB371"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#FFDAB9"/>
    </svg>
    )
}

export function AvatarMale30s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#F5F5DC"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#DEB887"/>
      {/* <!-- Hair --> */}
      <path d="M30 30 C 20 35, 25 55, 30 55 L 70 55 C 75 55, 80 35, 70 30 C 60 20, 40 20, 30 30 Z" fill="#8B4513"/>
      {/* <!-- Beard --> */}
      <path d="M38 68 C 35 80, 65 80, 62 68 L 55 65 H 45 Z" fill="#8B4513"/>
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="4" ry="6" fill="white"/>
      <ellipse cx="58" cy="50" rx="4" ry="6" fill="white"/>
      <circle cx="42" cy="51" r="2.5" fill="#006400"/>
      <circle cx="58" cy="51" r="2.5" fill="#006400"/>
      <circle cx="43" cy="50" r="1" fill="black"/>
      <circle cx="59" cy="50" r="1" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 44 H 46" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M54 44 H 62" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M50 58 L 48 62 L 52 62 Z" fill="#A0522D" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 68 H 55" stroke="#FFE4E1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#B22222"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#DEB887"/>
    </svg>
    )
}

export function AvatarMale40s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#E6E6FA"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#CD853F"/>
      {/* <!-- Hair (receding) --> */}
      <path d="M30 40 C 25 30, 40 25, 50 25 C 60 25, 75 30, 70 40 L 75 55 L 25 55 Z" fill="#696969"/>
      <path d="M50 25 C 40 25, 35 35, 50 35 C 65 35, 60 25, 50 25" fill="#CD853F"/>
      {/* <!-- Mustache --> */}
      <path d="M40 65 C 45 68, 55 68, 60 65" stroke="#696969" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="4" ry="5.5" fill="white"/>
      <ellipse cx="58" cy="50" rx="4" ry="5.5" fill="white"/>
      <circle cx="42" cy="50.5" r="2.5" fill="#A52A2A"/>
      <circle cx="58" cy="50.5" r="2.5" fill="#A52A2A"/>
      <circle cx="43" cy="50" r="1" fill="black"/>
      <circle cx="59" cy="50" r="1" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 44 H 46" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M54 44 H 62" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M50 58 L 48 62 L 52 62 Z" fill="#8B4513" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 70 Q 50 68, 55 70" stroke="#FFE4E1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#2E8B57"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#CD853F"/>
    </svg>
    )
}

export function AvatarMale60s(props: SVGProps<SVGSVGElement>) {
    return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* <!-- Background --> */}
      <circle cx="50" cy="50" r="50" fill="#FFFACD"/>
      {/* <!-- Skin --> */}
      <circle cx="50" cy="55" r="28" fill="#FFEBCD"/>
      {/* <!-- Hair (balding) --> */}
      <path d="M30 45 C 25 35, 40 30, 50 30 C 60 30, 75 35, 70 45 L 75 55 L 25 55 Z" fill="#DCDCDC"/>
      <path d="M50 30 C 40 30, 30 45, 50 45 C 70 45, 60 30, 50 30" fill="#FFEBCD"/>
      {/* <!-- Mustache --> */}
      <path d="M40 65 C 45 69, 55 69, 60 65" stroke="#DCDCDC" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* <!-- Eyes --> */}
      <ellipse cx="42" cy="50" rx="3.5" ry="5" fill="white"/>
      <ellipse cx="58" cy="50" rx="3.5" ry="5" fill="white"/>
      <circle cx="42" cy="50.5" r="2" fill="#708090"/>
      <circle cx="58" cy="50.5" r="2" fill="#708090"/>
      <circle cx="42.5" cy="50" r="0.8" fill="black"/>
      <circle cx="58.5" cy="50" r="0.8" fill="black"/>
      {/* <!-- Eyebrows --> */}
      <path d="M38 44 H 46" stroke="#A9A9A9" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M54 44 H 62" stroke="#A9A9A9" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* <!-- Nose --> */}
      <path d="M50 58 L 48 62 L 52 62 Z" fill="#D2B48C" strokeLinecap="round"/>
      {/* <!-- Mouth --> */}
      <path d="M45 70 H 55" stroke="#F08080" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* <!-- Body --> */}
      <path d="M30 83 H 70 V 100 H 30 Z" fill="#483D8B"/>
      <path d="M50 83 C 40 83, 35 75, 50 75 C 65 75, 60 83, 50 83" fill="#FFEBCD"/>
    </svg>
    )
}

export function BodyFront(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" {...props}>
      <g fill="currentColor">
        {/* Head */}
        <circle cx="100" cy="40" r="30" />
        {/* Torso */}
        <path d="M100 70 q -40 0 -40 80 l 0 80 q 0 30 40 30 q 40 0 40 -30 l 0 -80 q -40 -80 -40 -80" />
        {/* Arms */}
        <path d="M60 150 l -20 -10 l 0 100 l 20 0 z" />
        <path d="M140 150 l 20 -10 l 0 100 l -20 0 z" />
        {/* Legs */}
        <path d="M100 260 q -10 0 -10 10 l 0 120 l 20 0 l 0 -120 q -10 -10 -10 -10" />
        <rect x="70" y="260" width="20" height="130" rx="10" />
        <rect x="110" y="260" width="20" height="130" rx="10" />
      </g>
    </svg>
  );
}

export function BodyBack(props: SVGProps<SVGSVGElement>) {
  return (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" {...props}>
      <g fill="currentColor">
        {/* Head */}
        <circle cx="100" cy="40" r="30" />
        {/* Torso */}
        <path d="M100 70 q -40 0 -40 80 l 0 80 q 0 30 40 30 q 40 0 40 -30 l 0 -80 q -40 -80 -40 -80" />
        {/* Arms */}
        <path d="M60 150 l -20 10 l 0 100 l 20 0 z" />
        <path d="M140 150 l 20 10 l 0 100 l -20 0 z" />
        {/* Legs */}
        <rect x="70" y="260" width="20" height="130" rx="10" />
        <rect x="110" y="260" width="20" height="130" rx="10" />
      </g>
    </svg>
  );
}
