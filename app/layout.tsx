import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Importa os estilos globais (Tailwind, etc)
import { WhatsappStreamProvider } from "@/components/whatsapp/WhatsappStreamProvider";

// Fonte Inter é a mais indicada para o visual profissional da Suporte Imagem
const inter = Inter({ subsets: ["latin"] });

// Favicon: `app/icon.png` e `app/apple-icon.png` (cópias de `public/icon.png`). Evitar `app/favicon.ico` genérico do Next.
export const metadata: Metadata = {
  title: "Suporte Imagem - CRM",
  description: "Sistema de Gestão de Clientes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} bg-brand-canvas text-brand-ink antialiased`}
      >
        {/* O layout.tsx apenas entrega o conteúdo. 
          O fundo e o efeito espelhado serão controlados pelo login.css 
          dentro da página de login.
        */}
        <WhatsappStreamProvider>{children}</WhatsappStreamProvider>
      </body>
    </html>
  );
}