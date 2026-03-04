import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock } from "lucide-react";


const Login = () => {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        const validId = "09494602579";
        const validPass = "magnavitaservicosmaritimosernestolauramassicleia";

        if (id === validId && password === validPass) {
            sessionStorage.setItem("admin_auth", "true");
            toast.success("Acesso autorizado");
            navigate("/dashboard");
        } else {
            toast.error("Credenciais inválidas");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">

            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <Lock className="h-10 w-10 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Área Restrita</CardTitle>
                    <CardDescription className="text-slate-400">
                        Identifique-se para acessar o painel administrativo
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-300">Código de Identificação</label>
                            <Input
                                type="text"
                                placeholder="00000000000"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-300">Senha</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                            Entrar
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
