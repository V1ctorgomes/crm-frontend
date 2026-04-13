import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Importa os estilos globais (Tailwind, etc)

// Fonte Inter é a mais indicada para o visual profissional da Suporte Imagem
const inter = Inter({ subsets: ["latin"] });

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
        className={`${inter.className} bg-[#eef3f8] text-[#0f172a] antialiased`}
      >
        {/* O layout.tsx apenas entrega o conteúdo. 
          O fundo e o efeito espelhado serão controlados pelo login.css 
          dentro da página de login.
        */}
        {children}
      </body>
    </html>
  );
}