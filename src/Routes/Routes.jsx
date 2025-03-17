// src/routes.jsx
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy-loaded components
const Auth = lazy(() => import("../Components/Auth/Auth"));
const Home = lazy(() => import("../Components/Home/Home"));
const FileBulkUpload = lazy(() =>
  import("../Components/FileBulkUpload/FileBulkUpload")
);
const Filehandling = lazy(() =>
  import("../Components/FileHandling/Filehandling")
);

const DashBoard = lazy(() => import("../Components/Dashboard/Dashboard"));

// Spinner animation
const Spinner = (
  <div className="flex items-center justify-center h-screen">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={Spinner}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: "/auth",
    element: (
      <Suspense fallback={Spinner}>
        <Auth />
      </Suspense>
    ),
  },
  {
    path: "/filebulk-upload",
    element: (
      <Suspense fallback={Spinner}>
        <FileBulkUpload />
      </Suspense>
    ),
  },
  {
    path: "/filehandling",
    element: (
      <Suspense fallback={Spinner}>
        <Filehandling />
      </Suspense>
    ),
  },

  {
    path: "/dashboard",
    element: (
      <Suspense fallback={Spinner}>
        <DashBoard />
      </Suspense>
    ),
  },
]);

export default router;
