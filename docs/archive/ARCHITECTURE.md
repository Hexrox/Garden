# 🏗️ Garden App - Szczegółowa Architektura UI/UX

**Version:** 3.0
**Date:** 2025-11-06
**Author:** Claude AI (Architecture Design)

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Design System](#2-design-system)
3. [Component Architecture](#3-component-architecture)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Feature Modules](#5-feature-modules)
6. [UI/UX Patterns](#6-uiux-patterns)
7. [Performance Strategy](#7-performance-strategy)
8. [Accessibility](#8-accessibility)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. SYSTEM OVERVIEW

### 1.1 Architecture Philosophy

**Zasady projektowe:**
- 🎯 **Mobile-First** - projektujemy dla mobile, rozszerzamy dla desktop
- 🧩 **Component-Driven** - wszystko jest komponentem, komponenty są reużywalne
- 🎨 **Design System First** - spójność wizualna przez tokens
- ⚡ **Performance-Focused** - lazy loading, code splitting, optimistic UI
- ♿ **Accessible** - WCAG 2.1 AA compliance

### 1.2 Technology Stack

```
Frontend:
├── React 18 (concurrent features)
├── React Router v6 (routing)
├── TailwindCSS (styling)
├── Lucide React (icons)
├── Framer Motion (animations)
├── @dnd-kit (drag & drop)
├── React Query (data fetching & caching)
└── Zustand (state management)

Backend:
├── Express.js
├── SQLite (production: PostgreSQL)
└── JWT authentication
```

### 1.3 Application Structure

```
garden-app/
├── frontend/
│   ├── src/
│   │   ├── app/                    # App-level configuration
│   │   │   ├── App.js
│   │   │   ├── Routes.js
│   │   │   └── providers/          # Context providers
│   │   │
│   │   ├── features/               # Feature modules (new!)
│   │   │   ├── garden-layout/      # Visual garden builder
│   │   │   ├── companion-planting/ # Companion system
│   │   │   ├── crop-rotation/      # Rotation warnings
│   │   │   ├── photo-timeline/     # Photo gallery
│   │   │   └── growth-tracking/    # Progress bars
│   │   │
│   │   ├── components/             # Shared components
│   │   │   ├── ui/                 # Base UI components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   └── ProgressBar/
│   │   │   ├── layout/             # Layout components
│   │   │   │   ├── Layout.js
│   │   │   │   ├── Header.js
│   │   │   │   ├── BottomNav.js
│   │   │   │   └── Sidebar.js
│   │   │   └── domain/             # Domain-specific
│   │   │       ├── PlantCard/
│   │   │       ├── BedCard/
│   │   │       └── HarvestCard/
│   │   │
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API services
│   │   ├── utils/                  # Utility functions
│   │   ├── styles/                 # Global styles
│   │   │   ├── design-tokens.js    # Design system tokens
│   │   │   └── theme.js            # Theme configuration
│   │   └── assets/                 # Static assets
│   │       ├── icons/
│   │       ├── images/
│   │       └── illustrations/
│   │
│   └── public/
│
└── backend/
    ├── routes/
    ├── services/
    ├── middleware/
    ├── utils/
    └── data/                       # Reference data
        ├── companion_plants.json   # Companion relationships
        ├── crop_families.json      # Plant families for rotation
        └── plant_icons.json        # Icon mappings
```

---

## 2. DESIGN SYSTEM

### 2.1 Design Tokens

**Lokalizacja:** `frontend/src/styles/design-tokens.js`

```javascript
export const tokens = {
  // Colors - Semantic naming
  colors: {
    // Brand
    brand: {
      primary: '#10B981',      // Green-500
      primaryHover: '#059669',  // Green-600
      primaryLight: '#D1FAE5',  // Green-100
      secondary: '#3B82F6',     // Blue-500
    },

    // Status colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // Plant-related
    plant: {
      seedling: '#86EFAC',      // Light green
      growing: '#10B981',       // Green
      mature: '#059669',        // Dark green
      ready: '#FBBF24',         // Amber
      harvested: '#8B5CF6',     // Purple
    },

    // Companion planting
    companion: {
      good: '#10B981',          // Green
      neutral: '#6B7280',       // Gray
      bad: '#EF4444',           // Red
    },

    // Neutral scale
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'Fira Code, monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing (8px base)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    full: '9999px',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
};
```

### 2.2 Component Design Patterns

#### Pattern 1: Card-Based Layout
```javascript
// Standard card component
<Card>
  <CardHeader>
    <CardTitle icon={<Sprout />}>Tytuł</CardTitle>
    <CardAction>Akcja</CardAction>
  </CardHeader>
  <CardContent>
    Zawartość
  </CardContent>
  <CardFooter>
    Stopka
  </CardFooter>
</Card>
```

#### Pattern 2: Status Badges
```javascript
<Badge variant="success">Gotowe</Badge>
<Badge variant="warning">Za 3 dni</Badge>
<Badge variant="error">Spóźnione</Badge>
```

#### Pattern 3: Icon + Text
```javascript
<IconText icon={<Sprout />} text="Pomidor" />
```

---

## 3. COMPONENT ARCHITECTURE

### 3.1 Component Hierarchy

```
App
├── Providers (Auth, Theme, Query)
│   └── Router
│       ├── PublicLayout
│       │   ├── Login
│       │   └── Register
│       │
│       └── PrivateLayout
│           ├── Header
│           │   ├── Logo
│           │   ├── Navigation (desktop)
│           │   └── UserMenu
│           │       ├── DarkModeToggle
│           │       └── LogoutButton
│           │
│           ├── Main Content Area
│           │   └── [Page Component]
│           │
│           └── BottomNav (mobile)
```

### 3.2 Base UI Components

**Lokalizacja:** `frontend/src/components/ui/`

#### Button Component
```javascript
// ui/Button/Button.js
export const Button = ({
  variant = 'primary',    // primary, secondary, ghost, danger
  size = 'md',            // sm, md, lg
  icon,
  children,
  loading,
  ...props
}) => {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
      `}
      disabled={loading}
      {...props}
    >
      {loading && <Loader className="animate-spin" size={16} />}
      {icon && !loading && icon}
      {children}
    </button>
  );
};
```

#### Card Component
```javascript
// ui/Card/Card.js
export const Card = ({ children, className, hover = false }) => (
  <div className={`
    bg-white dark:bg-gray-800
    rounded-xl shadow-md
    transition-all duration-300
    ${hover ? 'hover:shadow-lg hover:-translate-y-1' : ''}
    ${className}
  `}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }) => (
  <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ icon, children }) => (
  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
    {icon}
    {children}
  </h3>
);

export const CardContent = ({ children, className }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className }) => (
  <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);
```

#### ProgressBar Component
```javascript
// ui/ProgressBar/ProgressBar.js
export const ProgressBar = ({
  value,          // 0-100
  max = 100,
  label,
  showPercentage = true,
  variant = 'primary',
  size = 'md',
  animated = true,
}) => {
  const percentage = (value / max) * 100;

  const variants = {
    primary: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={`
        w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
        ${sizes[size]}
      `}>
        <div
          className={`
            ${variants[variant]} ${sizes[size]} rounded-full
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
```

#### Badge Component
```javascript
// ui/Badge/Badge.js
export const Badge = ({
  variant = 'default',
  size = 'md',
  icon,
  children
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`
      inline-flex items-center gap-1
      font-medium rounded-full border
      ${variants[variant]}
      ${sizes[size]}
    `}>
      {icon}
      {children}
    </span>
  );
};
```

---

## 4. DATA FLOW ARCHITECTURE

### 4.1 State Management Strategy

```
┌─────────────────────────────────────────────────────┐
│                   APPLICATION STATE                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Context    │  │ React Query  │  │  Zustand  │ │
│  │   (Auth,     │  │  (Server     │  │  (UI      │ │
│  │    Theme)    │  │   State)     │  │  State)   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**State Distribution:**

1. **Context API** - Global app state (Auth, Theme)
   - User authentication
   - Dark mode preference
   - Locale/i18n

2. **React Query** - Server state & caching
   - API data fetching
   - Cache management
   - Background refetching
   - Optimistic updates

3. **Zustand** - Client UI state
   - Modal open/close
   - Sidebar expand/collapse
   - Selected items
   - Form state (complex forms)

### 4.2 Data Flow Example: Adding a Bed

```
User Action → Component → React Query → API → Database
     ↓                                          ↓
  Optimistic Update                        Response
     ↓                                          ↓
  UI Updates Immediately                   Cache Updated
     ↓                                          ↓
  (If error: Rollback)                    UI Re-renders
```

### 4.3 API Service Layer

**Lokalizacja:** `frontend/src/services/`

```javascript
// services/api.js - Base API client
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

```javascript
// services/plots.service.js
import api from './api';

export const plotsService = {
  getAll: () => api.get('/api/plots'),

  getById: (id) => api.get(`/api/plots/${id}`),

  getDetails: (id) => api.get(`/api/plots/${id}/details`),

  create: (data) => api.post('/api/plots', data),

  update: (id, data) => api.put(`/api/plots/${id}`, data),

  delete: (id) => api.delete(`/api/plots/${id}`),

  // Beds
  getBeds: (plotId) => api.get(`/api/plots/${plotId}/beds`),

  createBed: (plotId, data) => api.post(`/api/plots/${plotId}/beds`, data),
};
```

### 4.4 React Query Hooks

```javascript
// hooks/usePlots.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plotsService } from '../services/plots.service';

export const usePlots = () => {
  return useQuery({
    queryKey: ['plots'],
    queryFn: () => plotsService.getAll(),
    select: (response) => response.data,
  });
};

export const usePlotDetails = (id) => {
  return useQuery({
    queryKey: ['plots', id],
    queryFn: () => plotsService.getDetails(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

export const useCreateBed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plotId, data }) => plotsService.createBed(plotId, data),

    // Optimistic update
    onMutate: async ({ plotId, data }) => {
      await queryClient.cancelQueries(['plots', plotId]);

      const previousPlot = queryClient.getQueryData(['plots', plotId]);

      queryClient.setQueryData(['plots', plotId], (old) => ({
        ...old,
        beds: [...(old.beds || []), { ...data, id: 'temp-' + Date.now() }],
      }));

      return { previousPlot };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['plots', variables.plotId], context.previousPlot);
    },

    // Refetch on success
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['plots', variables.plotId]);
    },
  });
};
```

---

## 5. FEATURE MODULES

### 5.1 Garden Layout Builder Module

**Lokalizacja:** `frontend/src/features/garden-layout/`

```
garden-layout/
├── components/
│   ├── GardenGrid.js           # Main grid component
│   ├── BedCell.js              # Individual bed cell
│   ├── PlantIcon.js            # Plant icon with name
│   ├── GridToolbar.js          # Toolbar (grid size, snap, etc)
│   └── BedDetailsPanel.js      # Side panel with bed info
├── hooks/
│   ├── useGardenLayout.js      # Layout state management
│   ├── useDragAndDrop.js       # DnD logic
│   └── useGridCalculations.js  # Grid math
├── utils/
│   ├── gridHelpers.js          # Grid calculations
│   └── spacingValidator.js     # Plant spacing validation
└── index.js
```

**Architecture:**

```
GardenLayoutBuilder
├── GridToolbar (grid size selector, view mode)
├── GardenGrid (main canvas)
│   └── BedCell[] (draggable cells)
│       ├── PlantIcon
│       ├── StatusBadge
│       └── QuickActions
└── BedDetailsPanel (selected bed info)
    ├── PlantInfo
    ├── CompanionSuggestions
    └── EditForm
```

### 5.2 Companion Planting Module

**Lokalizacja:** `frontend/src/features/companion-planting/`

```
companion-planting/
├── components/
│   ├── CompanionSuggestions.js     # Main suggestions card
│   ├── CompanionBadge.js           # Good/Bad/Neutral badge
│   ├── CompanionDetailModal.js     # Details about relationship
│   └── CompanionGrid.js            # Visual grid of companions
├── hooks/
│   ├── useCompanions.js            # Fetch companion data
│   └── useNearbyBeds.js            # Get beds nearby
├── data/
│   └── companions.json             # Companion relationships
└── utils/
    └── companionCalculator.js      # Logic for suggestions
```

**Data Structure:**

```json
{
  "tomato": {
    "good": [
      {
        "plant": "basil",
        "reason": "Odpędza szkodniki, poprawia smak",
        "distance": "30cm"
      },
      {
        "plant": "marigold",
        "reason": "Odpędza mszyce i stonki",
        "distance": "20cm"
      }
    ],
    "bad": [
      {
        "plant": "potato",
        "reason": "Przyciąga zarazy i szkodniki",
        "distance": "100cm minimum"
      }
    ]
  }
}
```

### 5.3 Growth Tracking Module

**Lokalizacja:** `frontend/src/features/growth-tracking/`

```
growth-tracking/
├── components/
│   ├── GrowthProgressBar.js        # Progress bar with milestones
│   ├── GrowthTimeline.js           # Timeline view
│   ├── MilestoneMarker.js          # Milestone indicator
│   └── GrowthChart.js              # Chart (recharts)
├── hooks/
│   ├── useGrowthProgress.js        # Calculate progress
│   └── useGrowthPrediction.js      # Predict harvest date
└── utils/
    └── growthCalculator.js         # Growth calculations
```

**Progress Calculation:**

```javascript
// utils/growthCalculator.js
export const calculateGrowthProgress = (plantedDate, daysToHarvest) => {
  const today = new Date();
  const planted = new Date(plantedDate);
  const daysElapsed = Math.floor((today - planted) / (1000 * 60 * 60 * 24));
  const progress = Math.min((daysElapsed / daysToHarvest) * 100, 100);

  const stages = [
    { name: 'Kiełkowanie', threshold: 10, icon: 'Seed' },
    { name: 'Wzrost', threshold: 40, icon: 'Sprout' },
    { name: 'Dojrzewanie', threshold: 70, icon: 'Leaf' },
    { name: 'Gotowe', threshold: 100, icon: 'CheckCircle' },
  ];

  const currentStage = stages.findLast(s => progress >= s.threshold) || stages[0];

  return {
    progress,
    daysElapsed,
    daysRemaining: Math.max(daysToHarvest - daysElapsed, 0),
    currentStage,
    isReady: progress >= 100,
  };
};
```

### 5.4 Photo Timeline Module

**Lokalizacja:** `frontend/src/features/photo-timeline/`

```
photo-timeline/
├── components/
│   ├── PhotoTimeline.js            # Main timeline
│   ├── PhotoCard.js                # Individual photo card
│   ├── PhotoUploadButton.js        # Upload button
│   ├── PhotoLightbox.js            # Fullscreen view
│   └── PhotoCompare.js             # Before/after comparison
├── hooks/
│   ├── usePhotos.js                # Fetch photos
│   ├── usePhotoUpload.js           # Upload logic
│   └── usePhotoTimeline.js         # Timeline calculations
└── utils/
    └── imageOptimizer.js           # Image compression
```

### 5.5 Crop Rotation Module

**Lokalizacja:** `frontend/src/features/crop-rotation/`

```
crop-rotation/
├── components/
│   ├── RotationWarning.js          # Warning banner
│   ├── RotationHistory.js          # History view
│   ├── RotationPlan.js             # Plan for next season
│   └── FamilyBadge.js              # Plant family badge
├── hooks/
│   ├── useRotationCheck.js         # Check for violations
│   └── useRotationHistory.js       # Fetch history
├── data/
│   └── plant-families.json         # Plant families
└── utils/
    └── rotationValidator.js        # Rotation logic
```

**Plant Families Data:**

```json
{
  "Solanaceae": {
    "name": "Psiankowate",
    "plants": ["tomato", "potato", "pepper", "eggplant"],
    "rotationYears": 3,
    "description": "Podatne na zarazę ziemniaczaną"
  },
  "Brassicaceae": {
    "name": "Kapustowate",
    "plants": ["cabbage", "broccoli", "cauliflower", "kale"],
    "rotationYears": 4,
    "description": "Podatne na kiłę kapusty"
  }
}
```

---

## 6. UI/UX PATTERNS

### 6.1 Loading States

```javascript
// Pattern 1: Skeleton
<Card>
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
</Card>

// Pattern 2: Spinner
<div className="flex items-center justify-center p-8">
  <Loader className="animate-spin text-green-600" size={32} />
</div>

// Pattern 3: Shimmer
<div className="relative overflow-hidden bg-gray-200 rounded">
  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent" />
</div>
```

### 6.2 Empty States

```javascript
// Pattern: Illustration + CTA
<EmptyState
  illustration={<GardenIllustration />}
  title="Twój ogród jest pusty"
  description="Zacznij od stworzenia pierwszego poletka"
  action={
    <Button onClick={onCreatePlot}>
      <Plus size={20} />
      Utwórz poletko
    </Button>
  }
/>
```

### 6.3 Error States

```javascript
// Pattern: Alert with retry
<Alert variant="error">
  <AlertCircle size={20} />
  <AlertTitle>Nie udało się załadować danych</AlertTitle>
  <AlertDescription>
    Sprawdź połączenie internetowe i spróbuj ponownie.
  </AlertDescription>
  <Button onClick={retry} variant="ghost" size="sm">
    Spróbuj ponownie
  </Button>
</Alert>
```

### 6.4 Micro-interactions

```javascript
// Pattern: Hover states
<Button className="
  transition-all duration-300
  hover:scale-105 hover:shadow-lg
  active:scale-95
">
  Zapisz
</Button>

// Pattern: Success feedback
const [saved, setSaved] = useState(false);

<Button onClick={async () => {
  await save();
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
}}>
  {saved ? <Check size={20} /> : <Save size={20} />}
  {saved ? 'Zapisano!' : 'Zapisz'}
</Button>
```

---

## 7. PERFORMANCE STRATEGY

### 7.1 Code Splitting

```javascript
// Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlotDetail = lazy(() => import('./pages/PlotDetail'));
const GardenLayoutBuilder = lazy(() => import('./features/garden-layout'));

// Routes.js
<Route path="/dashboard" element={
  <Suspense fallback={<PageLoader />}>
    <Dashboard />
  </Suspense>
} />
```

### 7.2 Image Optimization

```javascript
// Image component with lazy loading
<img
  src={photo.thumbnail}
  data-src={photo.fullsize}
  loading="lazy"
  className="w-full h-48 object-cover"
  onLoad={(e) => {
    // Progressive loading: load full size after thumbnail
    const img = new Image();
    img.src = e.target.dataset.src;
    img.onload = () => {
      e.target.src = img.src;
    };
  }}
/>
```

### 7.3 Memoization

```javascript
// Expensive calculations
const companionSuggestions = useMemo(() => {
  return calculateCompanions(selectedBed, nearbyBeds);
}, [selectedBed, nearbyBeds]);

// Component memoization
export const PlantCard = memo(({ plant }) => {
  return <Card>...</Card>;
}, (prev, next) => {
  // Only re-render if plant ID changes
  return prev.plant.id === next.plant.id;
});
```

---

## 8. ACCESSIBILITY

### 8.1 Keyboard Navigation

```javascript
// Focus management
const handleKeyDown = (e) => {
  switch (e.key) {
    case 'ArrowRight':
      focusNextBed();
      break;
    case 'ArrowLeft':
      focusPrevBed();
      break;
    case 'Enter':
    case ' ':
      selectBed();
      break;
    case 'Escape':
      closeBedDetails();
      break;
  }
};
```

### 8.2 ARIA Attributes

```javascript
<button
  aria-label="Dodaj nową grządkę"
  aria-pressed={isSelected}
  aria-expanded={isPanelOpen}
>
  <Plus size={20} />
</button>

<div role="status" aria-live="polite">
  {loading && 'Ładowanie...'}
  {error && 'Wystąpił błąd'}
</div>
```

### 8.3 Screen Reader Support

```javascript
// Announce changes
const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};

// Usage
announceToScreenReader('Grządka została dodana pomyślnie');
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- ✅ Setup design system
- ✅ Create base UI components
- ✅ Install lucide-react
- ✅ Update existing components with new design system

### Phase 2: Core Features (Week 3-5)
- ✅ Implement Growth Progress Bars
- ✅ Add Companion Planting system
- ✅ Create Photo Timeline
- ✅ Replace emoji with SVG icons

### Phase 3: Advanced Features (Week 6-8)
- ✅ Build Visual Garden Layout
- ✅ Add Crop Rotation warnings
- ✅ Implement drag & drop

### Phase 4: Polish & Optimization (Week 9-10)
- ✅ Add animations
- ✅ Optimize performance
- ✅ Accessibility improvements
- ✅ Testing & bug fixes

---

## 📚 REFERENCES

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Framer Motion](https://www.framer.com/motion/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Next Steps:** Implementacja TOP 5 Must-Have Features
