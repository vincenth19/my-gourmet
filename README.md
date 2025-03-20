# MyGourmet - Luxury Private Chef Service

MyGourmet is a premium platform connecting high-net-worth individuals with professional chefs for personalized fine dining experiences in the comfort of their own homes.

![MyGourmet Preview](https://images.unsplash.com/photo-1414541944151-2f3ec1cfd87d?q=80&w=2673&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## Features

- **User Authentication**: Secure login/signup system with role-based access (Chef/Customer)
- **Chef Profile Management**: Chefs can create and manage their profiles and dish offerings
- **Dish Management**: Chefs can add, edit, and delete dishes with images and dietary tags
- **Profile Customization**: Users can upload profile pictures and set dietary preferences
- **Elegant UI**: Luxury design with serif headings and a refined navy blue color scheme

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS 4.0
- **Styling**: Custom luxury design system with Domine (serif) and Montserrat (sans-serif) fonts
- **Backend**: Supabase (Authentication, Database, Storage)
- **Routing**: React Router 7
- **State Management**: React Context API
- **Image Upload**: React Dropzone with Supabase Storage

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account and project

## Getting Started

### 1. Clone the repository

```bash
git clone https://your-repository-url/my-gourmet.git
cd my-gourmet
```

### 2. Install dependencies

```bash
npm install
# or
yarn
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration files located in the `supabase/migrations` directory
3. Create required storage buckets:
   - `dish_images` - For storing chef dish images
   - `profile_avatars` - For storing user profile images

### 4. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## Project Structure

```
my-gourmet/
├── src/                # Source files
│   ├── components/     # Reusable React components
│   ├── contexts/       # React context providers
│   ├── layouts/        # Page layout components
│   ├── lib/            # Utility functions and libraries
│   ├── pages/          # Page components
│   │   └── chef/       # Chef-specific pages
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
└── supabase/           # Supabase configuration and migrations
    └── migrations/     # Database migration files
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production version
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality

## Deployment

To deploy the application to production:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the built files from the `dist` directory to your hosting provider of choice.

3. Ensure your Supabase project is properly configured for production use.

## License

[MIT License](LICENSE)

## Acknowledgments

- Images from [Unsplash](https://unsplash.com/)
- Icons from [Lucide](https://lucide.dev/)
- Fonts from [Google Fonts](https://fonts.google.com/)
