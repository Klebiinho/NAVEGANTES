import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileDown, Plus, TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, Calendar, CalendarDays, BarChart3, Clock, CheckCircle2, Search, Edit, Trash2, AlertTriangle, ChevronRight, Filter, Download, Paperclip } from "lucide-react";
import { format, parseISO, isBefore, isAfter, isToday, isSameMonth, addMonths, addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNotifications } from "@/hooks/use-notifications";

export interface Transaction {
    id: string;
    created_at: string;
    tipo: "Receita" | "Despesa";
    cliente: string;
    valor: number;
    status: "Pago" | "Pendente" | "Atrasado";
    forma_pagamento: string;
    parcelas: number;
    data_pagamento: string;
    descricao?: string;
    servico?: string;
    registro_id?: string;
    comprovante_url?: string;
}

export interface Registro {
    id: string;
    nome_paciente?: string;
    name: string;
    cpf: string;
    service_title: string;
    [key: string]: unknown;
}

interface FinancialTabProps {
    transactions: Transaction[];
    registros: Registro[];
    preSelectedClient?: Registro | null;
    onClearPreSelected?: () => void;
    onTransactionAdded: () => void;
}

export function FinancialTab({ transactions, registros, preSelectedClient, onClearPreSelected, onTransactionAdded }: FinancialTabProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [tipo, setTipo] = useState<"Receita" | "Despesa">("Receita");
    const [cliente, setCliente] = useState("");
    const [valor, setValor] = useState("");
    const [status, setStatus] = useState<"Pago" | "Pendente" | "Atrasado">("Pendente");
    const [formaPagamento, setFormaPagamento] = useState("PIX");
    const [parcelas, setParcelas] = useState("1");
    const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
    const [descricao, setDescricao] = useState("");
    const [servico, setServico] = useState("");
    const [docReferencia, setDocReferencia] = useState("");
    const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
    const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);

    // Filter states
    const currentMonth = format(new Date(), 'yyyy-MM');
    const [filterText, setFilterText] = useState("");
    const [filterTipo, setFilterTipo] = useState("Todos");
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [filterMonth, setFilterMonth] = useState(currentMonth); // Default to current month (Mensal)

    const { requestPermissions, scheduleFinancialNotifications } = useNotifications();

    useEffect(() => {
        requestPermissions();
    }, []);

    useEffect(() => {
        if (transactions.length > 0) {
            scheduleFinancialNotifications(transactions);
        }
    }, [transactions]);

    useEffect(() => {
        if (preSelectedClient) {
            setCliente(preSelectedClient.name);
            setDescricao(`Referente ao serviço: ${preSelectedClient.service_title}\nDoc: CERT./CIR/CHA`);
            setIsAddModalOpen(true);
        }
    }, [preSelectedClient]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Derived values for filtering
    const uniqueMonths = Array.from(new Set(transactions.map(t => format(parseISO(t.data_pagamento), 'yyyy-MM')))).sort().reverse();

    const filteredTransactions = transactions.filter((t: Transaction) => {
        const textToSearch = `${t.cliente} ${t.descricao || ""} ${t.servico || ""}`.toLowerCase();
        const matchText = textToSearch.includes(filterText.toLowerCase());
        const matchTipo = filterTipo === "Todos" ? true : t.tipo === filterTipo;
        const matchStatus = filterStatus === "Todos" ? true : t.status === filterStatus;

        // Safety check for date formatting to prevent invalid date errors
        let matchMonth = true;
        if (filterMonth === "Hoje") {
            matchMonth = isToday(parseISO(t.data_pagamento));
        } else if (filterMonth === "Este Ano") {
            matchMonth = format(parseISO(t.data_pagamento), 'yyyy') === format(new Date(), 'yyyy');
        } else if (filterMonth !== "Todos") {
            try {
                const txMonth = format(parseISO(t.data_pagamento), 'yyyy-MM');
                matchMonth = txMonth === filterMonth;
            } catch (e) {
                matchMonth = false;
            }
        }

        return matchText && matchTipo && matchStatus && matchMonth;
    });

    const totalReceitas = filteredTransactions
        .filter(t => t.tipo === "Receita" && t.status === "Pago")
        .reduce((acc, curr) => acc + curr.valor, 0);

    const totalDespesas = filteredTransactions
        .filter(t => t.tipo === "Despesa" && t.status === "Pago")
        .reduce((acc, curr) => acc + curr.valor, 0);

    const saldo = totalReceitas - totalDespesas;

    // Process data for the chart using FILTERED transactions
    const processChartData = () => {
        const monthlyData: Record<string, { month: string, Receitas: number, Despesas: number }> = {};

        filteredTransactions.forEach(t => {
            if (t.status !== "Pago") return; // Only count paid

            const date = new Date(t.data_pagamento);
            // ensure date is valid before formatting
            if (isNaN(date.getTime())) return;

            const monthKey = format(date, 'MM/yyyy');
            const monthName = format(date, 'MMM/yy', { locale: ptBR });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthName, Receitas: 0, Despesas: 0 };
            }

            if (t.tipo === "Receita") {
                monthlyData[monthKey].Receitas += Number(t.valor);
            } else {
                monthlyData[monthKey].Despesas += Number(t.valor);
            }
        });

        // Sort keys to maintain chronological order
        return Object.keys(monthlyData).sort().map(k => monthlyData[k]);
    };

    const chartData = processChartData();

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const numParcelas = parseInt(parcelas);
            const baseValue = parseFloat(valor.replace(',', '.'));
            const installmentValue = numParcelas > 1 ? baseValue / numParcelas : baseValue;

            let finalComprovanteUrl = comprovanteUrl;

            if (comprovanteFile) {
                const fileExt = comprovanteFile.name.split('.').pop();
                const fileName = `comprovantes/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('procuracoes')
                    .upload(fileName, comprovanteFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('procuracoes')
                    .getPublicUrl(fileName);

                finalComprovanteUrl = publicUrl;
            }

            // Define payload correctly matching DB schema
            const basePayload: any = {
                tipo: tipo as "Receita" | "Despesa",
                cliente: cliente.toUpperCase(),
                valor: baseValue,
                status: status as "Pago" | "Pendente" | "Atrasado",
                forma_pagamento: formaPagamento,
                parcelas: numParcelas,
                data_pagamento: dataPagamento,
                descricao: docReferencia ? `[CERT/CIR/CHA: ${docReferencia}] ${descricao || ''}`.trim() : (descricao || null),
                servico: servico === "none" ? null : servico || null,
                comprovante_url: finalComprovanteUrl || null,
                registro_id: preSelectedClient?.id || null
            };

            if (editingId) {
                const { error } = await (supabase as any)
                    .from('financeiro')
                    .update(basePayload)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success("Transação atualizada com sucesso!");
            } else {
                // Generate multiple records for installments if greater than 1
                const payloads: any[] = [];
                const baseDate = parseISO(dataPagamento);

                for (let i = 0; i < numParcelas; i++) {
                    const nextDate = addMonths(baseDate, i);

                    payloads.push({
                        ...basePayload,
                        valor: installmentValue,
                        status: (i === 0 ? status : "Pendente") as "Pago" | "Pendente" | "Atrasado", // Only first might be paid immediately
                        comprovante_url: (i === 0 && status === 'Pago') ? (finalComprovanteUrl || null) : null,
                        data_pagamento: format(nextDate, 'yyyy-MM-dd'),
                        descricao: numParcelas > 1
                            ? `${descricao ? descricao + ' | ' : ''}Parcela ${i + 1}/${numParcelas}`
                            : (descricao || null)
                    });
                }

                const { error } = await (supabase as any)
                    .from('financeiro')
                    .insert(payloads);
                if (error) throw error;
                toast.success(numParcelas > 1 ? `${numParcelas} parcelas geradas com sucesso!` : "Transação adicionada com sucesso!");
            }

            setIsAddModalOpen(false);
            onTransactionAdded(); // trigger refresh
            resetForm();
        } catch (error: Error | unknown) {
            console.error("Erro ao salvar transação:", error);
            const msg = error instanceof Error ? error.message : "Erro ao salvar transação";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        try {
            const { error } = await supabase
                .from('financeiro')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success("Transação excluída!");
            onTransactionAdded(); // refresh list
        } catch (error: Error | unknown) {
            console.error("Erro ao excluir:", error);
            toast.error("Falha ao excluir a transação.");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        if (currentStatus === 'Pago') return; // Do nothing if already paid via quick toggle
        try {
            const { error } = await (supabase as any)
                .from('financeiro')
                .update({ status: 'Pago' })
                .eq('id', id);
            if (error) throw error;
            toast.success("Status atualizado para Pago!");
            onTransactionAdded();
        } catch (error: Error | unknown) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Falha ao atualizar o status.");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setTipo("Receita");
        setCliente("");
        setValor("");
        setStatus("Pendente");
        setFormaPagamento("PIX");
        setParcelas("1");
        setDataPagamento(new Date().toISOString().split('T')[0]);
        setDescricao("");
        setServico("");
        setDocReferencia("");
        setComprovanteFile(null);
        setComprovanteUrl(null);
    };

    const openEditModal = (t: Transaction) => {
        setEditingId(t.id);
        setTipo(t.tipo);
        setCliente(t.cliente);
        setValor(t.valor.toString());
        setStatus(t.status);
        setFormaPagamento(t.forma_pagamento);
        setParcelas(t.parcelas.toString());
        setDataPagamento(t.data_pagamento);
        setDescricao(t.descricao || "");
        setServico(t.servico || "");
        setDocReferencia(""); // Default to empty when editing since it gets grouped into description
        setComprovanteFile(null);
        setComprovanteUrl(t.comprovante_url || null);
        setIsAddModalOpen(true);
    };
    const exportToCSV = () => {
        if (filteredTransactions.length === 0) {
            toast.warning("Não há dados para exportar.");
            return;
        }

        const headers = ["ID", "Data Pagamento/Vencimento", "Tipo", "Cliente", "Serviço", "Valor", "Status", "Forma de Pagamento", "Parcelas", "Descrição"];
        const rows = filteredTransactions.map(t => [
            t.id,
            format(parseISO(t.data_pagamento), 'dd/MM/yyyy'),
            t.tipo,
            `"${t.cliente}"`,
            `"${t.servico && t.servico !== 'none' ? t.servico : '-'}"`,
            t.valor.toFixed(2).replace('.', ','),
            t.status,
            t.forma_pagamento,
            t.parcelas,
            `"${t.descricao || ""}"`
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(r => r.join(";"))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_financeiro_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-emerald-500" />
                    Gestão Financeira
                </h2>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-200" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                    <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                        setIsAddModalOpen(open);
                        if (!open) {
                            onClearPreSelected?.();
                            resetForm();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={resetForm}>
                                <Plus className="mr-2 h-4 w-4" /> Nova Transação
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">{editingId ? "Editar Registro Financeiro" : "Adicionar Registro Financeiro"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddTransaction} className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select value={tipo} onValueChange={(val) => setTipo(val as "Receita" | "Despesa")}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                                <SelectItem value="Receita">Receita</SelectItem>
                                                <SelectItem value="Despesa">Despesa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Valor (R$)</Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={valor}
                                            onChange={e => setValor(e.target.value)}
                                            className="bg-slate-800 border-slate-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2 relative">
                                        <Label>Cliente / Fornecedor <span className="text-xs text-slate-500 font-normal">(Busque ou Selecione)</span></Label>
                                        <Input
                                            required
                                            value={cliente}
                                            onChange={e => setCliente(e.target.value)}
                                            className="bg-slate-800 border-slate-700 uppercase"
                                            placeholder="Nome da pessoa ou empresa"
                                        />
                                        {cliente.length > 2 && registros.filter(r => (r.name || r.nome_paciente || '').toLowerCase().includes(cliente.toLowerCase()) || (r.cpf || '').includes(cliente)).filter(r => (r.name || r.nome_paciente || '').toUpperCase() !== cliente.toUpperCase()).slice(0, 5).length > 0 && (
                                            <div className="absolute z-10 w-full bg-slate-800 border border-slate-700 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                                                {registros.filter(r => (r.name || r.nome_paciente || '').toLowerCase().includes(cliente.toLowerCase()) || (r.cpf || '').includes(cliente)).filter(r => (r.name || r.nome_paciente || '').toUpperCase() !== cliente.toUpperCase()).slice(0, 5).map(r => (
                                                    <div
                                                        key={r.id}
                                                        className="p-2 hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-700 last:border-0"
                                                        onClick={() => {
                                                            setCliente(r.name || r.nome_paciente || '');
                                                            // Match dropdown exactly by title or fallback to "none" if unmatched/freetext
                                                            const validServices = ["Emissão Certificado", "Renovação ou 2ª via Certificado 1034", "Emissão ou Renovação Certificado 1031", "Renovação CIR – Etiqueta de dados", "2ª via CIR (Término de espaço)", "Ascensão de Categoria", "Emissão e Renovação Arrais e Mestre Amador", "Homologação de certificado", "Endosso de Certificado", "Emissão e renovação Identidade de Aquaviário", "Consultoria"];
                                                            setServico(validServices.includes(r.service_title) ? r.service_title : "none");
                                                            setDescricao((prev) => prev ? prev : `Processo / CPF: ${r.cpf || 'N/A'}`);
                                                        }}
                                                    >
                                                        <div className="font-medium text-slate-200">{r.name || r.nome_paciente}</div>
                                                        <div className="text-xs text-slate-400">CPF: {r.cpf || 'N/A'} - Serv: {r.service_title}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs text-slate-400 w-full">Últimos clientes do site:</span>
                                        {registros.slice(0, 5).map(r => (
                                            <div
                                                key={r.id}
                                                className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setCliente(r.name || r.nome_paciente || '');
                                                    const validServices = ["Emissão Certificado", "Renovação ou 2ª via Certificado 1034", "Emissão ou Renovação Certificado 1031", "Renovação CIR – Etiqueta de dados", "2ª via CIR (Término de espaço)", "Ascensão de Categoria", "Emissão e Renovação Arrais e Mestre Amador", "Homologação de certificado", "Endosso de Certificado", "Emissão e renovação Identidade de Aquaviário", "Consultoria"];
                                                    setServico(validServices.includes(r.service_title) ? r.service_title : "none");
                                                    setDescricao((prev) => prev ? prev : `Processo / CPF: ${r.cpf || 'N/A'}`);
                                                }}
                                            >
                                                {(r.name || r.nome_paciente || '').split(' ')[0]} {(r.name || r.nome_paciente || '').split(' ').pop()}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={status} onValueChange={(val) => setStatus(val as "Pago" | "Pendente" | "Atrasado")}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                                <SelectItem value="Pago">Pago</SelectItem>
                                                <SelectItem value="Pendente">Pendente</SelectItem>
                                                <SelectItem value="Atrasado">Atrasado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data de Pagamento/Vencimento</Label>
                                        <Input
                                            required
                                            type="date"
                                            value={dataPagamento}
                                            onChange={e => setDataPagamento(e.target.value)}
                                            className="bg-slate-800 border-slate-700"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Forma de Pagamento</Label>
                                        <Select value={formaPagamento} onValueChange={val => setFormaPagamento(val)}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                                <SelectItem value="PIX">PIX</SelectItem>
                                                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                                <SelectItem value="Boleto">Boleto</SelectItem>
                                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                                <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Parcelas</Label>
                                        <Input
                                            required
                                            type="number"
                                            min="1"
                                            max="48"
                                            value={parcelas}
                                            onChange={e => setParcelas(e.target.value)}
                                            className="bg-slate-800 border-slate-700"
                                        />
                                    </div>

                                    {status === 'Pago' && (
                                        <div className="space-y-2 col-span-2">
                                            <Label>Comprovante (Opcional)</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    onChange={e => setComprovanteFile(e.target.files ? e.target.files[0] : null)}
                                                    className="bg-slate-800 border-slate-700 w-full cursor-pointer file:text-slate-300 file:bg-slate-700 file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded"
                                                />
                                                {comprovanteUrl && (
                                                    <Button type="button" variant="outline" size="sm" onClick={() => window.open(comprovanteUrl, '_blank')} className="border-slate-700 whitespace-nowrap text-slate-300">
                                                        <Paperclip className="h-4 w-4 mr-2" />
                                                        Ver Atual
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Serviço Vinculado</Label>
                                        <Select value={servico} onValueChange={setServico}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                                                <SelectValue placeholder="Selecione um serviço (Opcional)" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                                <SelectItem value="none">Nenhum Serviço / Outros</SelectItem>
                                                <SelectItem value="Emissão Certificado">Emissão Certificado</SelectItem>
                                                <SelectItem value="Renovação ou 2ª via Certificado 1034">Renovação ou 2ª via Certificado 1034</SelectItem>
                                                <SelectItem value="Emissão ou Renovação Certificado 1031">Emissão ou Renovação Certificado 1031</SelectItem>
                                                <SelectItem value="Renovação CIR – Etiqueta de dados">Renovação CIR – Etiqueta de dados</SelectItem>
                                                <SelectItem value="2ª via CIR (Término de espaço)">2ª via CIR (Término de espaço)</SelectItem>
                                                <SelectItem value="Ascensão de Categoria">Ascensão de Categoria</SelectItem>
                                                <SelectItem value="Emissão e Renovação Arrais e Mestre Amador">Emissão e Renovação Arrais e Mestre Amador</SelectItem>
                                                <SelectItem value="Homologação de certificado">Homologação de certificado</SelectItem>
                                                <SelectItem value="Endosso de Certificado">Endosso de Certificado</SelectItem>
                                                <SelectItem value="Emissão e renovação Identidade de Aquaviário">Emissão e renovação Identidade de Aquaviário</SelectItem>
                                                <SelectItem value="Consultoria">Consultoria</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CERT. / CIR / CHA (Opcional)</Label>
                                        <Input
                                            value={docReferencia}
                                            onChange={e => setDocReferencia(e.target.value)}
                                            className="bg-slate-800 border-slate-700"
                                            placeholder="Nº do documento"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição (Opcional)</Label>
                                    <Textarea
                                        value={descricao}
                                        onChange={e => setDescricao(e.target.value)}
                                        className="bg-slate-800 border-slate-700 min-h-[80px]"
                                        placeholder="Detalhes ou observações sobre esta transação..."
                                    />
                                </div>

                                <div className="flex justify-end pt-4 gap-2">
                                    <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); onClearPreSelected?.(); }} className="border-slate-700 text-slate-300">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                        {loading ? "Salvando..." : "Salvar Transação"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Receitas (Pagas)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalReceitas)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Despesas (Pagas)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">{formatCurrency(totalDespesas)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Líquido Ajustado</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatCurrency(saldo)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Total Transações</CardTitle>
                        <BarChart3 className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{filteredTransactions.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="visao-geral" className="w-full">
                <TabsList className="bg-slate-900 border-slate-800 mb-4 h-auto flex-wrap p-1">
                    <TabsTrigger value="visao-geral" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 py-3 mb-1 sm:mb-0">
                        <BarChart3 className="w-4 h-4 mr-2" /> Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="agenda" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 py-3 mb-1 sm:mb-0">
                        <CalendarDays className="w-4 h-4 mr-2" /> Agenda
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="visao-geral" className="space-y-6">
                    {/* Chart Section */}
                    <div className="grid grid-cols-1 gap-6">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-slate-400" />
                                    Mês a Mês
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {chartData.length > 0 ? (
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                                    formatter={(value: number) => [formatCurrency(value), '']}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} name="Receitas" />
                                                <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Despesas" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[300px] w-full flex items-center justify-center text-slate-400 font-medium">
                                        Sem dados suficientes para exibir o gráfico.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters Section */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-4 flex flex-col gap-4">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Buscar cliente ou descrição..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="bg-slate-800 border-slate-700 pl-9 w-full text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                                <Select value={filterMonth} onValueChange={setFilterMonth}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 w-full text-slate-100">
                                        <SelectValue placeholder="Mês" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                        <SelectItem value="Todos">Todo período</SelectItem>
                                        <SelectItem value="Hoje">Diário (Hoje)</SelectItem>
                                        <SelectItem value={currentMonth}>Mensal (Mês Atual)</SelectItem>
                                        <SelectItem value="Este Ano">Anual (Ano Atual)</SelectItem>
                                        <div className="h-px bg-slate-700 my-1 mx-2" />
                                        {uniqueMonths.filter(m => m !== currentMonth).map(m => (
                                            <SelectItem key={m} value={m}>{format(parseISO(`${m}-01`), 'MMM yyyy', { locale: ptBR })}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterTipo} onValueChange={setFilterTipo}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 w-full text-slate-100">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                        <SelectItem value="Todos">Qualquer Tipo</SelectItem>
                                        <SelectItem value="Receita">Receita</SelectItem>
                                        <SelectItem value="Despesa">Despesa</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 w-full text-slate-100">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                        <SelectItem value="Todos">Qualquer Status</SelectItem>
                                        <SelectItem value="Pago">Pago</SelectItem>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transactions Table */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">Registros Financeiros</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-800 overflow-x-auto w-full">
                                <Table className="min-w-[800px]">
                                    <TableHeader className="bg-slate-900/50">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest min-w-[200px]">Cliente/Fornecedor</TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Serviço</TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest">Valor</TableHead>
                                            <TableHead className="text-slate-200 font-bold uppercase text-[10px] tracking-widest text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.length === 0 ? (
                                            <TableRow className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                                                <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium">
                                                    Nenhum registro financeiro encontrado para estes filtros.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredTransactions.map((t) => (
                                                <TableRow key={t.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors group">
                                                    <TableCell>
                                                        <div className="text-sm text-slate-300">
                                                            {format(new Date(t.data_pagamento), 'dd/MM/yyyy')}
                                                        </div>
                                                        {t.registro_id && <div className="text-xs text-blue-400">(Site)</div>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-slate-100 truncate max-w-[200px]" title={t.cliente}>{t.cliente}</div>
                                                        <div className="text-xs text-slate-400 line-clamp-1 max-w-[200px] mt-0.5" title={t.descricao}>
                                                            {t.parcelas > 1 ? `${t.parcelas}x parcelas` : 'À vista'}
                                                            {t.descricao && ` • ${t.descricao}`}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-300 max-w-[150px] truncate" title={t.servico || '-'}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{t.servico && t.servico !== 'none' ? t.servico : '-'}</span>
                                                            {t.comprovante_url && (
                                                                <a href={t.comprovante_url} target="_blank" rel="noreferrer" title="Ver Comprovante" onClick={(e) => e.stopPropagation()}>
                                                                    <Paperclip className="h-4 w-4 text-blue-400 hover:text-blue-300" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className={`font-semibold ${t.tipo === 'Receita' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {t.tipo === 'Receita' ? '+' : '-'}{formatCurrency(t.valor)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${t.status === 'Pago'
                                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                : t.status === 'Pendente'
                                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                                }`}>
                                                                {t.status}
                                                            </div>

                                                            {/* Actions - Always visible on small screens, hover on larger */}
                                                            <div className="flex md:opacity-0 group-hover:opacity-100 transition-opacity flex-wrap items-center gap-1 ml-2 justify-end min-w-[100px]">
                                                                {t.status !== 'Pago' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                                        onClick={() => handleToggleStatus(t.id, t.status)}
                                                                        title="Marcar como Pago"
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                                                    onClick={() => openEditModal(t)}
                                                                    title="Editar"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                                                            title="Excluir"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
                                                                            <AlertDialogDescription className="text-slate-300">
                                                                                Tem certeza que deseja excluir esta transação de <b>{formatCurrency(t.valor)}</b> do cliente <b>{t.cliente}</b>?
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white">Cancelar</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteTransaction(t.id)}
                                                                                className="bg-rose-600 hover:bg-rose-700 text-white border-none"
                                                                            >
                                                                                Excluir
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent >

                <TabsContent value="agenda" className="space-y-6">
                    {/* Dashboard Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-rose-950/20 border-rose-900/50 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-rose-300">Atrasados</CardTitle>
                                <AlertCircle className="h-4 w-4 text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-500">
                                    {transactions.filter(t => t.status === "Pendente" || t.status === "Atrasado").filter(t => isBefore(parseISO(t.data_pagamento), new Date()) && !isToday(parseISO(t.data_pagamento))).length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-amber-950/20 border-amber-900/50 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-400">Vencendo Hoje</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-500">
                                    {transactions.filter(t => t.status !== "Pago" && isToday(parseISO(t.data_pagamento))).length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-blue-950/20 border-blue-900/50 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-300">Próximos 7 Dias</CardTitle>
                                <Clock className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-500">
                                    {transactions.filter(t => t.status !== "Pago" && isWithinInterval(parseISO(t.data_pagamento), { start: addDays(new Date(), 1), end: addDays(new Date(), 7) })).length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline / Agenda List */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-slate-400" />
                                Próximos Vencimentos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {/* Grouping logic for Agenda */}
                                {(() => {
                                    const agendaTransactions = transactions
                                        .filter(t => t.status !== "Pago") // Currently showing only pending/overdue in agenda to focus on action items
                                        .sort((a, b) => new Date(a.data_pagamento).getTime() - new Date(b.data_pagamento).getTime());

                                    if (agendaTransactions.length === 0) {
                                        return (
                                            <div className="text-center py-12 text-slate-400 font-medium">
                                                Nenhum pagamento pendente no radar. Ótimo trabalho!
                                            </div>
                                        );
                                    }

                                    // Group by Date
                                    const grouped = agendaTransactions.reduce((acc, curr) => {
                                        const dateKey = format(parseISO(curr.data_pagamento), 'yyyy-MM-dd');
                                        if (!acc[dateKey]) acc[dateKey] = [];
                                        acc[dateKey].push(curr);
                                        return acc;
                                    }, {} as Record<string, typeof transactions>);

                                    return Object.entries(grouped).map(([date, items]) => {
                                        const itemDate = parseISO(date);
                                        const isPast = isBefore(itemDate, startOfDay(new Date()));
                                        const isCurrent = isToday(itemDate);

                                        let dateLabel = format(itemDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
                                        if (isCurrent) dateLabel = "Hoje";
                                        else if (format(addDays(new Date(), 1), 'yyyy-MM-dd') === date) dateLabel = "Amanhã";
                                        else if (format(addDays(new Date(), -1), 'yyyy-MM-dd') === date) dateLabel = "Ontem";

                                        return (
                                            <div key={date} className="relative">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className={`
                                                        px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                        ${isCurrent ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                            isPast ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                                'bg-slate-800 text-slate-200 border border-slate-700'}
                                                    `}>
                                                        {dateLabel}
                                                    </div>
                                                    <div className="h-px bg-slate-800 flex-1"></div>
                                                </div>

                                                <div className="space-y-3 pl-2 border-l-2 border-slate-800/50 ml-4">
                                                    {items.map(t => (
                                                        <div key={t.id} className="relative flex items-center justify-between p-4 rounded-lg bg-slate-800/20 border border-slate-800 hover:bg-slate-800/40 transition-colors group">

                                                            {/* Status Indicator Dot */}
                                                            <div className={`absolute -left-[21px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-4 ring-slate-900 
                                                                ${t.status === 'Atrasado' || (t.status === 'Pendente' && isPast) ? 'bg-rose-500' :
                                                                    isCurrent ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                            />

                                                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 flex-1">
                                                                <div className="md:w-1/4">
                                                                    <p className="font-bold text-slate-100 truncate">{t.cliente}</p>
                                                                    <p className="text-xs text-slate-400 truncate mt-0.5">{t.descricao || 'Sem descrição'}</p>
                                                                </div>
                                                                <div className="md:w-1/4 flex items-center text-sm text-slate-300 font-medium">
                                                                    <ChevronRight className="h-4 w-4 mr-1 opacity-50 hidden md:block" />
                                                                    {t.forma_pagamento}
                                                                </div>
                                                                <div className="md:w-1/4 flex items-center">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                                                        ${t.tipo === 'Receita' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}
                                                                    `}>
                                                                        {t.tipo}
                                                                    </span>
                                                                    {t.parcelas > 1 && (
                                                                        <span className="ml-2 text-xs text-slate-400">({t.parcelas}x)</span>
                                                                    )}
                                                                </div>
                                                                <div className="md:w-1/4 text-right">
                                                                    <p className={`font-semibold ${t.tipo === 'Receita' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {t.tipo === 'Receita' ? '+' : '-'}{formatCurrency(t.valor)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons - visible on mobile, hover on md */}
                                                            <div className="flex md:opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1 ml-4 justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                                    onClick={() => handleToggleStatus(t.id, t.status)}
                                                                    title="Marcar como Pago"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
