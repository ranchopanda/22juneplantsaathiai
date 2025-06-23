import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: "🏠", label: "Home", path: "/" },
    { icon: "🌾", label: "Detect", path: "/disease-detection" },
    { icon: "📊", label: "Fields", path: "/yield-prediction" },
    { icon: "💬", label: "Expert", path: "/success-stories" },
    { icon: "⚙️", label: "Settings", path: "/about" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 md:hidden z-50">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={cn(
            "flex flex-col items-center justify-center text-xs w-full h-full",
            location.pathname === item.path ? "text-green-600" : "text-gray-500"
          )}
        >
          <span className="text-lg mb-1">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;
