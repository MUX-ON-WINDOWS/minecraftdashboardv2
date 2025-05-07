export interface ServerStatusResponse {
  online: boolean;
  ip: string;
  port: number;
  players?: {
    online: number;
    max: number;
  };
  version?: string;
  motd?: {
    clean: string[];
  };
}

export async function checkServerStatus(address: string): Promise<ServerStatusResponse> {
  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${address}`);
    if (!response.ok) {
      throw new Error('Failed to fetch server status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking server status:', error);
    return {
      online: false,
      ip: address,
      port: 25565
    };
  }
} 