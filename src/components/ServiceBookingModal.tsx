import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateDocument, generatePDF, DocumentData } from "@/lib/document-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const isValidCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cleanCPF.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cleanCPF.substring(10, 11))) return false;
  return true;
};

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  rg: z.string().min(5, "RG inválido ou muito curto"),
  cpf: z.string().refine((val) => isValidCPF(val), { message: "CPF inválido, por favor verifique os números digitados" }),
  street: z.string().min(2, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  cep: z.string().min(8, "CEP inválido"),
});

interface ServiceBookingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTitle: string;
}

const ServiceBookingModal = ({ isOpen, onOpenChange, serviceTitle }: ServiceBookingModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      rg: "",
      cpf: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
    },
  });

  const cepValue = form.watch("cep");
  const cpfValue = form.watch("cpf");
  const rgValue = form.watch("rg");
  const nameValue = form.watch("name");

  const [nameWarning, setNameWarning] = useState<string | null>(null);
  const [matchedRecord, setMatchedRecord] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to normalize strings for comparison (remove accents, to lowercase)
  const normalizeString = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  // Helper inside component to format CPF as XXX.XXX.XXX-XX since DB usually stores it formatted
  const formatCPFForSearch = (val: string) => {
    const numbers = val.replace(/\D/g, "");
    if (numbers.length !== 11) return val;
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  useEffect(() => {
    const validateNameAgainstDocs = async () => {
      setNameWarning(null);
      setMatchedRecord(null);
      const cleanCpf = cpfValue?.replace(/\D/g, "");
      const cleanRg = rgValue?.replace(/\D/g, "");

      const hasValidCpf = cleanCpf?.length === 11;
      const hasValidRg = cleanRg?.length >= 5;

      // We only prompt auto-fill if CPF is fully typed because it's a strongly unique identifier
      if (hasValidCpf) {
        try {
          // Fetch all fields for the typed CPF
          const { data, error } = await supabase
            .from('registros')
            .select('*')
            .eq('cpf', formatCPFForSearch(cpfValue))
            .limit(1);

          if (!error && data && data.length > 0) {
            const dbRecord = data[0] as any;
            const dbName = dbRecord.name || dbRecord.nome_paciente || "";

            if (dbName) {
              const normalizedDbName = normalizeString(dbName);
              const normalizedInputName = normalizeString(nameValue || "");

              // If the typed name differs significantly from the registered one
              if ((nameValue || "").length > 2 && normalizedInputName !== normalizedDbName && !normalizedDbName.includes(normalizedInputName)) {
                setNameWarning(`Atenção: O CPF informado está registrado para "${dbName}". Verifique se o nome digitado está correto.`);
              }

              // Expose the entire matched record to trigger the Auto-fill UI
              setMatchedRecord(dbRecord);
            }
          }
        } catch (err) {
          console.error("Erro ao cruzar CPF:", err);
        }
      } else if (hasValidRg && (nameValue || "").length > 2) {
        // Fallback RG name warning code
        try {
          const { data, error } = await supabase
            .from('registros')
            .select('name, nome_paciente, rg')
            .ilike('rg', `%${cleanRg}%`)
            .limit(1);

          if (!error && data && data.length > 0) {
            const dbRecord = data[0] as any;
            const dbName = dbRecord.name || dbRecord.nome_paciente || "";
            if (dbName) {
              const normalizedDbName = normalizeString(dbName);
              const normalizedInputName = normalizeString(nameValue || "");
              if (normalizedInputName !== normalizedDbName && !normalizedDbName.includes(normalizedInputName)) {
                setNameWarning(`Atenção: O RG informado está registrado para "${dbName}". Verifique se o nome digitado está correto.`);
              }
            }
          }
        } catch (err) {
          console.error("Erro ao validar RG:", err);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      validateNameAgainstDocs();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [cpfValue, rgValue, nameValue]);

  const handleAutoFill = () => {
    if (!matchedRecord) return;

    // Attempt to parse out existing DB field structures (some fields might be nullish depending on old saves)
    const fillName = matchedRecord.name || matchedRecord.nome_paciente;
    if (fillName) form.setValue("name", fillName);
    if (matchedRecord.rg) form.setValue("rg", matchedRecord.rg);
    if (matchedRecord.cep) {
      const cleanCep = String(matchedRecord.cep).replace(/\\D/g, "");
      form.setValue("cep", cleanCep);
    }
    if (matchedRecord.street) form.setValue("street", matchedRecord.street);
    if (matchedRecord.number) form.setValue("number", matchedRecord.number);
    if (matchedRecord.neighborhood) form.setValue("neighborhood", matchedRecord.neighborhood);
    if (matchedRecord.city) form.setValue("city", matchedRecord.city);
    if (matchedRecord.state) form.setValue("state", matchedRecord.state);

    toast.success("Dados preenchidos automaticamente do cadastro!");
    setMatchedRecord(null); // Hide prompt after filling
    setNameWarning(null);
  };

  useEffect(() => {
    const fetchAddress = async () => {
      const cleanCep = cepValue?.replace(/\D/g, "");
      if (cleanCep?.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();

          if (data.erro) {
            toast.error("CEP não encontrado");
            return;
          }

          form.setValue("street", data.logradouro || "");
          form.setValue("neighborhood", data.bairro || "");
          form.setValue("city", data.localidade || "");
          form.setValue("state", data.uf || "");
          toast.success("Endereço preenchido automaticamente");
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        }
      }
    };

    fetchAddress();
  }, [cepValue, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const phoneNumber = "558193372621";

    // Formatting helpers
    const formatCPF = (val: string) => {
      const numbers = val.replace(/\D/g, "");
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    };

    const formatCEP = (val: string) => {
      const numbers = val.replace(/\D/g, "");
      return numbers.replace(/(\d{2})(\d{3})(\d{3})/, "$1.$2-$3");
    };

    const agora = new Date();
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const message = `[${serviceTitle}]

${values.name.toUpperCase()}
RG: ${values.rg.replace(/\D/g, "")}
CPF: ${formatCPF(values.cpf)}
Rua: ${values.street}, n° ${values.number}
Bairro: ${values.neighborhood}
CEP: ${formatCEP(values.cep)}
${values.city} – ${values.state}

${values.city} – ${values.state}, 
${agora.getDate()} de ${meses[agora.getMonth()]} de ${agora.getFullYear()}

${values.name.toUpperCase()}`;

    const encodedMessage = encodeURIComponent(message);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const whatsappUrl = isIOS
      ? `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`
      : `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    const dataDoc: DocumentData = {
      nome: values.name.toUpperCase(),
      rg: values.rg.replace(/\D/g, ""),
      cpf: formatCPF(values.cpf),
      rua: values.street,
      numero: values.number,
      bairro: values.neighborhood,
      cidade: values.city,
      estado: values.state,
      cep: formatCEP(values.cep),
      data_assinatura_completa: `${values.city} – ${values.state}, ${agora.getDate()} de ${meses[agora.getMonth()]} de ${agora.getFullYear()}`,
    };

    // --- SALVAR NO BANCO DE DADOS E UPLOAD ---
    const runSubmission = async () => {
      try {
        // Enviar o básico para o banco primeiro para garantir a sincronização rápida (Sync instant!)
        const { data: recordData, error: insertError } = await (supabase as any)
          .from('registros')
          .insert([
            {
              service_title: serviceTitle,
              name: values.name.toUpperCase(),
              rg: values.rg.replace(/\D/g, ""),
              cpf: formatCPF(values.cpf),
              street: values.street,
              number: values.number,
              neighborhood: values.neighborhood,
              city: values.city,
              state: values.state,
              cep: formatCEP(values.cep)
            }
          ])
          .select('id')
          .single();

        if (insertError) {
          console.error("Erro insert inicial:", insertError);
          // Ainda tentamos abrir o whatsapp mesmo com erro no banco
        }

        // Tentar abrir o whatsapp imediatamente após o insert do banco
        // Isso aproveita melhor a "gesture do usuário"
        window.location.assign(whatsappUrl);

        // Agora, em background (mesmo se mudar de app), tentamos gerar e atualizar arquivos
        if (recordData?.id) {
          const docBlob = await generateDocument(dataDoc);
          const pdfBlob = await generatePDF(dataDoc);

          let wordPath = null;
          let pdfPath = null;
          const baseFileName = `${Date.now()}_${values.name.toUpperCase().replace(/\s/g, "_")}`;

          if (docBlob) {
            const { data } = await supabase.storage.from('procuracoes').upload(`${baseFileName}.docx`, docBlob);
            if (data?.path) wordPath = data.path;
          }

          if (pdfBlob) {
            const { data } = await supabase.storage.from('procuracoes').upload(`${baseFileName}.pdf`, pdfBlob);
            if (data?.path) pdfPath = data.path;
          }

          if (wordPath || pdfPath) {
            await (supabase as any)
              .from('registros')
              .update({ document_url: wordPath, pdf_url: pdfPath })
              .eq('id', recordData.id);
          }
        }
      } catch (err) {
        console.error("Erro no processamento:", err);
        // Fallback redundante para WhatsApp caso tenha travado antes
        window.location.assign(whatsappUrl);
      } finally {
        setIsSubmitting(false);
        onOpenChange(false);
        form.reset();
        toast.success("Solicitação processada com sucesso!");
      }
    };

    await runSubmission();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{serviceTitle}</DialogTitle>
          <DialogDescription>
            Por favor, preencha o formulário abaixo e nos envie de volta para processarmos sua solicitação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF" {...field} />
                    </FormControl>
                    <FormMessage />
                    {matchedRecord && (
                      <div className="flex flex-col gap-2 mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                        <p className="text-sm text-blue-400">Encontramos o cadastro de <strong>{matchedRecord.name || matchedRecord.nome_paciente}</strong> associado a este CPF.</p>
                        <Button type="button" size="sm" onClick={handleAutoFill} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                          Preencher todos os dados automaticamente
                        </Button>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input placeholder="RG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="CEP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da rua" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N°</FormLabel>
                    <FormControl>
                      <Input placeholder="Número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4 gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-white min-w-[150px]">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : "Enviar para WhatsApp"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingModal;
