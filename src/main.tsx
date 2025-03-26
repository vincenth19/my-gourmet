import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import AppLayout from "./layouts/AppLayout.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ChefHomePage from "./pages/ChefHomePage.tsx";
import UserHomePage from "./pages/UserHomePage.tsx";
import MyDishes from "./pages/chef/MyDishes.tsx";
import DishForm from "./pages/chef/DishForm.tsx";
import OrderPage from "./pages/OrderPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.tsx";
import OrdersPage from "./pages/OrdersPage.tsx";
import ChefOrderDetailPage from "./pages/chef/ChefOrderDetailPage.tsx";
import NotificationsPage from "./pages/NotificationsPage.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { CartProvider } from "./contexts/CartContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/sign-in" element={<LoginPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<AppLayout />}>
              <Route path="/home" element={<UserHomePage />} />
              <Route path="/chef/home" element={<ChefHomePage />} />
              <Route path="/chef/dishes" element={<MyDishes />} />
              <Route path="/chef/dishes/new" element={<DishForm />} />
              <Route path="/chef/dishes/edit/:id" element={<DishForm />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/order/:chefId" element={<OrderPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/chef/order/:orderId" element={<ChefOrderDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
