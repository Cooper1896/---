/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import InterKnot from './pages/InterKnot';
import SettingsPage from './pages/Settings';
import TimeSync from './pages/TimeSync';
import HollowChat from './pages/HollowChat';
import ProxyChat from './pages/ProxyChat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="inter-knot" element={<InterKnot />} />
          <Route path="time-sync" element={<TimeSync />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/hollow" element={<HollowChat />} />
        <Route path="/proxy" element={<ProxyChat />} />
      </Routes>
    </BrowserRouter>
  );
}
