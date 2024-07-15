import React from "react";

import { Routes, Route } from "react-router-dom";

import Wrapper from "./components/base/Wrapper";
import Planner from "./pages/planner/Planner";
import TripDetails from "./pages/tripDetails/TripDetails";

function App() {
  return (
    <Wrapper>
      <Routes>
        <Route path="/" element={<Planner />} />
        <Route path="/trips/:key" element={<TripDetails />} />
      </Routes>
    </Wrapper>
  );
}

export default App;
