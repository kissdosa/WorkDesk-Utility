import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('workdesk', {
  platform: () => ipcRenderer.invoke('platform'),
  captureSources: () => ipcRenderer.invoke('capture:sources'),
  copyImage: (url: string) => ipcRenderer.invoke('capture:clipboard', url),
  saveImage: (url: string) => ipcRenderer.invoke('capture:save', url),
  applyNetwork: (profile: unknown) => ipcRenderer.invoke('network:apply', profile),
  seal: (plain: string, password: string, salt?: string) => ipcRenderer.invoke('vault:seal', plain, password, salt),
  open: (item: unknown, password: string) => ipcRenderer.invoke('vault:open', item, password)
});
