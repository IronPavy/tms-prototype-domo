import { createBrowserRouter, RouterProvider } from "react-router";
import PrototypePage from "@/prototype/PrototypePage";
import StyleguidePage from "@/styleguide/StyleguidePage";

const router = createBrowserRouter([
  { path: "/", element: <PrototypePage /> },
  { path: "/styleguide", element: <StyleguidePage /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
