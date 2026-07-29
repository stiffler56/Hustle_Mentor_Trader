# 02 - Frontend Guide: React & Components

## 🎨 Understanding the Frontend

This guide teaches you how the **React frontend** works and how to build components like a pro.

---

## 📚 React Fundamentals

### **What is React?**

React is a **JavaScript library for building UIs**. Instead of manually updating HTML, you:
1. Describe what the UI should look like
2. React handles updates automatically

### **Key Concept: Components**

Everything in React is a **component** - a reusable piece of UI.

```typescript
// Component is a function that returns JSX
function TradeCard({ trade }) {
  return (
    <div className="p-4 bg-white rounded">
      <h2>{trade.symbol}</h2>
      <p>Entry: {trade.entryPrice}</p>
    </div>
  );
}

// Use the component
<TradeCard trade={myTrade} />
```

**Key Points:**
- Components are functions
- They receive `props` (input data)
- They return JSX (HTML-like syntax)
- Components can be reused

---

## 🏗️ Component Structure

### **Anatomy of a Component**

```typescript
// 1. IMPORTS - Get dependencies
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. TYPES - Define what data looks like
interface TradeCardProps {
  trade: Trade;
  onSelect?: (tradeId: number) => void;
}

// 3. COMPONENT - The main function
export function TradeCard({ trade, onSelect }: TradeCardProps) {
  // 4. STATE - Data that can change
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 5. HANDLERS - Functions that respond to user actions
  const handleClick = () => {
    setIsExpanded(!isExpanded);
    onSelect?.(trade.id);
  };
  
  // 6. RENDER - Return JSX
  return (
    <div onClick={handleClick} className="p-4 bg-white rounded">
      <h2>{trade.symbol}</h2>
      {isExpanded && <p>{trade.notes}</p>}
      <Button>View Details</Button>
    </div>
  );
}

// 7. EXPORT - Make available to other files
export default TradeCard;
```

---

## 🎣 React Hooks

### **What are Hooks?**

Hooks are **functions that let you use React features**. They always start with `use`.

### **useState - Manage Component State**

**What it does:** Store data that can change

```typescript
// Declare state
const [count, setCount] = useState(0);

// Use state
console.log(count);  // Current value

// Update state
setCount(count + 1);  // Triggers re-render
```

**Real example from our project:**
```typescript
// ScreenshotUpload.tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [preview, setPreview] = useState<string | null>(null);
const [isUploading, setIsUploading] = useState(false);

// When user selects file
const handleFileSelect = (file: File) => {
  setSelectedFile(file);  // Store file
  setPreview(URL.createObjectURL(file));  // Show preview
};
```

**Key Points:**
- State is local to the component
- Updating state triggers re-render
- Use `const [value, setValue] = useState(initialValue)`

---

### **useEffect - Run Code at Specific Times**

**What it does:** Run code when component mounts, updates, or unmounts

```typescript
// Run once when component mounts
useEffect(() => {
  console.log("Component mounted!");
}, []);  // Empty dependency array = run once

// Run when dependency changes
useEffect(() => {
  console.log("Trade ID changed:", tradeId);
}, [tradeId]);  // Re-run when tradeId changes

// Cleanup when component unmounts
useEffect(() => {
  const handleResize = () => console.log("Resized");
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);  // Cleanup
  };
}, []);
```

**Real example from our project:**
```typescript
// TradeReplay.tsx - Fetch trade data when component loads
useEffect(() => {
  // This runs when component mounts
  // tRPC query automatically fetches data
}, [tradeId]);  // Re-run if tradeId changes
```

**Key Points:**
- Dependency array controls when it runs
- Empty array `[]` = run once on mount
- Return cleanup function to prevent memory leaks

---

### **useQuery & useMutation - Fetch Data from Backend**

**What they do:** Call backend procedures and manage loading/error states

```typescript
// useQuery - Fetch data
const { data, isLoading, error } = trpc.trades.list.useQuery();

// useMutation - Send data to backend
const createTrade = trpc.trades.create.useMutation({
  onSuccess: (data) => {
    console.log("Trade created:", data);
  },
  onError: (error) => {
    console.log("Error:", error.message);
  },
});

// Call the mutation
createTrade.mutate({ symbol: "EURUSD", ... });
```

**Real example from our project:**
```typescript
// TradeReplay.tsx
const { data: trade, isLoading, error } = trpc.trades.get.useQuery(
  { tradeId: tradeId || 0 },
  { enabled: !!tradeId }  // Only run if tradeId exists
);

const { data: screenshots } = trpc.screenshots.getByTrade.useQuery(
  { tradeId: tradeId || 0 },
  { enabled: !!tradeId }
);
```

**Key Points:**
- `data` = the response from backend
- `isLoading` = true while fetching
- `error` = error object if something failed
- `enabled` = conditionally run the query

---

## 🎨 Styling with Tailwind CSS

### **What is Tailwind?**

Tailwind is a **utility-first CSS framework**. Instead of writing CSS, you use class names.

### **Common Tailwind Classes**

```jsx
// Layout
<div className="flex gap-4">  {/* Flexbox with gap */}
  <div className="w-1/2">    {/* 50% width */}
    Content
  </div>
</div>

// Colors
<div className="bg-slate-900 text-white">  {/* Dark background, white text */}
  Content
</div>

// Spacing
<div className="p-4 m-2">  {/* Padding 4, margin 2 */}
  Content
</div>

// Sizing
<button className="w-full h-12 rounded-lg">  {/* Full width, 12px height, rounded */}
  Click me
</button>

// Responsive
<div className="text-sm md:text-base lg:text-lg">  {/* Different sizes on different screens */}
  Content
</div>

// Hover/Active states
<button className="bg-blue-500 hover:bg-blue-600 active:scale-95">
  Click me
</button>
```

**Real example from our project:**
```typescript
// ScreenshotComparison.tsx
<div
  className={`relative w-full overflow-hidden bg-slate-900 rounded-lg ${className}`}
  style={{ aspectRatio: '16 / 9' }}
>
  <img
    src={afterImage}
    alt={afterLabel}
    className="absolute inset-0 w-full h-full object-cover"
  />
</div>
```

---

## 🧩 Using UI Components (shadcn/ui)

### **What are UI Components?**

Pre-built, professional components that you can copy into your project.

```typescript
// Import component
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Use component
<Button onClick={handleClick}>Click me</Button>

<Card>
  <CardHeader>
    <CardTitle>Trade Details</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

**Available components in our project:**
- `Button` - Clickable buttons
- `Card` - Container with styling
- `Dialog` - Modal popup
- `Tabs` - Tabbed interface
- `Badge` - Small labels
- `Skeleton` - Loading placeholder
- `Alert` - Alert messages
- `Input` - Text input field
- `Textarea` - Multi-line text
- `Select` - Dropdown menu

**Real example from our project:**
```typescript
// TradeReplay.tsx
<Card className="bg-slate-900 border-slate-800">
  <CardHeader>
    <CardTitle>Screenshot Comparison</CardTitle>
    <CardDescription>Compare your chart before and after</CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="comparison">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="comparison">Comparison</TabsTrigger>
        <TabsTrigger value="before">Before</TabsTrigger>
        <TabsTrigger value="after">After</TabsTrigger>
      </TabsList>
      {/* Tab content */}
    </Tabs>
  </CardContent>
</Card>
```

---

## 📁 Component Organization

### **File Structure**

```
src/
├── pages/              ← Full page components
│   ├── TradeReplay.tsx
│   ├── Home.tsx
│   └── NotFound.tsx
├── components/         ← Reusable components
│   ├── ScreenshotComparison.tsx
│   ├── ScreenshotUpload.tsx
│   ├── DashboardLayout.tsx
│   └── ui/            ← shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── hooks/             ← Custom React hooks
│   └── useAuth.ts
├── contexts/          ← React Context for global state
│   └── ThemeContext.tsx
└── lib/               ← Utility functions
    ├── trpc.ts        ← tRPC client setup
    └── utils.ts
```

### **Component Naming**

- **Pages:** `TradeReplay.tsx` - Full pages
- **Components:** `ScreenshotUpload.tsx` - Reusable pieces
- **Hooks:** `useAuth.ts` - Custom hooks
- **Utils:** `calculatePnL.ts` - Helper functions

---

## 🔄 Props & Composition

### **Props - Pass Data to Components**

```typescript
// Define what props a component accepts
interface ScreenshotComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;  // Optional prop
  afterLabel?: string;
  className?: string;
}

// Component receives props
function ScreenshotComparison({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',  // Default value
  afterLabel = 'After',
  className = '',
}: ScreenshotComparisonProps) {
  return <div className={className}>...</div>;
}

// Use component with props
<ScreenshotComparison
  beforeImage={url1}
  afterImage={url2}
  beforeLabel="Entry"
  afterLabel="Exit"
  className="mt-4"
/>
```

**Key Points:**
- Props are read-only
- Use TypeScript interfaces to define prop types
- Provide default values for optional props
- Props flow down from parent to child

---

### **Composition - Build Complex UIs**

```typescript
// Small, focused components
function TradeHeader({ trade }) {
  return <h1>{trade.symbol}</h1>;
}

function TradeStats({ trade }) {
  return <div>{trade.pnl}</div>;
}

function TradeNotes({ trade }) {
  return <p>{trade.notes}</p>;
}

// Compose them together
function TradeCard({ trade }) {
  return (
    <Card>
      <TradeHeader trade={trade} />
      <TradeStats trade={trade} />
      <TradeNotes trade={trade} />
    </Card>
  );
}
```

**Benefits:**
- Each component has one responsibility
- Easy to test
- Easy to reuse
- Easy to maintain

---

## 🎯 Real Example: ScreenshotUpload Component

Let's break down the actual component from our project:

```typescript
// 1. IMPORTS
import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

// 2. TYPES
interface ScreenshotUploadProps {
  tradeId: number;
  screenshotType: 'BEFORE' | 'AFTER';
  onUploadSuccess?: (url: string, storageKey: string) => void;
  onUploadError?: (error: string) => void;
  onUploadComplete?: () => void;
  className?: string;
}

// 3. COMPONENT
export const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({
  tradeId,
  screenshotType,
  onUploadSuccess,
  onUploadError,
  onUploadComplete,
  className = '',
}) => {
  // 4. STATE
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 5. tRPC MUTATION
  const createScreenshot = trpc.screenshots.create.useMutation({
    onSuccess: (data) => {
      toast.success(`${screenshotType} screenshot uploaded!`);
      onUploadSuccess?.(data.storageUrl, data.storageKey);
      onUploadComplete?.();
      handleClear();
    },
    onError: (error) => {
      toast.error(error.message);
      onUploadError?.(error.message);
    },
  });

  // 6. HANDLERS
  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const storageKey = `trades/${tradeId}/${screenshotType.toLowerCase()}-${Date.now()}`;
      const mockStorageUrl = `/manus-storage/${storageKey}`;

      // Call backend
      await createScreenshot.mutateAsync({
        tradeId,
        screenshotType,
        storageUrl: mockStorageUrl,
        storageKey,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 7. RENDER
  return (
    <div className={className}>
      {!preview ? (
        // Show upload area
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-400 rounded-lg p-8"
        >
          <Upload className="w-12 h-12 mx-auto mb-3" />
          <p>Drag and drop or click to select</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        // Show preview and upload button
        <div>
          <img src={preview} alt="Preview" className="w-full rounded" />
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-4"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
};
```

**Key Lessons:**
1. Component has clear responsibility: upload screenshots
2. Props define what data it needs
3. State manages file selection and upload progress
4. Handlers respond to user actions
5. tRPC mutation communicates with backend
6. Conditional rendering shows different UI based on state
7. Error handling with toast messages

---

## 🧪 Testing Components

### **Why Test?**

Testing ensures your components work correctly and don't break when you make changes.

### **Simple Component Test**

```typescript
// ScreenshotComparison.test.tsx
import { render, screen } from '@testing-library/react';
import { ScreenshotComparison } from './ScreenshotComparison';

describe('ScreenshotComparison', () => {
  it('renders before and after labels', () => {
    render(
      <ScreenshotComparison
        beforeImage="before.jpg"
        afterImage="after.jpg"
        beforeLabel="Before"
        afterLabel="After"
      />
    );

    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('renders both images', () => {
    const { container } = render(
      <ScreenshotComparison
        beforeImage="before.jpg"
        afterImage="after.jpg"
      />
    );

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
  });
});
```

---

## 📚 Best Practices

### **1. Keep Components Small**
```typescript
// ❌ Bad: Component does too much
function TradeCard({ trade }) {
  // Handles display, upload, comparison, analytics...
}

// ✅ Good: Component has one responsibility
function TradeCard({ trade }) {
  return (
    <div>
      <TradeHeader trade={trade} />
      <TradeStats trade={trade} />
    </div>
  );
}
```

### **2. Use TypeScript**
```typescript
// ❌ Bad: No types
function TradeCard(props) {
  return <div>{props.trade.symbol}</div>;
}

// ✅ Good: Full types
interface TradeCardProps {
  trade: Trade;
}

function TradeCard({ trade }: TradeCardProps) {
  return <div>{trade.symbol}</div>;
}
```

### **3. Avoid Prop Drilling**
```typescript
// ❌ Bad: Passing props through many levels
<Parent user={user} />
  <Child user={user} />
    <GrandChild user={user} />

// ✅ Good: Use Context for global state<UserProv
(Content truncated due to size limit. Use line ranges to read remaining content)
 
 ## **4. feedback **
 // write your idea //
  samee wacaal celin marka dhamayso 
  this last week iam making nonsense commit for my github 
  last week of the motn 
  i will maker commit since i found ai 
