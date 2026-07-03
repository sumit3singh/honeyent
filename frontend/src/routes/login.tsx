import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Mail, Lock, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/clients";
import { Scene3D } from "@/components/3d-login-scene";

export const Route = createFileRoute("/login")({
    head: () => ({ meta: [{ title: "Login — Honey Enterprises ERP" }] }),
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [username, setUsername] = useState("Admin");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            navigate({ to: "/" });
        }
    }, [navigate]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!username || !password) {
            toast.error("Please enter username and password");
            return;
        }

        setIsLoading(true);
        try {
            const response = await login(username, password);
            localStorage.setItem("auth_token", response.token);
            localStorage.setItem("user", JSON.stringify(response.user));
            toast.success("Login successful!");
            navigate({ to: "/" });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Login failed");
            setPassword("");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 flex flex-col md:flex-row">
            {/* 3D Canvas Background */}
            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 0 }}
            >
                <Scene3D containerRef={containerRef} />
            </div>

            {/* Gradient Overlay - responsive */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/70 to-slate-900/85 md:from-slate-900/80 md:via-slate-900/60 md:to-slate-900/80" style={{ zIndex: 1 }} />

            {/* Content Container - responsive */}
            <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-3 sm:px-4 md:px-6">
                <div className="w-full max-w-sm sm:max-w-md">
                    {/* Header - responsive spacing and text sizes */}
                    <div className="mb-6 sm:mb-8 text-center">
                        <div className="mb-3 sm:mb-4 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-xl shadow-primary/50">
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-xl sm:text-2xl font-bold text-white">HE</span>
                                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white mt-0.5" />
                            </div>
                        </div>
                        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                            Honey Enterprises
                        </h1>
                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 sm:line-clamp-none">
                            Stone Crusher • Aggregate Trading • Transport
                        </p>
                    </div>

                    {/* Login Card - responsive padding */}
                    <div className="rounded-2xl border border-primary/30 bg-slate-900/50 p-5 sm:p-6 md:p-8 shadow-2xl backdrop-blur-xl">
                        <h2 className="mb-1.5 sm:mb-2 text-center font-display text-lg sm:text-xl font-bold text-white">Admin Portal</h2>
                        <p className="mb-5 sm:mb-6 text-center text-xs text-slate-400">Enterprise Management System</p>

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-xs sm:text-xs font-semibold text-slate-300 mb-1.5 sm:mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-primary/60" />
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/50 text-sm sm:text-base py-2 sm:py-2.5"
                                        disabled={isLoading}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-xs sm:text-xs font-semibold text-slate-300 mb-1.5 sm:mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-primary/60" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/50 text-sm sm:text-base py-2 sm:py-2.5"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            {/* Submit Button - responsive */}
                            <Button
                                type="submit"
                                className="w-full mt-6 sm:mt-7 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-semibold shadow-lg shadow-primary/50 text-sm sm:text-base py-2.5 sm:py-3 h-auto"
                                disabled={isLoading}
                                size="lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        <span className="hidden sm:inline">Sign In</span>
                                        <span className="sm:hidden">Login</span>
                                    </>
                                )}
                            </Button>
                        </form>

                        

                       
                    </div>

                   
                </div>
            </div>
        </div>
    );
}
