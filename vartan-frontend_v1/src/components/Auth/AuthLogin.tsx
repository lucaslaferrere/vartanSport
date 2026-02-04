"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
    Button,
    Grid,
    InputAdornment,
    Stack,
    TextField,
    Alert,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { useRouter } from "next/navigation";
import { authService } from "@services/auth.service";
import { useAuthStore } from "@libraries/store";

const AuthLogin = () => {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [devMode, setDevMode] = useState(false);
    const { login } = useAuthStore();

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = useCallback(async () => {
        if (!email || !password) {
            setError("Por favor, ingrese un email y contraseña");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await authService.login({ email, password });
            login(response.token, response.usuario);
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Error al iniciar sesión:", err);

            // Si es error de red, activar modo desarrollo
            if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.code === 'ERR_NETWORK') {
                setDevMode(true);
                setError("Backend no disponible. Modo desarrollo activado.");

                // Login mock para desarrollo
                const mockUser = {
                    id: 1,
                    nombre: 'Admin Vartan (Dev)',
                    email: email,
                    rol: 'dueño' as const,
                    activo: true,
                    fecha_creacion: new Date().toISOString(),
                };
                login('mock-dev-token', mockUser);

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);
            } else {
                setError("Error al iniciar sesión. Compruebe su email y contraseña");
            }
        } finally {
            setLoading(false);
        }
    }, [email, password, login, router]);

    useEffect(() => {
        const handleKeyDown = (event: { key: string }) => {
            if (event.key === "Enter") {
                handleSubmit();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleSubmit]);

    return (
        <Grid container spacing={3}>
            {error && (
                <Grid size={{ xs: 12 }}>
                    <Alert
                        severity={devMode ? "info" : "error"}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                </Grid>
            )}
            <Grid size={{ xs: 12 }}>
                <Stack spacing={1}>
                    <TextField
                        id="email-login"
                        type="email"
                        value={email}
                        name="email"
                        label="Email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ingrese su email"
                        fullWidth
                        required
                    />
                </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
                <Stack spacing={1}>
                    <TextField
                        fullWidth
                        id="password-login"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        name="password"
                        label="Contraseña"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingrese su contraseña"
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                    >
                                        <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
                <Button
                    disableElevation
                    disabled={loading}
                    fullWidth
                    size="large"
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
            </Grid>
        </Grid>
    );
};

export default AuthLogin;