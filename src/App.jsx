import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DocumentProvider } from './context/DocumentContext'
import AppLayout from './layout/AppLayout'
import DocumentPage from './pages/DocumentPage'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import TrashPage from './pages/TrashPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <DocumentProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="documents/:documentId" element={<DocumentPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </DocumentProvider>
    </BrowserRouter>
  )
}

export default App
