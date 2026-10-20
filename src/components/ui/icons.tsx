import { Icon, type IconProps } from "@/components/editor/icons";

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </Icon>
);

export const PlazasIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 4l5 5L9 20H4v-5Z" />
    <path d="m13 6 5 5" />
  </Icon>
);

export const YeahIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5" />
    <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={3.2} />
  </Icon>
);

export const ReplyIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-4.8A8.5 8.5 0 1 1 21 12Z" />
  </Icon>
);

export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" fill="currentColor" />
    <path d="M19 16v4M17 18h4" />
  </Icon>
);

export const SignInIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="m9 17 5-5-5-5" />
    <path d="M14 12H3" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);

export const TrendingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18" />
    <path d="M8 3v4M16 3v4" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" strokeWidth={3} />
  </Icon>
);
