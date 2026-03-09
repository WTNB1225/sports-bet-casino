import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route} from 'react-router'
import './index.css'
import App from './App.tsx'
import Signup from './signup/index.tsx'
import SignIn from './signin/index.tsx'
import Logout from './logout/index.tsx'
import Sports from './sports/index.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </AuthProvider>
    </StrictMode>
  </BrowserRouter>
)
