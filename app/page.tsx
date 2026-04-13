'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [apiMessage, setApiMessage] = useState('Carregando...');
  const [healthMessage, setHealthMessage] = useState('Carregando...');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'SEM_VARIAVEL';

  useEffect(() => {
    fetch(`${apiUrl}/`)
      .then((res) => res.json())
      .then((data) => {
        setApiMessage(data.message);
      })
      .catch(() => {
        setApiMessage('Falha ao consultar backend');
      });

    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((data) => {
        setHealthMessage(`${data.status} - ${data.service}`);
      })
      .catch(() => {
        setHealthMessage('Falha ao consultar /health');
      });
  }, [apiUrl]);

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>Frontend funcionando!</h1>
      <p>API URL usada: {apiUrl}</p>
      <p>Mensagem do backend: {apiMessage}</p>
      <p>Status da API: {healthMessage}</p>
    </main>
  );
}