# Minecraft Dashboard

A modern web application for managing and monitoring your Minecraft servers. Built with React, TypeScript, and Supabase.

## Features

- 🖥️ **Server Management**
  - Add and remove Minecraft servers
  - Monitor server status (Online/Offline)
  - Track player count
  - View detailed server information
  - Real-time status updates

- 📊 **Dashboard Overview**
  - Total players online
  - Number of servers online
  - Maintenance status tracking
  - Issue monitoring

- 🔐 **User Authentication**
  - Secure login and signup
  - User-specific server lists
  - Protected routes

- 🎨 **Modern UI**
  - Clean and intuitive interface
  - Dark mode support
  - Responsive design
  - Real-time status indicators

## Tech Stack

- **Frontend**
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - Shadcn/ui Components

- **Backend**
  - Supabase (Authentication & Database)
  - Real-time updates

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MUX-ON-WINDOWS/minecraftdashboard.git
   cd minecraftdashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:8080](http://localhost:8080) in your browser.

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── integrations/  # External service integrations
├── utils/         # Utility functions
├── hooks/         # Custom React hooks
└── lib/           # Library configurations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend services
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
