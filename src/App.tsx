import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Dashboard } from "./components/Dashboard";
import { FoodLogger } from "./components/FoodLogger";
import { WorkoutLogger } from "./components/WorkoutLogger";
import { Challenge } from "./components/Challenge";
import { Community } from "./components/Community";
import { MyPage } from "./components/MyPage";
import { Login } from "./components/Auth/Login";
import { Signup, UserData } from "./components/Auth/Signup";
import { ForgotPassword } from "./components/Auth/ForgotPassword";
import { AccountRecovery } from "./components/Auth/AccountRecovery";
import {
  Home,
  Utensils,
  Dumbbell,
  Trophy,
  Users,
  User,
} from "lucide-react";
import { toast, Toaster } from "sonner";

type AuthView = "login" | "signup" | "recovery" | "app";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [showForgotPassword, setShowForgotPassword] =
    useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  useEffect(() => {
    // Initialize demo users
    const users = JSON.parse(
      localStorage.getItem("users") || "[]",
    );
    if (users.length === 0) {
      const demoUsers = [
        {
          email: "123",
          password: "123",
          name: "퀵유저",
          age: 25,
          gender: "male",
          height: 170,
          weight: 65,
          goal: "maintenance",
          status: "active",
        },
        {
          email: "qwer@qwe.com",
          password: "qwer",
          name: "김테스트",
          age: 25,
          gender: "male",
          height: 175,
          weight: 70,
          goal: "weightLoss",
          status: "deleted", // Deleted account for recovery demo
        },
        {
          email: "demo@demo.com",
          password: "demo",
          name: "데모유저",
          age: 28,
          gender: "female",
          height: 165,
          weight: 55,
          goal: "fitness",
          status: "active",
        },
      ];
      localStorage.setItem("users", JSON.stringify(demoUsers));
    }

    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      setAuthView("app");
    }
  }, []);

  const handleLogin = (email: string, password: string) => {
    const users = JSON.parse(
      localStorage.getItem("users") || "[]",
    );
    const user = users.find(
      (u: any) => u.email === email && u.password === password,
    );

    if (!user) {
      toast.error("이메일 또는 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (
      user.status === "deleted" ||
      user.status === "suspended"
    ) {
      return; // Dialog will handle this
    }

    localStorage.setItem("currentUser", JSON.stringify(user));
    setAuthView("app");
    toast.success("로그인되었습니다!");
  };

  const handleSignup = (userData: UserData) => {
    const users = JSON.parse(
      localStorage.getItem("users") || "[]",
    );

    if (users.find((u: any) => u.email === userData.email)) {
      toast.error("이미 등록된 이메일입니다.");
      return;
    }

    const newUser = { ...userData, status: "active" };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem(
      "currentUser",
      JSON.stringify(newUser),
    );

    setAuthView("app");
    toast.success("회원가입이 완료되었습니다!");
  };

  const handleAccountRecovery = (email: string) => {
    setRecoveryEmail(email);
    setAuthView("recovery");
  };

  const handleRecoverComplete = () => {
    setAuthView("login");
    toast.success(
      "계정이 복구되었습니다. 다시 로그인해주세요.",
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setAuthView("login");
    toast.success("로그아웃되었습니다.");
  };

  if (authView === "login") {
    return (
      <>
        <Toaster position="top-center" />
        <Login
          onLogin={handleLogin}
          onSignup={() => setAuthView("signup")}
          onForgotPassword={() => setShowForgotPassword(true)}
          onAccountRecovery={handleAccountRecovery}
        />
        <ForgotPassword
          open={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </>
    );
  }

  if (authView === "signup") {
    return (
      <>
        <Toaster position="top-center" />
        <Signup
          onSignup={handleSignup}
          onBack={() => setAuthView("login")}
        />
      </>
    );
  }

  if (authView === "recovery") {
    return (
      <>
        <Toaster position="top-center" />
        <AccountRecovery
          email={recoveryEmail}
          onRecover={handleRecoverComplete}
          onBack={() => setAuthView("login")}
        />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto bg-card relative">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="min-h-screen"
          >
            <div className="pb-16">
              <TabsContent value="dashboard" className="m-0">
                <Dashboard />
              </TabsContent>
              <TabsContent value="food" className="m-0">
                <FoodLogger />
              </TabsContent>
              <TabsContent value="workout" className="m-0">
                <WorkoutLogger />
              </TabsContent>
              <TabsContent value="challenge" className="m-0">
                <Challenge />
              </TabsContent>
              <TabsContent value="community" className="m-0">
                <Community />
              </TabsContent>
              <TabsContent value="mypage" className="m-0">
                <MyPage onLogout={handleLogout} />
              </TabsContent>
            </div>

            <TabsList className="fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-md w-full grid grid-cols-6 h-16 bg-card border-t z-50">
              <TabsTrigger
                value="dashboard"
                className="flex flex-col items-center gap-1 p-2"
              >
                <Home size={18} />
                <span className="text-xs">홈</span>
              </TabsTrigger>
              <TabsTrigger
                value="food"
                className="flex flex-col items-center gap-1 p-2"
              >
                <Utensils size={18} />
                <span className="text-xs">식단</span>
              </TabsTrigger>
              <TabsTrigger
                value="workout"
                className="flex flex-col items-center gap-1 p-2"
              >
                <Dumbbell size={18} />
                <span className="text-xs">운동</span>
              </TabsTrigger>
              <TabsTrigger
                value="challenge"
                className="flex flex-col items-center gap-1 p-2"
              >
                <Trophy size={18} />
                <span className="text-xs">챌린지</span>
              </TabsTrigger>
              <TabsTrigger
                value="community"
                className="flex flex-col items-center gap-1 p-2"
              >
                <Users size={18} />
                <span className="text-xs">커뮤니티</span>
              </TabsTrigger>
              <TabsTrigger
                value="mypage"
                className="flex flex-col items-center gap-1 p-2"
              >
                <User size={18} />
                <span className="text-xs">마이</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </>
  );
}