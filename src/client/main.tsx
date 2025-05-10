// External modules
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'

// React Components
import App from './App'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import LandingPage from './components/pages/LandingPage'

// Stylesheets
import './main.css'
import Welcome from './components/pages/Welcome'
import UserList from '@/components/UserList'
import UserProfile from '@/components/UserProfile'
import SearchForm from '@/components/SearchForm'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<LandingPage />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="welcome" element={<Welcome />} />
                    <Route path="search" element={<SearchForm />}>
                        <Route index element={<SearchForm />} />
                        <Route path=":taxonId?" element={<SearchForm />} />
                    </Route>
                    <Route path="users">
                        <Route index element={<UserList />} />
                        <Route path=":id" element={<UserProfile />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
