import { createFileRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { CardsPage } from '../components/CardsPage/CardPage'

export const Route = createFileRoute('/')({
    getParentRoute: () => rootRoute,
    path: '/',
    component: CardsPage,
})
