import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateDocument, generatePDF, DocumentData } from "@/lib/document-utils";
import { saveAs } from "file-saver";
import {
    Compass,
    Search,
    Users,
    FileText,
    BarChart3,
    ArrowLeft,
    ChevronRight,
    User,
    MapPin,
    CreditCard,
    DollarSign,
    Save,
    StickyNote,
    Trash2,
    Star,
    LayoutGrid,
    Plus,
    X,
    Check,
    Lock,
    Unlock,
    Edit3,
    CheckSquare,
    Square,
    GripVertical,
    ChevronUp,
    ChevronDown,
    Menu,
    LogOut,
    Shield,
    Stamp,
    Award,
    Ship,
    Navigation,
    GraduationCap,
    Scroll,
    ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FinancialTab, Transaction } from "@/components/dashboard/FinancialTab";
import { ClientDocuments } from "@/components/dashboard/ClientDocuments";
interface Registro {
    id: string;
    created_at: string;
    service_title: string;
    name: string;
    rg: string;
    cpf: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    document_url: string | null;
    pdf_url: string | null;
    notes: string | null;
    nome_paciente?: string;
    [key: string]: unknown;
}

interface Review {
    id: string;
    created_at: string;
    name: string;
    rating: number;
    review_text: string;
}

interface Service {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    is_active: boolean;
    order_index: number;
}

const subdivisions = [
    "Emissão Certificado",
    "Renovação ou 2ª via Certificado 1034",
    "Emissão ou Renovação Certificado 1031",
    "Renovação CIR – Etiqueta de dados",
    "2ª via CIR (Término de espaço)",
    "Ascensão de Categoria",
    "Emissão e Renovação Arrais e Mestre Amador",
    "Homologação de certificado",
    "Endosso de Certificado",
    "Emissão e renovação Identidade de Aquaviário",
    "Consultoria"
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [registros, setRegistros] = useState<Registro[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [financeiro, setFinanceiro] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [reviewSearchTerm, setReviewSearchTerm] = useState("");
    const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
    const [selectedRegistros, setSelectedRegistros] = useState<Set<string>>(new Set());
    const [view, setView] = useState<"stats" | "search" | "reviews" | "services" | "financeiro">("stats");
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [mobileSelectedItemIndex, setMobileSelectedItemIndex] = useState<number | null>(null);
    const [preSelectedClient, setPreSelectedClient] = useState<Registro | null>(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    useEffect(() => {
        const isAuth = sessionStorage.getItem("admin_auth");
        if (!isAuth) {
            toast.error("Acesso negado");
            navigate("/entrar");
            return;
        }

        fetchAllData();

        const channel = supabase
            .channel('dashboard_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'registros' },
                () => fetchRegistros(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reviews' },
                () => fetchReviews()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'servicos' },
                () => fetchServices()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'financeiro' },
                () => fetchFinanceiro()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchRegistros(),
            fetchReviews(),
            fetchServices(),
            fetchFinanceiro()
        ]);
        setLoading(false);
    };

    const fetchFinanceiro = async () => {
        const { data } = await supabase.from('financeiro').select('*').order('created_at', { ascending: false });
        if (data) setFinanceiro(data as unknown as Transaction[]);
    };

    const fetchReviews = async () => {
        const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (data) setReviews(data as unknown as Review[]);
    };

    const fetchServices = async () => {
        const { data } = await supabase.from('servicos').select('*').order('order_index', { ascending: true });
        if (data) setServices(data as unknown as Service[]);
    };

    const fetchRegistros = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const { data, error } = await supabase
                .from('registros')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erro detalhado do Supabase:", error);
                toast.error(`Erro do Supabase: ${error.message}${error.hint ? ' - ' + error.hint : ''}`);
                throw error;
            }
            setRegistros((data as unknown as Registro[]) || []);
        } catch (error: any) {
            console.error("Erro completo capturado:", error);
            if (error?.message === "Failed to fetch" || error?.name === "TypeError") {
                toast.error("Erro de conexão: Não foi possível alcançar o servidor Supabase. Verifique sua internet.");
            } else {
                toast.error("Erro ao carregar dados do CRM");
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteRegistro = async (id: string, documentUrl: string | null) => {
        try {
            // 1. Remover arquivo do storage se existir
            if (documentUrl) {
                const { error: storageError } = await supabase.storage
                    .from('procuracoes')
                    .remove([documentUrl]);

                if (storageError) console.error("Erro ao remover documento:", storageError);
            }

            // 2. Remover do banco
            const { error } = await supabase
                .from('registros')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setRegistros(prev => prev.filter(r => r.id !== id));
            toast.success("Registro excluído com sucesso");
        } catch (error) {
            console.error("Erro ao excluir registro:", error);
            toast.error("Erro ao excluir registro");
        }
    };

    const deleteSelectedRegistros = async () => {
        if (selectedRegistros.size === 0) return;
        try {
            const idsToDelete = Array.from(selectedRegistros);
            const toDelete = registros.filter(r => idsToDelete.includes(r.id));

            // Remove storage files
            const paths = toDelete
                .flatMap(r => [r.document_url, r.pdf_url])
                .filter(Boolean) as string[];
            if (paths.length > 0) {
                await supabase.storage.from('procuracoes').remove(paths);
            }

            // Delete from DB
            const { error } = await supabase
                .from('registros')
                .delete()
                .in('id', idsToDelete);

            if (error) throw error;

            setRegistros(prev => prev.filter(r => !idsToDelete.includes(r.id)));
            setSelectedRegistros(new Set());
            toast.success(`${idsToDelete.length} registro(s) excluído(s) com sucesso`);
        } catch (error) {
            console.error('Erro ao excluir registros:', error);
            toast.error('Erro ao excluir registros selecionados');
        }
    };

    const updateNote = async (id: string, notes: string) => {
        try {
            const { error } = await (supabase as any)
                .from('registros')
                .update({ notes })
                .eq('id', id);

            if (error) throw error;

            setRegistros(prev => prev.map(r => r.id === id ? { ...r, notes } : r));
            toast.success("Anotação salva com sucesso");
        } catch (error) {
            console.error("Erro ao salvar anotação:", error);
            toast.error("Erro ao salvar anotação");
        }
    };

    const filteredRegistros = registros.filter(r =>
        Object.values(r).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const getStatsByService = () => {
        const stats: Record<string, number> = {};
        services.forEach(s => stats[s.title] = 0);
        registros.forEach(r => {
            const title = String(r.service_title);
            if (stats[title] !== undefined) {
                stats[title]++;
            }
        });
        return stats;
    };

    const filteredReviews = reviews.filter(r =>
        r.name.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        r.review_text.toLowerCase().includes(reviewSearchTerm.toLowerCase())
    );

    const toggleReviewSelection = (id: string) => {
        const newSelected = new Set(selectedReviews);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedReviews(newSelected);
    };

    const toggleSelectAllReviews = () => {
        if (selectedReviews.size === filteredReviews.length) {
            setSelectedReviews(new Set());
        } else {
            setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
        }
    };

    const getServiceIcon = (iconName: string) => {
        const iconProps = { className: "h-5 w-5" };
        switch (iconName) {
            case "Shield": return <Shield {...iconProps} />;
            case "Stamp": return <Stamp {...iconProps} />;
            case "Award": return <Award {...iconProps} />;
            case "Ship": return <Ship {...iconProps} />;
            case "Navigation": return <Navigation {...iconProps} />;
            case "GraduationCap": return <GraduationCap {...iconProps} />;
            case "CreditCard": return <CreditCard {...iconProps} />;
            case "FileText": return <FileText {...iconProps} />;
            case "Scroll": return <Scroll {...iconProps} />;
            case "ShieldCheck": return <ShieldCheck {...iconProps} />;
            case "Calendar": return <FileText {...iconProps} />;
            case "Compass": return <Compass {...iconProps} />;
            default: return <LayoutGrid {...iconProps} />;
        }
    };

    const bulkDeleteReviews = async () => {
        if (selectedReviews.size === 0) return;
        if (!confirm(`Deseja excluir ${selectedReviews.size} avaliações selecionadas?`)) return;

        try {
            const ids = Array.from(selectedReviews);
            const { error } = await supabase.from('reviews').delete().in('id', ids);
            if (error) throw error;

            setReviews(prev => prev.filter(r => !selectedReviews.has(r.id)));
            setSelectedReviews(new Set());
            toast.success(`${ids.length} avaliações removidas`);
        } catch (err) {
            console.error("Erro ao excluir avaliações em massa:", err);
            toast.error("Erro ao excluir avaliações");
        }
    };

    const moveService = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= services.length) return;
        swapServicesSync(index, newIndex);
    };

    const swapServicesSync = async (idx1: number, idx2: number) => {
        const updatedServices = [...services];
        const temp = updatedServices[idx1];
        updatedServices[idx1] = updatedServices[idx2];
        updatedServices[idx2] = temp;

        const reordered = updatedServices.map((s, i) => ({ ...s, order_index: i }));
        setServices(reordered);
        setMobileSelectedItemIndex(null);

        try {
            const updates = reordered.map(s => ({
                id: s.id,
                order_index: s.order_index,
                title: s.title,
                description: s.description,
                icon_name: s.icon_name,
                is_active: s.is_active
            }));

            const { error } = await supabase.from('servicos').upsert(updates as any);
            if (error) throw error;
            toast.success("Ordem atualizada");
        } catch (err) {
            console.error("Erro ao salvar ordem:", err);
            toast.error("Erro ao salvar ordem");
        }
    };

    const handleMobileServiceClick = (index: number) => {
        if (mobileSelectedItemIndex === null) {
            setMobileSelectedItemIndex(index);
            toast.info("Agora clique em outro serviço para trocar a posição");
        } else if (mobileSelectedItemIndex === index) {
            setMobileSelectedItemIndex(null);
        } else {
            swapServicesSync(mobileSelectedItemIndex, index);
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (index: number) => {
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const updatedServices = [...services];
        const [movedItem] = updatedServices.splice(draggedItemIndex, 1);
        updatedServices.splice(index, 0, movedItem);

        const reordered = updatedServices.map((s, i) => ({ ...s, order_index: i }));
        setServices(reordered);
        setDraggedItemIndex(null);

        try {
            const updates: any[] = reordered.map(s => ({
                id: s.id,
                order_index: s.order_index,
                title: s.title,
                description: s.description,
                icon_name: s.icon_name,
                is_active: s.is_active
            }));

            const { error } = await supabase.from('servicos').upsert(updates as any);
            if (error) throw error;
            toast.success("Ordem atualizada");
        } catch (err) {
            console.error("Erro ao salvar ordem:", err);
            toast.error("Erro ao salvar ordem");
        }
    };

    const stats = getStatsByService();

    useEffect(() => {
        // Fix for white gaps at top/bottom on mobile rubber-band scroll
        document.body.style.backgroundColor = "#020617"; // bg-slate-950
        document.documentElement.style.backgroundColor = "#020617";
        return () => {
            document.body.style.backgroundColor = "";
            document.documentElement.style.backgroundColor = "";
        };
    }, []);

    return (
        <div className="min-h-[100dvh] bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Compass className="h-8 w-8 text-blue-500" />
                            Ola, Ernesto. Bem vindo a
                        </h1>
                        <p className="text-slate-300 mt-1">Gestão de Fluxo - Magnavita Serviços Marítimos</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto flex-nowrap md:flex-wrap">
                        <Button
                            variant={view === "stats" ? "default" : "outline"}
                            onClick={() => setView("stats")}
                            className={view === "stats" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" /> Geral
                        </Button>

                        <Button
                            variant={view === "reviews" ? "default" : "outline"}
                            onClick={() => setView("reviews")}
                            className={view === "reviews" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
                        >
                            <Star className="mr-2 h-4 w-4 text-yellow-500" /> Avaliações
                        </Button>
                        <Button
                            variant={view === "services" ? "default" : "outline"}
                            onClick={() => setView("services")}
                            className={view === "services" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
                        >
                            <LayoutGrid className="mr-2 h-4 w-4 text-emerald-500" /> Serviços
                        </Button>
                        <Button
                            variant={view === "financeiro" ? "default" : "outline"}
                            onClick={() => setView("financeiro")}
                            className={view === "financeiro" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
                        >
                            <DollarSign className="mr-2 h-4 w-4 text-emerald-400" /> Financeiro
                        </Button>
                    </div>
                </header>

                {view === "stats" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Cards de Resumo */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Total de Atendimentos</CardTitle>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">{registros.length}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800 shadow-xl">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Serviço Mais Procurado</CardTitle>
                                    <FileText className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-semibold text-white truncate">
                                        {Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800 shadow-xl">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Status Local</CardTitle>
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">Sincronizado</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Fluxo por CPF (Agrupado) */}
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-semibold text-slate-200">Atendimentos Agrupados por CPF</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Bulk selection controls */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedRegistros.size === filteredRegistros.length && filteredRegistros.length > 0) {
                                                setSelectedRegistros(new Set());
                                            } else {
                                                setSelectedRegistros(new Set(filteredRegistros.map(r => r.id)));
                                            }
                                        }}
                                        className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 text-xs h-8 gap-1.5"
                                    >
                                        {selectedRegistros.size === filteredRegistros.length && filteredRegistros.length > 0
                                            ? <><CheckSquare className="h-3.5 w-3.5 text-blue-400" /> Desmarcar Tudo</>
                                            : <><Square className="h-3.5 w-3.5 text-slate-400" /> Selecionar Tudo</>}
                                    </Button>
                                    {selectedRegistros.size > 0 && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className="bg-red-600/90 hover:bg-red-600 text-white text-xs h-8 gap-1.5"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Apagar Selecionados ({selectedRegistros.size})
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Excluir {selectedRegistros.size} registro(s)?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-300">
                                                        Esta ação é permanente e não pode ser desfeita. Os arquivos DOCX e PDF também serão removidos.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={deleteSelectedRegistros}
                                                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                                                    >
                                                        Excluir Agora
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    {/* Search */}
                                    <div className={`relative transition-all duration-300 ease-in-out ${isSearchVisible ? 'w-full md:w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input
                                            placeholder="Nome, CPF ou Cidade..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-primary shadow-lg border-2"
                                            autoFocus={isSearchVisible}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white h-8 w-8 p-0"
                                            onClick={() => {
                                                setIsSearchVisible(false);
                                                setSearchTerm("");
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {!isSearchVisible && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setIsSearchVisible(true)}
                                            className="bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-blue-500 transition-all shadow-lg active:scale-95"
                                            title="Ativar Pesquisa"
                                        >
                                            <Search className="h-5 w-5 text-blue-500" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Accordion type="single" collapsible className="w-full space-y-2">
                                {Object.entries(
                                    filteredRegistros.reduce((acc, r) => {
                                        if (!acc[r.cpf]) acc[r.cpf] = [];
                                        acc[r.cpf].push(r);
                                        return acc;
                                    }, {} as Record<string, Registro[]>)
                                ).map(([cpf, pfRegistros], idx) => (
                                    <AccordionItem key={cpf} value={`cpf-${idx}`} className="border border-slate-800 bg-slate-900/40 rounded-lg px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center justify-between w-full pr-4 text-left">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-100">{pfRegistros[0].name}</span>
                                                        <span className="text-xs text-slate-400 ml-2 font-mono">{cpf}</span>
                                                    </div>
                                                </div>
                                                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                                                    {pfRegistros.length} {pfRegistros.length === 1 ? 'atendimento' : 'atendimentos'}
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4">
                                            <ClientDocuments cpf={cpf} name={pfRegistros[0].name} />
                                            <div className="overflow-x-auto border-t border-slate-800 mt-2 pt-4">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                                            <TableHead className="w-8 pl-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const groupIds = pfRegistros.map(r => r.id);
                                                                        const allSelected = groupIds.every(id => selectedRegistros.has(id));
                                                                        const next = new Set(selectedRegistros);
                                                                        if (allSelected) groupIds.forEach(id => next.delete(id));
                                                                        else groupIds.forEach(id => next.add(id));
                                                                        setSelectedRegistros(next);
                                                                    }}
                                                                    className="text-slate-400 hover:text-blue-400 transition-colors"
                                                                >
                                                                    {pfRegistros.every(r => selectedRegistros.has(r.id))
                                                                        ? <CheckSquare className="h-4 w-4 text-blue-400" />
                                                                        : <Square className="h-4 w-4" />}
                                                                </button>
                                                            </TableHead>
                                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Data/Hora</TableHead>
                                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Serviço</TableHead>
                                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Localização</TableHead>
                                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest text-right">Documentos</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {pfRegistros.map((r) => (
                                                            <TableRow key={r.id} className={`border-slate-800 hover:bg-slate-800/50 ${selectedRegistros.has(r.id) ? 'bg-blue-900/20' : ''}`}>
                                                                <TableCell className="pl-2 w-8">
                                                                    <button
                                                                        onClick={() => {
                                                                            const next = new Set(selectedRegistros);
                                                                            if (next.has(r.id)) next.delete(r.id);
                                                                            else next.add(r.id);
                                                                            setSelectedRegistros(next);
                                                                        }}
                                                                        className="text-slate-400 hover:text-blue-400 transition-colors"
                                                                    >
                                                                        {selectedRegistros.has(r.id)
                                                                            ? <CheckSquare className="h-4 w-4 text-blue-400" />
                                                                            : <Square className="h-4 w-4" />}
                                                                    </button>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-slate-500">
                                                                    {new Date(r.created_at).toLocaleString('pt-BR')}
                                                                </TableCell>
                                                                <TableCell className="font-bold text-slate-100 text-xs">
                                                                    <span className="px-2 py-0.5 rounded bg-blue-600/10 text-blue-300 border border-blue-600/20">
                                                                        {r.service_title}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-slate-300 text-xs">
                                                                    {r.city} - {r.state}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 text-[10px] flex items-center gap-1 border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                                                                            onClick={async () => {
                                                                                if (r.document_url) {
                                                                                    toast.loading("Baixando procuração...", { id: "down-docx" });
                                                                                    const { data, error } = await supabase.storage.from('procuracoes').download(r.document_url);
                                                                                    if (data) {
                                                                                        saveAs(data, `PROCURACAO_${r.name.toUpperCase().replace(/\s/g, "_")}.docx`);
                                                                                        toast.success("Download concluído", { id: "down-docx" });
                                                                                    } else {
                                                                                        toast.error("Erro ao baixar. Tente gerar novamente.", { id: "down-docx" });
                                                                                    }
                                                                                } else {
                                                                                    const dateObj = new Date(r.created_at);
                                                                                    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
                                                                                    const docData: DocumentData = {
                                                                                        nome: r.name.toUpperCase(),
                                                                                        rg: r.rg || "",
                                                                                        cpf: r.cpf || "",
                                                                                        rua: r.street || "",
                                                                                        numero: r.number || "",
                                                                                        bairro: r.neighborhood || "",
                                                                                        cidade: r.city || "",
                                                                                        estado: r.state || "",
                                                                                        cep: r.cep || "",
                                                                                        data_assinatura_completa: `${r.city || ""} – ${r.state || ""}, ${dateObj.getDate()} de ${meses[dateObj.getMonth()]} de ${dateObj.getFullYear()}`,
                                                                                    };
                                                                                    const blob = await generateDocument(docData);
                                                                                    if (blob) {
                                                                                        saveAs(blob, `PROCURACAO_${r.name.toUpperCase().replace(/\s/g, "_")}.docx`);
                                                                                    } else {
                                                                                        toast.error("Erro ao gerar documento DOCX");
                                                                                    }
                                                                                }
                                                                            }}
                                                                            title="Download Word (.docx)"
                                                                        >
                                                                            <FileText className="h-3 w-3 text-blue-500" />
                                                                            DOCX
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 text-[10px] flex items-center gap-1 border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                                                                            onClick={async () => {
                                                                                if (r.pdf_url) {
                                                                                    toast.loading("Baixando PDF...", { id: "down-pdf" });
                                                                                    const { data, error } = await supabase.storage.from('procuracoes').download(r.pdf_url);
                                                                                    if (data) {
                                                                                        saveAs(data, `PROCURACAO_${r.name.toUpperCase().replace(/\s/g, "_")}.pdf`);
                                                                                        toast.success("Download PDF concluído", { id: "down-pdf" });
                                                                                    } else {
                                                                                        toast.error("Erro ao baixar PDF.", { id: "down-pdf" });
                                                                                    }
                                                                                } else {
                                                                                    const dateObj = new Date(r.created_at);
                                                                                    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
                                                                                    const docData: DocumentData = {
                                                                                        nome: r.name.toUpperCase(),
                                                                                        rg: r.rg || "",
                                                                                        cpf: r.cpf || "",
                                                                                        rua: r.street || "",
                                                                                        numero: r.number || "",
                                                                                        bairro: r.neighborhood || "",
                                                                                        cidade: r.city || "",
                                                                                        estado: r.state || "",
                                                                                        cep: r.cep || "",
                                                                                        data_assinatura_completa: `${r.city || ""} – ${r.state || ""}, ${dateObj.getDate()} de ${meses[dateObj.getMonth()]} de ${dateObj.getFullYear()}`,
                                                                                    };
                                                                                    const blob = await generatePDF(docData);
                                                                                    if (blob) {
                                                                                        const url = URL.createObjectURL(blob);
                                                                                        window.open(url, '_blank');
                                                                                    } else {
                                                                                        toast.error("Erro ao gerar PDF");
                                                                                    }
                                                                                }
                                                                            }}
                                                                            title="Download PDF"
                                                                        >
                                                                            <FileText className="h-3 w-3 text-red-500" />
                                                                            PDF
                                                                        </Button>
                                                                        <NoteDialog id={r.id} initialNote={r.notes || ""} onSave={updateNote} />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                                            onClick={() => {
                                                                                setPreSelectedClient(r);
                                                                                setView("financeiro");
                                                                            }}
                                                                            title="Gerar Cobrança"
                                                                        >
                                                                            <DollarSign className="h-4 w-4" />
                                                                        </Button>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
                                                                                    <AlertDialogDescription className="text-slate-300">
                                                                                        Atenção: Você está excluindo permanentemente o registro de <b>{r.name}</b>.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Voltar</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => deleteRegistro(r.id, r.document_url)}
                                                                                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                                                                                    >
                                                                                        Excluir Agora
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                )}



                {view === "reviews" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Star className="text-yellow-500" /> Gestão de Avaliações
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Buscar avaliações..."
                                        value={reviewSearchTerm}
                                        onChange={(e) => setReviewSearchTerm(e.target.value)}
                                        className="pl-9 h-10 bg-slate-900 border-slate-700 text-white text-sm"
                                    />
                                </div>
                                {selectedReviews.size > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={bulkDeleteReviews}
                                        className="animate-in zoom-in duration-200"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir ({selectedReviews.size})
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Card className="bg-slate-900 border-slate-800">
                            <div className="overflow-x-auto w-full">
                                <Table className="min-w-[800px]">
                                    <TableHeader>
                                        <TableRow className="border-slate-800 bg-slate-800/30 hover:bg-transparent">
                                            <TableHead className="w-12 text-center">
                                                <div
                                                    className="flex justify-center cursor-pointer"
                                                    onClick={toggleSelectAllReviews}
                                                >
                                                    {selectedReviews.size === filteredReviews.length && reviews.length > 0 ? (
                                                        <CheckSquare className="h-5 w-5 text-blue-500" />
                                                    ) : (
                                                        <Square className="h-5 w-5 text-slate-600" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Cliente</TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest text-center">Nota</TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Comentário</TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest text-right">Ação</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReviews.map((r) => (
                                            <TableRow key={r.id} className={`border-slate-800 transition-colors ${selectedReviews.has(r.id) ? 'bg-blue-600/5' : ''}`}>
                                                <TableCell className="text-center">
                                                    <div
                                                        className="flex justify-center cursor-pointer"
                                                        onClick={() => toggleReviewSelection(r.id)}
                                                    >
                                                        {selectedReviews.has(r.id) ? (
                                                            <CheckSquare className="h-5 w-5 text-blue-500" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-slate-700" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-slate-100 uppercase text-xs tracking-tight">
                                                    {r.name}
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold">{r.rating}★</span>
                                                </TableCell>
                                                <TableCell className="text-slate-300 text-sm italic">"{r.review_text}"</TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remover Avaliação?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-300">Esta avaliação deixará de aparecer no carrossel do site principal.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">Voltar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-red-600"
                                                                    onClick={async () => {
                                                                        try {
                                                                            const { error } = await (supabase as any).from('reviews').delete().eq('id', r.id);
                                                                            if (error) throw error;
                                                                            setReviews(prev => prev.filter(x => x.id !== r.id));
                                                                            toast.success("Avaliação removida");
                                                                        } catch (err) {
                                                                            console.error("Erro ao excluir avaliação:", err);
                                                                            toast.error("Erro ao excluir avaliação");
                                                                        }
                                                                    }}
                                                                >Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredReviews.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20">
                                                    <Star className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                                    <p className="text-slate-300 font-medium">Nenhuma avaliação encontrada.</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                )}

                {view === "services" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <LayoutGrid className="text-emerald-500" /> Gestão de Serviços
                            </h2>
                            <div className="flex items-center gap-2">
                                {mobileSelectedItemIndex !== null && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setMobileSelectedItemIndex(null)}
                                        className="border-slate-700 text-slate-300 md:hidden"
                                    >
                                        Cancelar Troca
                                    </Button>
                                )}
                                <ServiceDialog onSave={async (s) => {
                                    try {
                                        const { data, error } = await (supabase as any).from('servicos').insert([{ ...s, is_active: true }]).select();
                                        if (error) throw error;
                                        setServices(prev => [...prev, data[0]].sort((a, b) => a.order_index - b.order_index));
                                        toast.success("Serviço adicionado");
                                    } catch (err) {
                                        console.error("Erro ao adicionar serviço:", err);
                                        toast.error("Erro ao adicionar serviço");
                                    }
                                }} />
                            </div>
                        </div>

                        {mobileSelectedItemIndex !== null && (
                            <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-lg text-blue-400 text-sm flex items-center gap-2 md:hidden animate-pulse">
                                <LayoutGrid className="h-4 w-4" />
                                <span>Trocando <b>{services[mobileSelectedItemIndex].title}</b>. Toque em outro cartão para trocar de posição.</span>
                            </div>
                        )}

                        <div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            onDragOver={handleDragOver}
                        >
                            {services.map((s, index) => (
                                <Card
                                    key={s.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDrop={() => handleDrop(index)}
                                    onClick={() => handleMobileServiceClick(index)}
                                    className={`bg-slate-900/50 backdrop-blur-sm border-slate-800 transition-all duration-300 ${!s.is_active ? 'opacity-50 grayscale' : ''} ${draggedItemIndex === index ? 'opacity-30 scale-95 border-blue-500 border-dashed' : ''} ${mobileSelectedItemIndex === index ? 'ring-2 ring-blue-500 border-blue-500 scale-[1.02] shadow-lg shadow-blue-500/10' : 'hover:border-slate-700 hover:bg-slate-900'} cursor-pointer select-none group`}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="hidden md:flex cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 transition-colors">
                                                    <GripVertical className="h-5 w-5" />
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-all shadow-inner">
                                                    {getServiceIcon(s.icon_name)}
                                                </div>
                                            </div>
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title={s.is_active ? "Bloquear serviço" : "Ativar serviço"}
                                                    className={`${s.is_active ? 'text-slate-400 hover:text-amber-500' : 'text-emerald-400 hover:bg-emerald-500/10'} pointer-events-auto`}
                                                    onClick={async () => {
                                                        try {
                                                            const active = !s.is_active;
                                                            const { error } = await (supabase as any).from('servicos').update({ is_active: active } as any).eq('id', s.id);
                                                            if (error) throw error;
                                                            setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: active } : x));
                                                            toast.success(active ? "Serviço Ativado" : "Serviço Bloqueado");
                                                        } catch (err) {
                                                            console.error("Erro ao atualizar status:", err);
                                                            toast.error("Erro ao atualizar status");
                                                        }
                                                    }}
                                                >
                                                    {s.is_active ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                </Button>
                                                <ServiceDialog
                                                    service={s}
                                                    onSave={async (updated) => {
                                                        try {
                                                            const { error } = await (supabase as any).from('servicos').update(updated as any).eq('id', s.id);
                                                            if (error) throw error;
                                                            setServices(prev => prev.map(x => x.id === s.id ? { ...x, ...updated } : x));
                                                            toast.success("Serviço atualizado");
                                                        } catch (err) {
                                                            console.error("Erro ao editar serviço:", err);
                                                            toast.error("Erro ao editar serviço");
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                                                    onClick={async () => {
                                                        if (confirm(`Deseja realmente excluir o serviço \"${s.title}\"?`)) {
                                                            try {
                                                                const { error } = await (supabase as any).from('servicos').delete().eq('id', s.id);
                                                                if (error) throw error;
                                                                setServices(prev => prev.filter(x => x.id !== s.id));
                                                                toast.success("Serviço excluído");
                                                            } catch (err) {
                                                                console.error("Erro ao excluir serviço:", err);
                                                                toast.error("Erro ao excluir serviço");
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl mt-4 font-bold text-slate-100 tracking-tight group-hover:text-white transition-colors">{s.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 min-h-[40px]">{s.description}</p>
                                        <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between text-[11px] uppercase font-bold tracking-widest">
                                            <span className={s.is_active ? 'text-emerald-400 flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                                                {s.is_active ? 'No Site' : 'Bloqueado'}
                                            </span>
                                            <span className="text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50"># {String(index + 1).padStart(2, '0')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {view === "financeiro" && (
                    <FinancialTab
                        transactions={financeiro}
                        registros={registros}
                        preSelectedClient={preSelectedClient}
                        onClearPreSelected={() => setPreSelectedClient(null)}
                        onTransactionAdded={fetchFinanceiro}
                    />
                )}

                <footer className="pt-12 text-slate-600 text-xs border-t border-slate-900 text-center pb-8">
                    &copy; {new Date().getFullYear()} Magnavita Serviços Marítimos. Sistema GFM (Gestão de Fluxo Marítimo).
                </footer>
            </div>
        </div>
    );
};

const NoteDialog = ({ id, initialNote, onSave }: { id: string; initialNote: string; onSave: (id: string, note: string) => void }) => {
    const [note, setNote] = useState(initialNote);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className={`${note ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10' : 'text-slate-400 hover:text-slate-300'}`}
            >
                <StickyNote className="h-4 w-4" />
            </Button>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <StickyNote className="h-5 w-5 text-blue-500" />
                        Anotações do Cliente
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Escreva anotações internas sobre este processo..."
                        className="bg-slate-950 border-slate-700 min-h-[150px] focus:ring-blue-500"
                    />
                    <Button
                        onClick={() => {
                            onSave(id, note);
                            setIsOpen(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        <Save className="h-4 w-4 mr-2" /> Salvar Anotações
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ServiceDialog = ({ service, onSave }: { service?: Service; onSave: (s: any) => Promise<void> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState(service?.title || "");
    const [description, setDescription] = useState(service?.description || "");
    const [iconName, setIconName] = useState(service?.icon_name || "FileText");
    const [order, setOrder] = useState(service?.order_index || 0);

    const icons = ["FileText", "Shield", "Stamp", "CreditCard", "Award", "Ship", "Navigation", "GraduationCap", "Compass", "Scroll", "ShieldCheck"];

    useEffect(() => {
        if (service) {
            setTitle(service.title);
            setDescription(service.description);
            setIconName(service.icon_name);
            setOrder(service.order_index);
        }
    }, [service]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {service ? (
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400">
                        <Edit3 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle>{service ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase">Título do Serviço</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-950 border-slate-700" placeholder="Ex: Renovação de CIR" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase">Descrição Curta</label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-slate-950 border-slate-700 h-20" placeholder="Breve explicação do serviço..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 font-bold uppercase">Ícone</label>
                            <select
                                value={iconName}
                                onChange={(e) => setIconName(e.target.value)}
                                className="w-full h-10 rounded-md bg-slate-950 border-slate-700 text-sm px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {icons.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 font-bold uppercase">Ordem (Site)</label>
                            <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value))} className="bg-slate-950 border-slate-700" />
                        </div>
                    </div>
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                        onClick={async () => {
                            await onSave({ title, description, icon_name: iconName, order_index: order });
                            setIsOpen(false);
                            if (!service) { setTitle(""); setDescription(""); setIconName("FileText"); setOrder(0); }
                        }}
                    >
                        {service ? "Salvar Alterações" : "Criar Serviço"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Dashboard;
