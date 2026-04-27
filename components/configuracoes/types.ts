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