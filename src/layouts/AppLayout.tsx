import { Outlet } from "react-router";
import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar";

const AppLayout = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen overflow-y-auto">
        <Navbar />
        <div>
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
