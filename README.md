# Grand Occasion

A premium event booking and management platform for banquet halls and event venues.

## Features

- 🎪 Browse and book elegant banquet halls
- 📅 Real-time availability calendar
- 📄 Document upload and verification
- 💳 Integrated payment processing
- 👥 Multi-tier admin approval workflow
- 📊 Comprehensive booking management dashboard
- 🔐 Secure authentication with role-based access

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd elegance-events-hub

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── admin/     # Admin-specific components
│   ├── booking/   # Booking flow components
│   ├── customer/  # Customer dashboard components
│   └── ui/        # shadcn/ui components
├── contexts/      # React context providers
├── hooks/         # Custom React hooks
├── integrations/  # Supabase integration
├── lib/           # Utilities and type definitions
└── pages/         # Route pages
```

## Admin Roles

- **Admin1**: Document verification
- **Admin2**: Availability checking and payment management
- **Admin3**: Final booking approvals
- **Super Admin**: Full system access and management

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Deployment

This project can be deployed to any static hosting service:

- Vercel
- Netlify
- AWS Amplify
- Azure Static Web Apps

## License

All rights reserved.
