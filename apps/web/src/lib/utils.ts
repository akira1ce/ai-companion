import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** 合并 class */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** 判断是否为浏览器环境 */
export const isBrowser = !!(typeof window !== "undefined" && window.document && window.document.createElement);
