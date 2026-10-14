export function isIPv4(value: string): boolean;
export function validateNetworkProfile(profile: {adapter:string;kind:'dhcp'|'static';ip?:string;gateway?:string;prefix?:number;dns?:string[]}): string|null;
export function safeArithmeticExpression(expression: string): boolean;
export function calculate(expression: string): number;
