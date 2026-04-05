/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { Home } from './features/home';
import { InterKnot } from './features/inter-knot';
import { Settings as SettingsPage } from './features/settings';
import { TimeSync } from './features/time-sync';
import { HollowChat } from './features/hollow-chat';
import { ProxyChat } from './features/proxy-chat';

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
