"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@clickviajes/shared";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Si ya hay sesión, al dashboard.
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const field = parsed.error.flatten().fieldErrors;
      setErrors({ email: field.email?.[0], password: field.password?.[0] });
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data);
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo conectar con el servidor. Intenta nuevamente.";
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel de marca (Aurora) */}
      <section className="aurora-bg relative hidden flex-col justify-between p-12 lg:flex">
        <Logo />
        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-tight text-foreground">
            Gestiona tu agencia de viajes, de la cotización al viaje realizado.
          </h1>
          <p className="mt-4 text-lg text-foreground/70">
            Clientes, reservas, cupos, pagos en cuotas y reportes — todo en un solo lugar.
          </p>
        </div>
        <p className="text-sm text-foreground/50">© {new Date().getFullYear()} Click Viajes</p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="font-display text-2xl text-foreground">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-muted-fg">Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            {errors.form && (
              <div role="alert" className="rounded-btn border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errors.form}
              </div>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@agencia.com"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <div>
              <Input
                label="Contraseña"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPassword ? "Ocultar" : "Mostrar"} contraseña
              </button>
            </div>

            <Button type="submit" loading={submitting} className="mt-2 w-full">
              Ingresar
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
