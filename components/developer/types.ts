export interface ProxyNode {
  id: string;
  name: string;
  host: string;
  port: string | number;
  username?: string;
  protocol: string;
}

export interface ProxyFormData {
  name: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
  protocol: string;
}