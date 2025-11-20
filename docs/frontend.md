# Frontend Web App Documentation

## Overview

The web application is built with React, Vite, and TailwindCSS, featuring real-time job updates via Firestore and a handcrafted, non-AI-looking UI.

## Project Structure

```
apps/web/
├── src/
│   ├── components/           # UI presentation only
│   │   ├── header.tsx
│   │   ├── job-submit-form.tsx
│   │   ├── job-card.tsx
│   │   └── job-list.tsx
│   ├── hooks/                # Logic extraction only
│   │   ├── use-job-submission.ts
│   │   └── use-job-list.ts
│   ├── lib/                  # External clients only
│   │   ├── firebase.ts
│   │   └── api-client.ts
│   ├── pages/                # Route composition only
│   │   └── home-page.tsx
│   ├── styles/               # Global styles
│   │   └── index.css
│   ├── app.tsx               # App root
│   └── main.tsx              # Entry point
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── tsconfig.json
└── .env.example
```

## SRP Implementation

### Components (UI Only)

Each component handles **presentation only**, no business logic:

#### Header Component

```typescript
// header.tsx
// Responsibility: Display header UI only
export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">FluxImage</h1>
        <p className="text-primary-100">Real-time image processing</p>
      </div>
    </header>
  );
};
```

#### Job Submit Form Component

```typescript
// job-submit-form.tsx
// Responsibility: Render form UI only, logic in hook
export const JobSubmitForm = () => {
  const { url, setUrl, isSubmitting, error, handleSubmit } = useJobSubmission();

  return (
    <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Process Image'}
        </button>
      </form>
    </div>
  );
};
```

#### Job Card Component

```typescript
// job-card.tsx
// Responsibility: Display single job UI only
export const JobCard = ({ job }: JobCardProps) => {
  const getStatusColor = (status: JobStatus) => { /* ... */ };
  const getStatusIcon = (status: JobStatus) => { /* ... */ };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      {/* Job details, status badge, image preview */}
    </div>
  );
};
```

#### Job List Component

```typescript
// job-list.tsx
// Responsibility: Display job grid UI only, data from hook
export const JobList = () => {
  const { jobs, isLoading } = useJobList();

  if (isLoading) return <LoadingSpinner />;
  if (jobs.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => <JobCard key={job.id} job={job} />)}
    </div>
  );
};
```

### Hooks (Logic Only)

Each hook handles **one logical concern**:

#### useJobSubmission Hook

```typescript
// use-job-submission.ts
// Responsibility: Handle job submission logic only
export const useJobSubmission = () => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createJob(url);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { url, setUrl, isSubmitting, error, handleSubmit };
};
```

#### useJobList Hook

```typescript
// use-job-list.ts
// Responsibility: Firestore real-time subscription only
export const useJobList = () => {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(doc => doc.data() as JobResponse);
      setJobs(jobList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { jobs, isLoading };
};
```

### Lib (External Clients)

#### Firebase Client

```typescript
// firebase.ts
// Responsibility: Firebase initialization only
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
```

#### API Client

```typescript
// api-client.ts
// Responsibility: API calls only
const API_URL = import.meta.env.VITE_API_URL;

export const createJob = async (inputUrl: string) => {
  const response = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create job');
  }

  return response.json();
};
```

## Design System

### Color Palette

Custom TailwindCSS theme with professional colors:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
      },
    },
  },
}
```

### Typography

- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Usage**: Clean, modern, professional

### UI Components

#### Custom Shadows

```css
shadow-soft: 0 2px 15px -3px rgba(0, 0, 0, 0.07)
```

#### Gradients

```css
/* Header */
bg-gradient-to-r from-primary-600 to-primary-700

/* Background */
bg-gradient-to-br from-gray-50 to-gray-100
```

#### Transitions

All interactive elements use smooth transitions:

```css
transition-all duration-200
```

## Real-time Features

### Firestore Listener

Jobs update **instantly** without polling:

```typescript
onSnapshot(query, (snapshot) => {
  // Real-time updates pushed from Firestore
  const jobs = snapshot.docs.map(doc => doc.data());
  setJobs(jobs);
});
```

**Benefits:**
- No manual refresh needed
- Instant status updates
- Minimal bandwidth usage
- Automatic reconnection

## Environment Variables

```bash
VITE_API_URL=http://localhost:3000/api

# Firebase Web SDK
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Running the Web App

```bash
# Install dependencies
pnpm install

# Development mode
pnpm web:dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

## Features

### 1. Job Submission

- URL input with validation
- Real-time error feedback
- Disabled state during submission
- Clear form after success

### 2. Job Status Visualization

- Color-coded status badges:
  - **Pending**: Gray
  - **Processing**: Blue with spinner icon
  - **Completed**: Green with checkmark
  - **Failed**: Red with X icon

### 3. Image Preview

- Thumbnail preview for completed jobs
- Click to view full image in new tab
- Responsive image sizing

### 4. Responsive Design

- Mobile-first approach
- Grid layout: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- Touch-friendly interactions

## User Experience

### Creative, Non-AI Design

- **Handcrafted feel**: Soft shadows, gradients
- **Professional**: Not overly colorful or generic
- **Modern**: Clean spacing, rounded corners
- **Accessible**: Good contrast, readable fonts

### Loading States

- Spinner for initial load
- Disabled button during submission
- Skeleton states could be added

### Empty States

- Friendly message when no jobs exist
- Encourages user action

## Dependencies

- **react**: UI framework
- **react-dom**: DOM rendering
- **firebase**: Firestore real-time database
- **vite**: Build tool
- **tailwindcss**: Utility-first CSS
- **typescript**: Type safety
