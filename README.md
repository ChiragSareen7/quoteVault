# QuoteVault

A production-grade quote collection and discovery application built with Next.js, React, and Supabase. QuoteVault allows users to discover, save, organize, and share inspiring quotes across multiple categories.

## 🎯 Features

### Core Functionality
- **Quote Browsing**: Explore 100+ quotes across 5 categories (Motivation, Love, Success, Wisdom, Humor)
- **Search & Filter**: Search by quote text or author, filter by category
- **Daily Quote**: Deterministic quote-of-the-day system (same quote for everyone per day)
- **Favorites**: Save and manage your favorite quotes with cloud sync
- **Collections**: Create custom collections to organize quotes
- **Sharing**: Share quotes via system share or generate quote card images
- **Personalization**: Dark/light mode, accent colors, font size adjustments

### Security & Architecture
- **Row Level Security (RLS)**: All database tables protected with RLS policies
- **Server/Client Separation**: Proper Supabase client/server architecture
- **Protected Routes**: Middleware-based authentication and route protection
- **Environment Variables**: No hardcoded secrets or configuration
- **Type Safety**: Full TypeScript coverage with database types

### User Experience
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Optimistic Updates**: Instant UI feedback with rollback on errors
- **Offline Support**: React Query caching for offline access
- **Loading States**: Graceful loading, error, and empty states
- **Smooth Animations**: Micro-interactions and transitions

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- A Supabase account and project ([supabase.com](https://supabase.com))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   You can find these values in your Supabase project dashboard under Settings > API.

3. **Set up the database:**
   
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run the schema file: `supabase/schema.sql`
   - Run the seed file: `supabase/seed.sql` (optional, adds 100+ quotes)

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
bear/
├── app/                    # Next.js App Router pages
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── reset-password/
│   ├── profile/           # User profile & settings
│   ├── favorites/         # Favorites page
│   ├── collections/       # Collections pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── nav.tsx           # Navigation bar
│   ├── quote-card.tsx    # Quote display component
│   └── ...
├── lib/
│   ├── actions/          # Server actions
│   │   ├── auth.ts       # Authentication
│   │   ├── quotes.ts     # Quote operations
│   │   ├── favorites.ts  # Favorites management
│   │   ├── collections.ts # Collections management
│   │   └── profile.ts    # Profile management
│   ├── hooks/            # React hooks
│   ├── providers/        # Context providers
│   ├── supabase/         # Supabase clients
│   └── constants.ts      # App constants
├── supabase/
│   ├── schema.sql        # Database schema with RLS
│   └── seed.sql         # Seed data (100+ quotes)
├── types/
│   └── database.ts      # TypeScript database types
└── middleware.ts        # Next.js middleware for auth
```

## 🗄️ Database Schema

### Tables

- **quotes**: Public quote database (read-only for users)
- **profiles**: User profile information and settings
- **favorites**: User-favorited quotes (one per user per quote)
- **collections**: User-created quote collections
- **collection_quotes**: Junction table for quotes in collections

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:
- Users can only access their own data (favorites, collections, profiles)
- Quotes are publicly readable but not writable by users
- All write operations require authentication
- Ownership is verified on every operation

## 🔐 Security Decisions

### Authentication
- **Supabase Auth**: Email/password authentication with secure session management
- **Middleware Protection**: Protected routes enforced at the middleware level
- **Server Actions**: All mutations use server actions (no exposed API routes)
- **Session Refresh**: Automatic session refresh on each request

### Data Access
- **RLS Policies**: Database-level security, not just application-level
- **Client/Server Separation**: Different Supabase clients for browser vs server
- **Service Role Key**: Only used for admin operations, never exposed to client
- **Input Validation**: Server-side validation on all user inputs

### Best Practices
- No secrets in code (all via environment variables)
- Type-safe database operations
- Optimistic updates with error rollback
- Defensive error handling

## 🎨 UI/Theming

### Design System
- **shadcn/ui**: Accessible, customizable component library
- **Tailwind CSS**: Utility-first styling
- **CSS Variables**: Theme customization via CSS variables
- **Dark Mode**: System-aware dark/light mode toggle

### Customization
- **Accent Colors**: 5 color themes (blue, purple, green, orange, red)
- **Font Sizes**: Small, medium, large options
- **Theme Preferences**: Light, dark, or system default
- **Settings Sync**: Preferences saved to Supabase profile

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interactions
- Optimized for all screen sizes

## 🔄 State Management

### React Query (TanStack Query)
- **Server State**: All server data managed via React Query
- **Caching**: Intelligent caching with stale-while-revalidate
- **Optimistic Updates**: Instant UI feedback
- **Background Refetching**: Keeps data fresh automatically
- **Offline Support**: Cached data available offline

### Query Keys
Centralized query key management in `lib/constants.ts`:
- Quotes: `['quotes', ...]`
- Favorites: `['favorites', ...]`
- Collections: `['collections', ...]`
- Profile: `['profile', ...]`

## 📱 Features Deep Dive

### Daily Quote System
- **Deterministic Logic**: Same quote for everyone on the same day
- **Server-Side**: Selection happens on server, prevents manipulation
- **Date-Based Seed**: Uses current date as seed for selection
- **24-Hour Cache**: Quote cached for 24 hours (entire day)

### Quote Card Images
- **3 Templates**: Different background colors and styles
- **Canvas Generation**: Client-side image generation
- **Download Support**: Save generated images to device
- **Responsive**: Optimized for sharing on social media

### Collections
- **Custom Organization**: Users create their own collections
- **Quote Management**: Add/remove quotes from collections
- **Duplicate Prevention**: Database constraints prevent duplicates
- **Ownership**: RLS ensures users only access their collections

### Sharing
- **System Share API**: Native share dialog on supported devices
- **Clipboard Fallback**: Copy to clipboard if share API unavailable
- **Quote Cards**: Generate shareable quote images
- **Deep Linking**: Support for deep links to specific quotes

## 🛠️ Development Workflow

### AI-Assisted Development

This project was built with AI assistance (Claude/Cursor). Key principles:

1. **Incremental Development**: Features built step-by-step
2. **Type Safety**: TypeScript types generated from database schema
3. **Code Comments**: Explanatory comments for complex logic
4. **Security First**: Security considerations in every feature
5. **Production Ready**: Not a demo - built for real-world use

### Code Quality

- **ESLint**: Code linting with Next.js config
- **TypeScript**: Strict type checking
- **Error Boundaries**: Graceful error handling
- **Loading States**: All async operations show loading states
- **Empty States**: Helpful messages when no data

### Testing Considerations

While this project doesn't include automated tests, it's structured for easy testing:
- Server actions can be tested independently
- Components are modular and testable
- Database operations are isolated in actions
- Type safety reduces runtime errors

## 🚧 Known Limitations & Tradeoffs

### Widget Support
- **Web Limitations**: Native widgets not available on web
- **Documentation**: Widget logic documented but not implemented
- **Future**: Could be added for mobile apps (React Native)

### Notifications
- **Local Only**: Notification scheduling uses browser APIs
- **No Push**: No server-side push notifications
- **Browser Dependent**: Requires browser notification permissions

### Image Generation
- **Client-Side**: Quote card images generated in browser
- **Canvas API**: Requires modern browser support
- **No Server**: Images not stored on server (generated on-demand)

### Offline Support
- **Read-Only**: Can view cached quotes offline
- **No Write**: Cannot create favorites/collections offline
- **Sync on Reconnect**: Changes sync when connection restored

## 📚 Additional Resources

### Supabase
- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### React Query
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

### shadcn/ui
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Component Library](https://ui.shadcn.com/docs/components)

## 🤝 Contributing

This is a production application. When contributing:

1. Follow existing code patterns
2. Maintain type safety
3. Add RLS policies for new tables
4. Update this README for new features
5. Test thoroughly before submitting

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Backend powered by [Supabase](https://supabase.com)
- Icons from [Lucide](https://lucide.dev)

---

**Built with ❤️ for quote lovers everywhere**
