export type EnsureWebPushResult = {
  /** POST /subscribe respondeu 2xx */
  serverSynced: boolean;
  /** Existe subscrição no PushManager deste separador */
  hasLocalSubscription: boolean;
  httpStatus?: number;
  /** Corpo de erro do Nest ou falha de rede */
  serverError?: string;
  /** Falhou antes do POST (sem token, sem VAPID, etc.) */
  blocked?: string;
};
