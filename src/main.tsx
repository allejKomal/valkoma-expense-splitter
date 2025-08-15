import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BudgetProvider } from './context/budget-context.tsx'
import { BrowserRouter as Router } from 'react-router-dom'; // Add BrowserRouter here
import { Toaster } from './components/ui/sonner.tsx';


createRoot(document.getElementById('root')!).render(
  <BudgetProvider>
    <Router>
      <App />
    </Router>
    <Toaster className="!z-[100] !bg-white" />
  </BudgetProvider>
)
