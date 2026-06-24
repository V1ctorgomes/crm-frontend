import type { Contact } from '@/components/whatsapp/types';

export interface WhatsappMessagingArgs {
  activeContact: Contact | null;
  selectedInstance: string;
  setChatHistory: React.Dispatch<React.SetStateAction<Record<string, import('@/components/whatsapp/types').Message[]>>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

export function resolveInstance(c: Contact | null, selectedInstance: string) {
  return c?.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);
}

export function bumpContactInList(
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>,
  targetNumber: string,
  lastMessage: string,
  timeNow: string,
  targetInstance?: string,
) {
  setContacts((prev) => {
    const idx = prev.findIndex((c) => c.number === targetNumber);
    const updated = [...prev];
    if (idx !== -1) {
      updated[idx].lastMessage = lastMessage;
      updated[idx].lastMessageTime = timeNow;
      if (targetInstance) updated[idx].instanceName = targetInstance;
      const item = updated.splice(idx, 1)[0];
      updated.unshift(item);
    }
    return updated;
  });
}
