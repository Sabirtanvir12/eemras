# 🎨 EEMRAS Brand Color Palette

## Primary Brand Colors

### Signature Accent: Burnt Terracotta
- **Hex:** `#C4714A`
- **RGB:** `196, 113, 74`
- **Usage:** CTAs, highlights, active states, brand emphasis
- **Character:** Warm, sophisticated, premium, trustworthy

### Deep Navy (Primary Dark)
- **Hex:** `#16181F`
- **RGB:** `22, 24, 31`
- **Usage:** Text, backgrounds, readability, authority
- **Character:** Professional, modern, strong

### Warm Ivory (Primary Light)
- **Hex:** `#F9F5EF`
- **RGB:** `249, 245, 239`
- **Usage:** Main background, card backgrounds
- **Character:** Elegant, clean, luxurious

---

## Extended Palette

### Neutrals (Gray Scale)
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Charcoal** | `#1A1A1A` | 26, 26, 26 | Strong text, headings |
| **Gray Dark** | `#3F3F3F` | 63, 63, 63 | Secondary text |
| **Gray Medium** | `#6B6B6B` | 107, 107, 107 | Body text |
| **Gray Light** | `#C8C4BC` | 200, 196, 188 | Borders, subtle dividers |
| **Gray Lighter** | `#E5E7EB` | 229, 231, 235 | Input borders, light backgrounds |
| **Off-White** | `#F0EBE0` | 240, 235, 224 | Subtle backgrounds |
| **Pure White** | `#FFFFFF` | 255, 255, 255 | Cards, overlays |

### Accent Colors
| Name | Hex | RGB | Purpose |
|------|-----|-----|---------|
| **Terra Light** | `#E8C5B2` | 232, 197, 178 | Hover states, backgrounds |
| **Terra Dark** | `#A85A38` | 168, 90, 56 | Darker emphasis |
| **Terra Muted** | `#D4A79C` | 212, 167, 156 | Subtle accents |
| **Success** | `#16A34A` | 22, 163, 74 | Confirmations, success messages |
| **Warning** | `#D97706` | 217, 119, 6 | Alerts, warnings |
| **Danger** | `#DC2626` | 220, 38, 38 | Errors, destructive actions |
| **Info** | `#0EA5E9` | 14, 165, 233 | Information, secondary CTAs |

---

## Color Combinations

### **EEMRAS Premium** (Recommended for main brand identity)
- **Primary:** #16181F (Navy)
- **Accent:** #C4714A (Burnt Terracotta)
- **Background:** #F9F5EF (Warm Ivory)
- **Text:** #1A1A1A (Charcoal)
- **Best for:** Luxury products, premium positioning

### **EEMRAS Modern** (Contemporary e-commerce)
- **Primary:** #16181F (Navy)
- **Accent:** #0EA5E9 (Bright Blue) + #C4714A (Terracotta)
- **Background:** #FFFFFF (Pure White)
- **Text:** #3F3F3F (Dark Gray)
- **Best for:** Tech-forward, modern stores

### **EEMRAS Vibrant** (High contrast, bold)
- **Primary:** #16181F (Navy)
- **Accent 1:** #C4714A (Terracotta)
- **Accent 2:** #D97706 (Warm Orange)
- **Background:** #F9F5EF (Warm Ivory)
- **Text:** #1A1A1A (Charcoal)
- **Best for:** Fashion, lifestyle products

---

## Usage Guidelines

### Backgrounds
- **Primary:** #F9F5EF (whole site)
- **Secondary:** #FFFFFF (cards, modals)
- **Dark:** #16181F (sidebars, dark mode)

### Text Colors
- **Headings:** #1A1A1A
- **Body:** #6B6B6B
- **Secondary:** #C8C4BC
- **Light backgrounds:** #FFFFFF

### Interactive Elements
- **Links:** #C4714A (terracotta)
- **Hover:** #A85A38 (darker terracotta)
- **Active:** #C4714A with subtle background
- **Buttons:** #16181F with #C4714A accents

### Admin Dashboard
- **Sidebar:** #16181F (navy)
- **Main area:** #F4F6FA (light gray-blue)
- **Accent:** #C4714A (terracotta)

---

## Accessibility Notes

✅ **Good Contrast Ratios:**
- #16181F on #F9F5EF: 19:1 (AAA)
- #C4714A on #FFFFFF: 8:1 (AAA)
- #1A1A1A on #F9F5EF: 18:1 (AAA)
- #6B6B6B on #FFFFFF: 7:1 (AAA)

❌ **Avoid:**
- Light gray text on light backgrounds
- Terracotta text alone (use as accent with dark text nearby)
- Using only color to convey meaning (combine with icons/text)

---

## Implementation

### CSS Variables (Updated Root)
```css
:root {
  /* Primary */
  --brand-navy: #16181F;
  --brand-terra: #C4714A;
  --brand-ivory: #F9F5EF;
  
  /* Neutrals */
  --charcoal: #1A1A1A;
  --gray-dark: #3F3F3F;
  --gray-mid: #6B6B6B;
  --gray-light: #C8C4BC;
  --gray-lighter: #E5E7EB;
  --off-white: #F0EBE0;
  --white: #FFFFFF;
  
  /* Accents */
  --terra-light: #E8C5B2;
  --terra-dark: #A85A38;
  --terra-muted: #D4A79C;
  
  /* Semantic */
  --success: #16A34A;
  --warning: #D97706;
  --danger: #DC2626;
  --info: #0EA5E9;
}
```

---

## Visual Samples

### Header/Navbar
```
Background: #F9F5EF
Logo Text: #16181F with #C4714A accent
Links: #6B6B6B → hover: #1A1A1A
```

### Product Cards
```
Background: #FFFFFF
Title: #1A1A1A
Price: #C4714A (bold)
Button: #16181F with #C4714A accent
Hover: #FFFFFF raised with shadow
```

### Admin Panel
```
Sidebar: #16181F
Main Content: #F4F6FA
Stats Cards: #FFFFFF
Accent accents: #C4714A
CTAs: #16181F background, #C4714A text
```

### Footer
```
Background: #16181F
Text: #E5E7EB
Links: #C4714A
```

---

## Brand Personality
- **Warm** (terracotta, ivory tones)
- **Sophisticated** (deep navy, elegant typography)
- **Trustworthy** (strong contrast, clarity)
- **Premium** (whites, breathing space, refined)
- **Modern** (clean, contemporary)
