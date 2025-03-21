"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PaperClipIcon, FolderIcon, QuestionMarkCircleIcon, DocumentTextIcon } from "@heroicons/react/24/outline"; // Import icons

export default function Hero() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("access");
  
      if (token) {
        try {
          const isExpired = checkTokenExpiration(token);
  
          if (!isExpired) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("access");
            setIsAuthenticated(false);
  
            // Refresh token logic if the access token is expired
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              // Make a request to renew the access token
              const refreshResponse = await fetch('http://localhost:8000/auth/token/refresh/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
              });
  
              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                localStorage.setItem("access", data.access); // Save new access token
                setIsAuthenticated(true); // Now authenticated
              } else {
                localStorage.removeItem("access");
                setIsAuthenticated(false);
                router.push("/login"); // Redirect to login if refresh failed
              }
            } else {
              router.push("/login"); // If no refresh token, go to login
            }
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          setIsAuthenticated(false);
          router.push("/signup");
        }
      } else {
        setIsAuthenticated(false);
        router.push("/signup"); // Redirect to signup if no access token
      }
    };
  
    checkAuthentication(); // Call the async function
  }, []);

  const decodeToken = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3) {
        console.error("Invalid token format");
        return null;
    }
    const payload = JSON.parse(atob(parts[1])); // Decode the base64 payload
    console.log("Decoded Token Payload:", payload);
    return payload;
  };


  // Function to decode JWT token and check expiration
  const checkTokenExpiration = (token) => {
    const decoded = decodeToken(token);
    if (decoded === null) {
      return true; // If decoding fails, treat it as expired
    }
  
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    return expirationTime < Date.now();
  };

  function getRefreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        console.error("No refresh token found");
    }
    return refreshToken;
  }

  async function logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('access');  
  
      // If the refresh token or access token is expired, we will handle it
      if (!refreshToken || checkTokenExpiration(refreshToken)) {
        console.error("Refresh token is invalid or expired, logging out.");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh_token");
        location.reload(true);  // Redirect to refresh the UI
        return;
      }
  
      // Proceed with logout if refresh token is valid
      const response = await fetch('http://localhost:8000/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
  
      if (response.ok) {
        console.log("Logged out successfully");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh_token");
        location.reload(true);
      } else {
        const errorText = await response.text();
        console.error("Logout failed:", errorText);
        alert("Logout failed: " + errorText);
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred during logout. Please try again.");
    }
  }  

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6">
      {/* Background Blur Effect */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      {/* Content */}
      <div className="relative w-full max-w-4xl text-center">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-200 mb-4">FirmFlow</h1>

        {/* Subtitle */}
        <h2 className="text-2xl font-medium text-gray-400 mb-6">
          Имате идея за бизнес, но не знаете откъде да започнете?
        </h2>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-center">
          {[{
            icon: <PaperClipIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Генерирайте детайлен бизнес план само с няколко клика."
          }, {
            icon: <FolderIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Качвайте документи и получавайте персонализирани анализи."
          }, {
            icon: <QuestionMarkCircleIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Задавайте въпроси и получавайте експертни отговори в реално време."
          }, {
            icon: <DocumentTextIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Създавайте специализирани документи – от правни консултации до маркетинг стратегии."
          }].map((item, index) => (
            <div
              key={index}
              className="relative w-32 h-32 flex items-center justify-center bg-[#0e0f0f] rounded-xl transition-all duration-300 hover:bg-[#222]/100 group"
            >
              <span className="absolute inset-0 flex items-center justify-center text-4xl group-hover:hidden">
                {item.icon}
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-300 p-2">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-8">
          {isAuthenticated ? (
            <button
              onClick={() => router.push("/businessinfo")}
              className="bg-[#181818] hover:bg-[#292929] px-6 py-3 rounded-lg text-white transition-all duration-300"
            >
              Започнете сега!
            </button>
          ) : (
            <button
              onClick={() => router.push("/signup")}
              className="bg-[#292929] px-6 py-3 rounded-lg text-gray-500 cursor-not-allowed"
              disabled
            >
              Започнете сега!
            </button>
          )}
        </div>
      </div>

      {/* Footer & Authentication Links */}
      <footer className="absolute bottom-6 text-center text-gray-500 text-sm">
        &copy; 2025 FirmFlow. Всички права запазени.
      </footer>

      <div className="fixed top-4 right-4 flex space-x-4">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="bg-[#181818] hover:bg-[#292929] px-4 py-2 rounded-lg transition-all"
          >
            Изход
          </button>
        ) : (
          <>
            <Link href="/login" className="bg-[#181818] hover:bg-[#292929] px-4 py-2 rounded-lg transition-all">
              Вход
            </Link>
            <Link href="/signup" className="bg-[#181818] hover:bg-[#292929] px-4 py-2 rounded-lg transition-all">
              Регистрация
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
