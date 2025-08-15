import './App.css'
import 'valkoma-package/dist/style.css';

import { ThemeProvider } from 'valkoma-package/hooks'
import { ModeToggle } from 'valkoma-package/design-system'
import GroupPage from './pages/page';
import { Route, Routes } from 'react-router-dom';
import AuthCallback from './pages/auth-callback';

function App() {
  return (
    <ThemeProvider showLoader={false}>
      <div className="fixed bottom-4 left-4 z-50">
        <ModeToggle />
      </div>
      <Routes>
        <Route path="/" element={<GroupPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App;
