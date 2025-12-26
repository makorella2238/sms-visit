import { createFileRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { StatsPage } from '../components/StatsPage/StatsPage'

export const Route = createFileRoute('/stat')({
    getParentRoute: () => rootRoute,
    path: '/stat',
    component: StatsPage,
})
