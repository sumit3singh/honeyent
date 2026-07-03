import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2, Zap, ShieldCheck, Truck, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/clients";

export const Route = createFileRoute("/login")({
    head: () => ({ meta: [{ title: "Login — Honey Enterprises ERP" }] }),
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("Admin");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="relative min-h-screen overflow-hidden bg-[#05070f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,184,0,0.18),_transparent_24%),radial-gradient(circle_at_80%_15%,_rgba(255,120,0,0.14),_transparent_18%),linear-gradient(180deg,_#080a11_0%,_#02030a_100%)]" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518085250887-8bf8ee793ee3?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <section className="hidden lg:flex lg:w-1/2 lg:flex-col lg:gap-8">
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-orange-500 text-white shadow-xl shadow-orange-500/25">
                                <span className="text-2xl font-bold">HE</span>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-orange-300/90">Honey Enterprises</p>
                                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">ERP for Crushing, Trading & Transport</h2>
                            </div>
                        </div>
                        <p className="text-sm leading-7 text-slate-300">
                            A beautiful and secure admin experience for your enterprise operations, with fleet, finance, and logistics all in one place.
                        </p>

                        <div className="mt-10 grid gap-4 text-sm text-slate-300">
                            <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                                <ShieldCheck className="h-5 w-5 text-orange-400" />
                                <div>
                                    <p className="font-semibold text-white">Protected access</p>
                                    <p className="text-slate-500">Secure admin login with trusted authentication.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                                <Truck className="h-5 w-5 text-orange-400" />
                                <div>
                                    <p className="font-semibold text-white">Operations visibility</p>
                                    <p className="text-slate-500">Track vehicles, deliveries and material flow.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                                <Clock3 className="h-5 w-5 text-orange-400" />
                                <div>
                                    <p className="font-semibold text-white">Always available</p>
                                    <p className="text-slate-500">Access ERP tools anytime from the cloud.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10 lg:w-[480px]">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-orange-500 text-white shadow-xl shadow-orange-500/25">
                            <span className="text-2xl font-bold">HE</span>
                        </div>
                        <p className="text-xs uppercase tracking-[0.3em] text-orange-300/90">Admin Portal</p>
                        <h1 className="mt-3 text-3xl font-semibold text-white">Enterprise Management System</h1>
                        <p className="mt-3 text-sm text-slate-400">Stone Crusher • Aggregate Trading • Transport</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-3">
                            <label htmlFor="username" className="block text-sm font-semibold text-slate-300">Username</label>
                            <div className="relative rounded-[1.5rem] border border-white/10 bg-slate-900/80 px-4 py-3 focus-within:border-orange-400/70 focus-within:ring-1 focus-within:ring-orange-400/20">
                                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400/80" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-[1.5rem] border-none bg-transparent py-3 pl-14 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-300">Password</label>
                            <div className="relative rounded-[1.5rem] border border-white/10 bg-slate-900/80 px-4 py-3 focus-within:border-orange-400/70 focus-within:ring-1 focus-within:ring-orange-400/20">
                                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400/80" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-[1.5rem] border-none bg-transparent py-3 pl-14 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-400">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary" />
                                Remember me
                            </label>
                            <button type="button" className="text-orange-300 transition hover:text-orange-200">Forgot Password?</button>
                        </div>

                        <Button
                            type="submit"
                            className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-primary to-orange-500 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 transition hover:brightness-110"
                            disabled={isLoading}
                            size="lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-5 w-5" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 grid gap-3 text-sm text-slate-300">
                        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                                <Truck className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-semibold text-white">Fleet management</p>
                                <p className="text-xs text-slate-500">Monitor vehicles, deliveries, and routes.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                                <Clock3 className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-semibold text-white">24/7 operations</p>
                                <p className="text-xs text-slate-500">Access your ERP anywhere, anytime.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
