import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Importa os estilos globais (Tailwind, etc)
import { WhatsappStreamProvider } from "@/components/whatsapp/WhatsappStreamProvider";

// Fonte Inter é a mais indicada para o visual profissional da Suporte Imagem
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Suporte Imagem - CRM",
  description: "Sistema de Gestão de Clientes",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
  },
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