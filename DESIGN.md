# Design

## Visual Theme
The KIDDO visual theme is "Playful Premium". It combines the energy of a learning platform with the sophistication of modern SaaS. It uses soft glassmorphism, vibrant gradients, and generous whitespace to create a focused yet delightful environment.

## Color Palette
Using OKLCH for perceptual uniformity and vibrant, accessible colors.

### Primary (Energy Orange)
- `brand`: `oklch(68% 0.22 35)`
- `brand-muted`: `oklch(96% 0.02 35)`
- `brand-text`: `oklch(45% 0.15 35)`

### Secondary (Focus Purple)
- `secondary`: `oklch(55% 0.20 270)`
- `secondary-muted`: `oklch(95% 0.02 270)`

### Neutrals (Tinted Navy)
- `bg`: `oklch(98% 0.005 240)`
- `surface`: `oklch(100% 0 0)`
- `border`: `oklch(92% 0.01 240)`
- `text`: `oklch(25% 0.02 240)`
- `text-muted`: `oklch(55% 0.02 240)`

### Semantic
- `success`: `oklch(70% 0.18 150)`
- `error`: `oklch(65% 0.22 25)`
- `warning`: `oklch(85% 0.18 85)`

## Typography
- **Primary Font**: 'Plus Jakarta Sans', system-ui, sans-serif
- **Thai Font**: 'Noto Sans Thai', sans-serif
- **Base Size**: 16px
- **Scale**: 1.25 (Major Third)
- **H1**: 3.052rem (Bold, -0.04em tracking)
- **H2**: 2.441rem (Bold, -0.03em tracking)
- **H3**: 1.953rem (Bold, -0.02em tracking)
- **Body**: 1rem (Normal)
- **Small**: 0.8rem (Medium)

## Components
### Buttons
- **Primary**: Brand color background, white text, 12px radius, subtle elevation.
- **Outline**: Bordered, transparent background, brand color text.
- **Ghost**: No border, hover background tint.

### Cards
- **Standard**: 24px radius, `oklch(100% 0 0)` background, 1px border.
- **Glass**: `rgba(255, 255, 255, 0.7)` with 20px blur, thin white border.

### Feedback
- **Badges**: Pill-shaped, high-chroma text on low-chroma background.
- **Progress**: Rounded tracks, brand gradient fill.

## Layout
- **Container**: 1200px max-width, center-aligned.
- **Gutter**: 24px (Desktop), 16px (Mobile).
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px.

## Motion
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (Expo-out)
- **Duration**: 250ms (fast), 600ms (standard)
- **Transitions**: Scale and opacity for interactions; transform for layout reveals.
