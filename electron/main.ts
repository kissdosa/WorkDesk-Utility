import { app, BrowserWindow, ipcMain, desktopCapturer, clipboard, nativeImage, dialog } from 'electron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import { validateNetworkProfile } from '../shared/validation.cjs';
import { openVault, sealVault } from '../shared/vault.cjs';

const execFileAsync = promisify(execFile);
let win: BrowserWindow;
function createWindow() {
  win = new BrowserWindow({ width: 1180, height: 780, minWidth: 900, minHeight: 640, title: 'WorkDesk Utility', backgroundColor: '#f4f6fa', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  if (process.env.VITE_DEV_SERVER_URL) void win.loadURL(process.env.VITE_DEV_SERVER_URL); else void win.loadFile(path.join(__dirname, '../dist/index.html'));
}
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('platform', () => process.platform);
ipcMain.handle('capture:sources', async () => (await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 2560, height: 1600 } })).map(s => ({ id: s.id, name: s.name, dataUrl: s.thumbnail.toDataURL() })));
ipcMain.handle('capture:clipboard', (_e, dataUrl: string) => { clipboard.writeImage(nativeImage.createFromDataURL(dataUrl)); return true; });
ipcMain.handle('capture:save', async (_e, dataUrl: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, { defaultPath: `workdesk-capture-${Date.now()}.png`, filters: [{ name: 'PNG Image', extensions: ['png'] }] });
  if (canceled || !filePath) return false;
  await fs.writeFile(filePath, Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')); return filePath;
});
ipcMain.handle('network:apply', async (_e, profile: { kind: 'dhcp' | 'static'; adapter: string; ip?: string; gateway?: string; prefix?: number; dns?: string[] }) => {
  if (process.platform !== 'win32') return { ok: false, message: '네트워크 프로필 적용은 Windows에서만 가능합니다.' };
  const validationError = validateNetworkProfile(profile);
  if (validationError) return { ok: false, message: validationError };
  const dns = profile.dns || [];
  const ps = profile.kind === 'dhcp'
    ? `Get-NetIPAddress -InterfaceAlias '${profile.adapter}' -AddressFamily IPv4 -ErrorAction SilentlyContinue | Remove-NetIPAddress -Confirm:$false -ErrorAction SilentlyContinue; Set-NetIPInterface -InterfaceAlias '${profile.adapter}' -AddressFamily IPv4 -Dhcp Enabled; ${dns.length ? `Set-DnsClientServerAddress -InterfaceAlias '${profile.adapter}' -ServerAddresses @('${dns.join("','")}')` : `Set-DnsClientServerAddress -InterfaceAlias '${profile.adapter}' -ResetServerAddresses`}`
    : `Get-NetIPAddress -InterfaceAlias '${profile.adapter}' -AddressFamily IPv4 -ErrorAction SilentlyContinue | Remove-NetIPAddress -Confirm:$false -ErrorAction SilentlyContinue; New-NetIPAddress -InterfaceAlias '${profile.adapter}' -IPAddress '${profile.ip}' -PrefixLength ${profile.prefix} -DefaultGateway '${profile.gateway}'; Set-DnsClientServerAddress -InterfaceAlias '${profile.adapter}' -ServerAddresses @('${dns.join("','")}')`;
  try { const encoded = Buffer.from(ps, 'utf16le').toString('base64'); await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `\$p=Start-Process powershell.exe -Verb RunAs -Wait -PassThru -ArgumentList '-NoProfile -EncodedCommand ${encoded}'; exit \$p.ExitCode`]); return { ok: true, message: 'Windows 네트워크 프로필 적용 명령을 완료했습니다.' }; }
  catch (error) { return { ok: false, message: `적용하지 못했습니다. 관리자 권한과 어댑터 설정을 확인해 주세요. (${String(error).slice(0, 150)})` }; }
});
ipcMain.handle('vault:seal', (_e, plain: string, password: string, saltHex?: string) => sealVault(plain, password, saltHex));
ipcMain.handle('vault:open', (_e, item: { salt: string; iv: string; tag: string; data: string }, password: string) => openVault(item, password));
