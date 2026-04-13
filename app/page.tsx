'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [apiMessage, setApiMessage] = useState('Carregando backend...');
  const [healthMessage, setHealthMessage] = useState('Verificando saúde da API...');

  useEffect(() => {
    fetch('http://localhost:3001/')
      .then((res) => res.json())
      .then((data) => {
        setApiMessage(data.message || 'Resposta recebida');
      })
      .catch(() => {
        setApiMessage('Não foi possível conectar ao backend');
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => {
        setHealthMessage(`${data.status} - ${data.service}`);
      })
      .catch(() => {
        setHealthMessage('Falha ao consultar /health');
      });
  }, []);

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>Frontend funcionando!</h1>
      <p>Mensagem do backend: {apiMessage}</p>
      <p>Status da API: {healthMessage}</p>
    </main>
  );
}