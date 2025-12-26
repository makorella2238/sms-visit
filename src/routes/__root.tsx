import React from "react";
import { createRootRoute, Outlet } from '@tanstack/react-router'
import Header from '../components/Header/Header'
import { Tabs } from '../components/Tabs/Tabs'
import '../App.css'

export const Route = createRootRoute({
    component: () => (
        <div className="app">
            <Header />
            <Tabs />
            <Outlet />
        </div>
    ),
})
