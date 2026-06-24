export type SettingsTab = 'perfil' | 'conexoes' | 'notificacoes';

export type SettingsConfirmState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (deleteReason?: string) => void | Promise<void>;
} | null;

export type SettingsMeUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
};

export type InstanceHealthLevel = 'ok' | 'warning' | 'critical';

export interface InstanceHealthSnapshot {
  instanceName: string;
  level: InstanceHealthLevel;
  message: string;
  failuresLastHour: number;
  successesLastHour: number;
  disconnectsLastHour: number;
  failureRatePercent: number;
  lastFailureAt: string | null;
  lastDisconnectAt: string | null;
  lastConnectionState: string | null;
}

export interface Instance {
  id: string;
  name: string;
  status: string;
  userId: string;
  createdAt: string;
  proxyHost?: string;
  proxyPort?: string;
}

export interface ProxyNode {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  username?: string;
  password?: string;
}