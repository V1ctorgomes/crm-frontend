'use client';

import { useCallback, useRef, useState } from 'react';
import type { Contact, Message, Stage } from '@/components/whatsapp/types';
import type { TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import type { ContactKind } from '@/lib/contact-kind';
import { useUnreadSync } from './use-unread-sync';
import { useInitialWhatsappData } from './use-initial-data';

export function useWhatsappLayoutState() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const [hasInstances, setHasInstances] = useState<boolean | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('ALL');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [ticketCatalog, setTicketCatalog] = useState<TicketCatalogOptions | null>(null);
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});

  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [contactKindFilter, setContactKindFilter] = useState<'ALL' | ContactKind>('ALL');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListScrollRef = useRef<HTMLDivElement>(null);

  const { unreadByContact, setUnreadByContact } = useUnreadSync(activeContact?.number ?? null);

  useInitialWhatsappData({
    setContacts,
    setActiveContact,
    setStages,
    setTicketCatalog,
    setCrmCustomers,
    setInstances,
    setHasInstances,
  });

  const handleSelectContact = useCallback((contact: Contact | null) => {
    setActiveContact(contact);
    setIsSearchChatOpen(false);
    setChatSearchTerm('');
    setCustomerSearch('');
    if (contact) localStorage.setItem('lastActiveContact', contact.number);
    else localStorage.removeItem('lastActiveContact');
  }, []);

  return {
    toast,
    setToast,
    showFeedback,
    hasInstances,
    instances,
    selectedInstance,
    setSelectedInstance,
    contacts,
    setContacts,
    activeContact,
    setActiveContact,
    stages,
    ticketCatalog,
    crmCustomers,
    chatHistory,
    setChatHistory,
    isSearchChatOpen,
    setIsSearchChatOpen,
    chatSearchTerm,
    setChatSearchTerm,
    customerSearch,
    setCustomerSearch,
    contactKindFilter,
    setContactKindFilter,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    isInstanceModalOpen,
    setIsInstanceModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    viewerMessage,
    setViewerMessage,
    messagesEndRef,
    messageListScrollRef,
    unreadByContact,
    setUnreadByContact,
    handleSelectContact,
  };
}

export type WhatsappLayoutState = ReturnType<typeof useWhatsappLayoutState>;
