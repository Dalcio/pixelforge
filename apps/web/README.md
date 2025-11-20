# PixelForge Frontend

A modern, accessible, and visually engaging image transformation web application.

## 🎨 Design Features

### Visual Design

- **Harmonious Color Palette**: Dark theme with vibrant accent colors
  - Primary: Purple gradient (#7C3AED - #C026D3)
  - Secondary: Cyan (#00D4FF)
  - Accent: Magenta (#E879F9)
  - Surface: Dark gray with subtle variations
- **Smooth Gradients & Animations**:

  - Glass morphism effects
  - Slide-in and fade-in animations
  - Hover effects with scale transforms
  - Loading states with subtle pulse animations
  - Shimmer effects for loading skeletons

- **Interactive Elements**:
  - Real-time image preview before submission
  - Debounced URL validation
  - Responsive hover states
  - Clear visual feedback for all actions
  - Status badges with icons and colors

### Accessibility (WCAG 2.1 AA Compliant)

- **Keyboard Navigation**:

  - All interactive elements are keyboard accessible
  - Visible focus indicators with custom ring styles
  - Proper tab order throughout the application

- **Screen Reader Support**:

  - Semantic HTML5 elements (`header`, `main`, `nav`, `article`, `footer`)
  - ARIA labels on all interactive elements
  - ARIA live regions for dynamic content updates
  - Proper heading hierarchy (h1-h3)

- **Visual Accessibility**:

  - High contrast ratios (>7:1 for normal text, >4.5:1 for large text)
  - Color is not the only means of conveying information
  - Status communicated through icons, text, and color
  - Scalable text and responsive design

- **Error Handling**:
  - Clear error messages with visual indicators
  - `aria-invalid` attributes on invalid inputs
  - `aria-describedby` for error associations
  - Multiple sensory channels for feedback

## 🏗️ Architecture

### Components

```
components/
├── AppHeader.tsx       # Sticky navigation header with branding
├── JobCard.tsx         # Individual job display with image previews
├── JobList.tsx         # Job list with empty/loading/error states
├── JobSubmitForm.tsx   # Form with real-time image preview
└── index.ts            # Component exports
```

### Hooks

```
hooks/
├── use-job-list.ts       # Manages job fetching and auto-refresh
├── use-job-submission.ts # Handles job submission with error states
├── use-image-preview.ts  # Real-time image URL validation & preview
└── index.ts              # Hook exports
```

### Key Features

1. **Real-time Image Preview**

   - Validates URLs before submission
   - Shows preview as user types (debounced)
   - Handles loading and error states gracefully

2. **Auto-refresh Job List**

   - Polls for updates every 5 seconds
   - Silent background updates
   - Manual refresh option

3. **Comprehensive Error Handling**

   - Network errors
   - Invalid URLs
   - Image loading failures
   - API errors

4. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: sm (640px), md (768px), lg (1024px)
   - Fluid typography and spacing

## 🚀 Usage

### Development

```bash
cd apps/web
pnpm dev
```

### Build

```bash
cd apps/web
pnpm build
```

### Preview Production Build

```bash
cd apps/web
pnpm preview
```

## 🎯 User Experience

### Job Submission Flow

1. User enters an image URL
2. Real-time preview loads (debounced)
3. Validation feedback shown
4. Submit button enabled when valid
5. Loading state during submission
6. Success message with auto-focus back to input
7. Job appears in list below

### Job Status Display

- **Pending**: Orange badge with clock icon
- **Processing**: Blue badge with spinning icon
- **Completed**: Green badge with checkmark + download button
- **Failed**: Red badge with error icon + error message

### Image Display

- Both input and output images shown with previews
- Loading states while images load
- Graceful error handling for failed image loads
- Hover effects on loaded images
- Full-resolution downloads for completed jobs

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `apps/web/` directory:

```env
# API Configuration
VITE_API_BASE=http://localhost:3000

# Firebase Configuration
# Get these values from Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Note**: Copy `.env.example` to `.env` and fill in your Firebase credentials.

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Navigate to **Project Settings** > **General**
4. Scroll to **Your apps** section
5. Click **Web app** icon to create/view web app configuration
6. Copy the configuration values to your `.env` file

**Security Note**: Never commit your `.env` file to version control. It's already listed in `.gitignore`.

### Tailwind Configuration

Custom color palette and utilities defined in `src/styles/index.css`

## 📦 Dependencies

- **React 18.2**: UI library
- **TypeScript 5.3**: Type safety
- **Vite 5.0**: Build tool
- **Tailwind CSS 3.4**: Styling framework
- **@fluximage/types**: Shared type definitions
- **@fluximage/utils**: Shared utilities

## 🎨 Design System

### Typography

- **Font**: System font stack with optimal readability
- **Sizes**: Responsive scaling from text-xs to text-4xl
- **Weights**: 400 (normal), 600 (semibold), 700 (bold)

### Spacing

- Consistent 4px base unit
- Spacing scale: 1-12 (4px - 48px)

### Border Radius

- Small: 0.5rem (8px)
- Medium: 0.75rem (12px)
- Large: 1rem (16px)
- Extra Large: 1.5rem (24px)

### Shadows

- Elevation levels for depth perception
- Colored shadows for primary actions
- Hover state shadow intensification

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 Code Quality

- Full TypeScript coverage
- No linting errors
- Semantic HTML
- Component-based architecture
- Custom hooks for logic separation
- Proper error boundaries

## 🔮 Future Enhancements

- Dark/light theme toggle
- Drag-and-drop file upload
- Batch processing
- Job history with filtering
- Advanced image transformation options
- User authentication
- Shareable job links
