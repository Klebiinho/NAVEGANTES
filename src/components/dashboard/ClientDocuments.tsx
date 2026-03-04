import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2, Trash2, Download, FileText, Image as ImageIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const ClientDocuments = ({ cpf, name }: { cpf: string; name: string }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cpf]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from('procuracoes')
                .list(`anexos_cliente/${cpf}`);

            if (error) throw error;

            // Filter out empty placeholder files if any
            const actualFiles = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder');
            setFiles(actualFiles);
        } catch (error) {
            console.error("Erro ao listar anexos do cliente:", error);
            // Don't show toast on load failure to avoid spamming the user if bucket policy restricts listing
            // we will just see an empty list.
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        try {
            const uploadedFiles = Array.from(e.target.files);

            for (const file of uploadedFiles) {
                // Ensure unique name by prefixing with timestamp, while keeping original file extension and safe name
                const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
                const path = `anexos_cliente/${cpf}/${Date.now()}_${safeName}`;

                const { error } = await supabase.storage
                    .from('procuracoes')
                    .upload(path, file);

                if (error) {
                    console.error("Erro no upload (Pode ser conflito de RLS):", error);
                    throw new Error(`Falha ao enviar: ${file.name}`);
                }
            }

            toast.success(`${uploadedFiles.length} arquivo(s) anexado(s) com sucesso`);
            fetchFiles();
        } catch (error: any) {
            console.error("Erro de upload:", error);
            toast.error(error.message || "Erro ao fazer upload dos documentos");
        } finally {
            setUploading(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (fileName: string) => {
        try {
            const path = `anexos_cliente/${cpf}/${fileName}`;
            const { error } = await supabase.storage
                .from('procuracoes')
                .remove([path]);

            if (error) throw error;

            toast.success("Anexo removido com sucesso");
            fetchFiles();
        } catch (error) {
            console.error("Erro ao remover:", error);
            toast.error("Erro ao remover o anexo");
        }
    };

    const handleDownload = async (fileName: string) => {
        const path = `anexos_cliente/${cpf}/${fileName}`;
        const { data } = supabase.storage.from('procuracoes').getPublicUrl(path);

        if (data?.publicUrl) {
            window.open(data.publicUrl, '_blank');
        } else {
            toast.error("Erro ao obter link do documento");
        }
    };

    const isImage = (name: string) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" /> Anexos do Cliente (CPF: {cpf})
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Guarde RG, CNH, Comprovante de Residência aqui.</p>
                </div>

                <div>
                    <input
                        type="file"
                        id={`file-upload-${cpf}`}
                        className="hidden"
                        multiple
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <label htmlFor={`file-upload-${cpf}`}>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                            asChild
                        >
                            <span className="cursor-pointer flex items-center gap-2">
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                                {uploading ? "Enviando..." : "Adicionar Anexo"}
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>
            ) : files.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500 border border-dashed border-slate-800 rounded-md">
                    Nenhum documento anexado para {name}.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map((file) => (
                        <div key={file.id || file.name} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-md hover:border-slate-700 transition-colors">
                            <div
                                className="flex items-center gap-3 overflow-hidden cursor-pointer"
                                onClick={() => handleDownload(file.name)}
                                title="Visualizar / Baixar"
                            >
                                <div className="h-8 w-8 bg-slate-800 rounded flex items-center justify-center shrink-0 text-slate-400">
                                    {isImage(file.name) ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-medium text-slate-300 truncate">{file.name.replace(/^\d+_/, '')}</p>
                                    <p className="text-[10px] text-slate-500">{(file.metadata?.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                                    onClick={() => handleDownload(file.name)}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Anexo?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-slate-400">
                                                Deseja mesmo remover permanentemente "{file.name.replace(/^\d+_/, '')}" do servidor?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(file.name)}
                                                className="bg-red-600 hover:bg-red-700 text-white border-none"
                                            >
                                                Sim, excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
