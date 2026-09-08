import type { SVGProps } from 'react'

/**
 * Inline icons. Deliberately not an icon package or a webfont: v0 must not load
 * anything from the network (ALLET_PLAN.md §8), and the set stays small.
 */
export type IconProps = SVGProps<SVGSVGElement>

export type IconComponent = (props: IconProps) => React.ReactElement

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const HomeIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 10v9h12v-9" />
  </Icon>
)

export const CalendarIcon: IconComponent = (props) => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
  </Icon>
)

export const InboxIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M4 13.5 6.2 5h11.6L20 13.5V19H4z" />
    <path d="M4 13.5h4l1.2 2.2h5.6L16 13.5h4" />
  </Icon>
)

export const PlansIcon: IconComponent = (props) => (
  <Icon {...props}>
    <rect x="5" y="4" width="14" height="16" rx="2" />
    <path d="M9 9h6M9 13h6M9 17h3" />
  </Icon>
)

export const StageIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M4 5h16v6a8 8 0 0 1-16 0z" />
    <path d="M9 15.5 8 20M15 15.5l1 4.5M8 20h8" />
  </Icon>
)

export const TravelIcon: IconComponent = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15 9-2 4.2-4 1.8 2-4.2z" />
  </Icon>
)

export const SettingsIcon: IconComponent = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6" />
  </Icon>
)

export const SearchIcon: IconComponent = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6" />
    <path d="m15.5 15.5 4 4" />
  </Icon>
)

export const MoreIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
)

export const CloseIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
)

export const ChevronLeftIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="m14.5 5-6 7 6 7" />
  </Icon>
)

export const ChevronRightIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="m9.5 5 6 7-6 7" />
  </Icon>
)
