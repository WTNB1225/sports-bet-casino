import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route} from 'react-router'
import './index.css'
import App from './App.tsx'
import Signup from './signup/index.tsx'
import SignIn from './signin/index.tsx'
import Logout from './logout/index.tsx'
import Sports from './sports/index.tsx'
import Sport from './sports/sport/index.tsx'
import League from './sports/sport/league/index.tsx'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex min-h-svh flex-1 items-center justify-center px-4 py-6 md:px-6">
            <div className="w-full max-w-6xl">
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/sports" element={<Sports />} />
                <Route path="/sports/:sportId" element={<Sport />} />
                <Route path="/sports/:sportId/:leagueId" element={<League />} />
                <Route path="/logout" element={<Logout />} />
              </Routes>
            </div>
          </main>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
