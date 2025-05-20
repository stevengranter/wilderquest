// External modules
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'

// React Components
import App from './App'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import RootLayout, { ExploreTab, IdentifyTab, LocateTab } from './layouts/RootLayout'

// Stylesheets
import './globals.css'
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
                    <Route index element={<RootLayout />} />

                    <Route path='explore' element={<ExploreTab />}>
                        <Route index element={<ExploreTab />} />
                        <Route path=':taxonId?' element={<ExploreTab />} />
                    </Route>

                    <Route path='identify' element={<IdentifyTab />} />
                    <Route path='locate' element={<LocateTab />} />


                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="welcome" element={<Welcome />} />

                    <Route path="users">
                        <Route index element={<UserList />} />
                        <Route path=":id" element={<UserProfile />} />
                    </Route>
                </Route>

            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
