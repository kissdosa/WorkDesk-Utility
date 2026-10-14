export type SealedVault = { salt:string; iv:string; tag:string; data:string };
export function sealVault(plain:string,password:string,saltHex?:string):Promise<SealedVault>;
export function openVault(item:SealedVault,password:string):Promise<string>;
