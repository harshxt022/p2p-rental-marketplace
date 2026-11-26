---
name: Warm Peer-to-Peer Hospitality
colors:
  surface: '#fff8f5'
  surface-dim: '#e2d8d2'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2eb'
  surface-container: '#f6ece6'
  surface-container-high: '#f0e6e0'
  surface-container-highest: '#eae1da'
  on-surface: '#1f1b17'
  on-surface-variant: '#584237'
  inverse-surface: '#342f2b'
  inverse-on-surface: '#f9efe8'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#006d30'
  on-secondary: '#ffffff'
  secondary-container: '#92f5a4'
  on-secondary-container: '#007233'
  tertiary: '#625e56'
  on-tertiary: '#ffffff'
  tertiary-container: '#a09a91'
  on-tertiary-container: '#36322c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#95f8a7'
  secondary-fixed-dim: '#79db8d'
  on-secondary-fixed: '#00210a'
  on-secondary-fixed-variant: '#005323'
  tertiary-fixed: '#e9e1d8'
  tertiary-fixed-dim: '#ccc5bc'
  on-tertiary-fixed: '#1e1b15'
  on-tertiary-fixed-variant: '#4a463f'
  background: '#fff8f5'
  on-background: '#1f1b17'
  surface-variant: '#eae1da'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  price-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 26px
    letterSpacing: -0.02em
  price-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system channels the hospitality and community warmth of Airbnb fused with the high-utility, friction-free transactional clarity of modern Indian category-defining apps like Urban Company and Swiggy. The core aesthetic balances warmth, premium execution, and deep transactional trust.

Targeted at urban Indian digital natives, creators, and professionals renting lifestyle assets, photography gear, electronics, event essentials, and boutique vehicles, the interface relies on tactile clarity, uncompromised readability, and visible verification cues. 

The aesthetic is Modern Tactile Minimalism: warm off-white canvases, generous breathing room, micro-depth through feathered ambient shadows, and purposeful pops of radiant saffron-orange that draw focus directly to transactional and discovery actions.

## Colors

The palette establishes an immediate sensation of energy and reliability:

- **Primary (`#F97316`)**: Vibrant warm orange. Applied strictly to primary actions, interactive selection accents, and prominent booking highlights.
- **Primary Light (`#FFF7ED`)**: Soft cream orange-tint wash. Used for active navigation pills, promotional banners, status backdrops, and active toggle containers.
- **Secondary / Success (`#15803D`)**: Forest emerald green. Dedicated to security indicators, Aadhaar/KYC verified badges, availability tags, and positive order states.
- **Neutral Surface / Background (`#FAFAF9`)**: Stone-derived warm off-white that replaces sterile clinical whites, grounding the interface with subtle earthiness.
- **Card Surface (`#FFFFFF`)**: Pure white surface elevation to ensure distinct contrast over the stone background.
- **Borders & Dividers (`#E7E5E4`)**: Soft stone hairline borders for low-contrast containment.
- **Typography Neutrals**: Dark warm charcoal (`#292524`) for primary headings and body readability, paired with medium warm stone gray (`#78716C`) for secondary metadata, labels, and timestamps.

## Typography

The typography leverages Plus Jakarta Sans across all touchpoints, capitalizing on its modern geometric foundation, humanist curves, and high legibility at micro sizes.

- **Indian Rupee (₹) Presentation**: All monetary instances must pair the Rupee symbol seamlessly with tabular numerical glyphs. Price tokens (`price-lg`, `price-md`) emphasize weight over height, presenting rental units clearly with standard qualifiers (e.g., `₹1,499 / day` or `₹4,999 / week`).
- **Hierarchy Rules**: Display headings use tight negative tracking (`-0.02em` to `-0.03em`) to anchor editorial discovery sections. Body copy stays open and neutral for high scanning speed under variable mobile lighting conditions.

## Layout & Spacing

The layout model is driven by an 8pt base grid with a fluid 12-column structure on desktop, 8 columns on tablet, and a 4-column framework on mobile devices.

- **Mobile (< 768px)**: 4-column layout with fixed `1rem` outer canvas padding, edge-to-edge listing media carousels, and persistent bottom navigation or action bars (sticky booking dock).
- **Tablet (768px - 1023px)**: 8-column layout with `2rem` outer margin and `1rem` gutters, enabling 2-column or 3-column listing grids.
- **Desktop (≥ 1024px)**: 12-column container maxing out at `1280px`, with `1.5rem` gutters and `3rem` margins to maintain comfortable scanning zones for multi-pane split booking flows (item details left, floating sticky reservation card right).

## Elevation & Depth

Visual hierarchy uses a refined hybrid of tonal layering, low-contrast ghost borders, and warm diffused drop shadows.

- **Level 0 (Flat Canvas)**: Neutral surface `#FAFAF9`, no shadow.
- **Level 1 (Card & Content Blocks)**: Surface `#FFFFFF`, hairline perimeter `1px solid #E7E5E4`, subtle diffused lift: `box-shadow: 0 1px 3px rgba(41, 37, 36, 0.04), 0 4px 12px rgba(41, 37, 36, 0.03)`.
- **Level 2 (Interactive Hover & Flyouts)**: Elevated card states, date-range pickers, and filter popovers: `box-shadow: 0 4px 6px -1px rgba(41, 37, 36, 0.06), 0 12px 24px -4px rgba(41, 37, 36, 0.08)`.
- **Level 3 (Modals & Bottom Drawers)**: Heavy sheets and search dialogs: `box-shadow: 0 20px 32px -8px rgba(41, 37, 36, 0.16)`.
- **Warm Glow Accent**: Reserved exclusively for the primary CTA during interaction or key callouts: `box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35)`.

## Shapes

The design system incorporates a balanced, friendly geometric radius scale (`roundedness: 2`), reflecting the approachability of hospitality services without appearing juvenile.

- Standard UI cards, inputs, and image media containers utilize `0.5rem` to `1rem` corner radii.
- Pill forms (`rounded-full`) are intentionally reserved for tags, filter chips, rating badges, search bars, and floating mobile action buttons to provide high contrast against content grids.

## Components

### Buttons
- **Primary CTA**: Rich `#F97316` fill, `#FFFFFF` text, `0.75rem` radius or full pill depending on context, height `48px` (desktop) / `52px` (mobile). Hover state applies a 5% darkened orange with warm glow elevation.
- **Secondary / Outline**: Clean `#FFFFFF` fill with `1px solid #E7E5E4` border, `#292524` text, shifting to `#FFF7ED` surface on hover.
- **Ghost Action**: Unbordered, `#78716C` text turning `#292524` on hover, used for wishlist hearts, share icons, and tertiary dismissals.

### Search Bar & Filter Chips
- **Floating Global Search**: Rounded pill-shaped white bar with subtle border and Level 2 elevation, dividing inputs into "Where", "Dates", and "Category" separated by micro dividers.
- **Category & Filter Chips**: Pill shapes (`rounded-full`). Unselected state features white background, `1px solid #E7E5E4`, `#78716C` typography. Selected state features `#FFF7ED` warm background, `#F97316` border, and `#F97316` medium-weighted text.

### Listing Cards
- Clean `#FFFFFF` container with `0.75rem` rounded corners and Level 1 elevation.
- Aspect ratio 4:3 or 1:1 image thumbnail with subtle overflow containment and top-right wishlist floating button.
- Bottom details stack: Title in `headline-sm`, neighborhood/city in `body-sm` (`#78716C`), and dynamic pricing block (`price-md`) in `#292524` with unit interval (`/ day`) in `#78716C`.

### Trust & Verification Badges
- **Aadhaar / ID Verified Tag**: Pill format with `#15803D` text on a soft green background (`#DCFCE7`), featuring a micro checkmark icon.
- **Super-Lender Badge**: `#FFF7ED` background, `#F97316` label and micro medal icon.
- **Rating Chip**: `#292524` text with filled amber star icon displaying numeric rating (e.g., `★ 4.94 (48)`).

### Form Inputs & Checkboxes
- **Text & Date Fields**: Hairline `#E7E5E4` border over `#FFFFFF` canvas, `0.5rem` radius. On active focus, shifts to `1.5px solid #F97316` with a faint `3px` orange focus ring (`rgba(249, 115, 22, 0.15)`).
- **Checkboxes & Radios**: Fully rounded or softly curved inputs filled with `#F97316` when active, containing crisp white checks.

### Sticky Mobile Action Dock
- Fixed bottom surface (`#FFFFFF`) with top border `#E7E5E4` and Level 3 elevation.
- Left column displays total cost (`price-lg`) with tax / deposit breakdown link; right column hosts full-width "Rent Now" or "Check Availability" primary button.