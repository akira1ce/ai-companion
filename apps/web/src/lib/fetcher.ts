import { saveAs } from "file-saver";
import {
	DownloadPostOptions,
	interceptorsRequest,
	interceptorsResponse,
	parseFilenameFromHeaders,
	RequestOptions,
	RequestProps,
} from "./interceptor";
import { isBrowser } from "./utils";

/**
 * 主请求函数
 */
export const request = async <T>({ url = "", params = {}, method, options }: RequestProps): Promise<T> => {
	const req = interceptorsRequest({ url, method, params, options });
	const res = await fetch(req.url, req.options);
	return interceptorsResponse<T>(res);
};

export const get = <T>(url: string, params?: any, options?: RequestOptions) => {
	return request<T>({ url, method: "GET", params, options });
};

export const post = <T>(url: string, params?: any, options?: RequestOptions) => {
	return request<T>({ url, method: "POST", params, options });
};

export const put = <T>(url: string, params?: any, options?: RequestOptions) => {
	return request<T>({ url, method: "PUT", params, options });
};

export const del = <T>(url: string, params?: any, options?: RequestOptions) => {
	return request<T>({ url, method: "DELETE", params, options });
};

export const patch = <T>(url: string, params?: any, options?: RequestOptions) => {
	return request<T>({ url, method: "PATCH", params, options });
};

export const download = async (url: string, params?: any, options?: DownloadPostOptions): Promise<void> => {
	if (!isBrowser) throw new Error("downloadPost 只能在浏览器环境中使用");

	const { method = "POST", filename: defaultFilename = "download" } = options || {};

	const req = interceptorsRequest({ url, method, params, options });
	const res = await fetch(req.url, req.options);

	// 检查响应状态
	if (!res.ok) {
		const text = await res.text();
		try {
			const errorData = JSON.parse(text);
			throw new Error(errorData?.message || errorData || "下载失败");
		} catch {
			throw new Error(text || "下载失败");
		}
	}
	// 获取 blob
	const blob = await res.blob();
	// 解析文件名
	const filename = parseFilenameFromHeaders(res.headers, defaultFilename);
	// 使用 file-saver 下载文件
	saveAs(blob, filename);
};
