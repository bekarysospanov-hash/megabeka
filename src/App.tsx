import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { DemoProvider, useDemoState } from './store/DemoProvider'
import { AppLayout } from './layouts/AppLayout'
import { ClientLayout } from './layouts/ClientLayout'
import { FurnitureMakerDealsList } from './pages/FurnitureMakerDealsList'
import { FurnitureMakerNewDeal } from './pages/FurnitureMakerNewDeal'
import { FurnitureMakerDealDetail } from './pages/FurnitureMakerDealDetail'
import { FurnitureMakerProfile } from './pages/FurnitureMakerProfile'
import { ClientDealEntry } from './pages/ClientDealEntry'
import { OperatorDealsList } from './pages/OperatorDealsList'
import { OperatorDealDetail } from './pages/OperatorDealDetail'

function RoleHomeRedirect() {
  const { role } = useDemoState()
  return <Navigate to={role === 'operator' ? '/operator' : '/furniture-maker'} replace />
}

export default function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<RoleHomeRedirect />} />
            <Route path="furniture-maker" element={<FurnitureMakerDealsList />} />
            <Route path="furniture-maker/new" element={<FurnitureMakerNewDeal />} />
            <Route path="furniture-maker/deal/:id" element={<FurnitureMakerDealDetail />} />
            <Route path="furniture-maker/profile" element={<FurnitureMakerProfile />} />
            <Route path="operator" element={<OperatorDealsList />} />
            <Route path="operator/deal/:id" element={<OperatorDealDetail />} />
            <Route path="*" element={<RoleHomeRedirect />} />
          </Route>
          <Route element={<ClientLayout />}>
            <Route path="client/deal/:id" element={<ClientDealEntry />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  )
}
