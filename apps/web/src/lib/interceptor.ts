import qs from "qs";

export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type RequestOptions = Omit<RequestInit, "method" | "body">;

export interface RequestProps {
	url: string;
	method: Method;
	params?: any;
	options?: RequestOptions;
}

export interface DownloadPostOptions extends RequestOptions {
	filename?: string;
	method?: Method;
}

/**
 * 判断响应是否为 blob 类型
 */
export const isBlobResponse = (contentType: string): boolean => {
	return (
		contentType.includes("application/octet-stream") ||
		contentType.includes("application/vnd") ||
		contentType.includes("application/pdf") ||
		contentType.includes("image/") ||
		contentType.includes("audio/") ||
		contentType.includes("video/") ||
		contentType.includes("application/zip") ||
		contentType.includes("application/x-") ||
		(contentType.startsWith("application/") && !contentType.includes("json"))
	);
};

/**
 * 从响应头中解析文件名
 */
export const parseFilenameFromHeaders = (headers: Headers, defaultFilename?: string): string => {
	const contentDisposition = headers.get("content-disposition");
	if (contentDisposition) {
		// 处理 filename*=UTF-8''xxx 格式
		const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
		if (utf8FilenameMatch) {
			return decodeURIComponent(utf8FilenameMatch[1] || "");
		}
		// 处理 filename="xxx" 或 filename=xxx 格式
		const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
		if (filenameMatch && filenameMatch[1]) {
			return filenameMatch[1].replace(/['"]/g, "");
		}
	}
	return defaultFilename || "download";
};

/**
 * 请求拦截器
 */
export const interceptorsRequest = ({ url, method, params, options }: RequestProps) => {
	let finalUrl = url;
	let payload: BodyInit | undefined = undefined;

	const headers: HeadersInit = {
		...(options?.headers || {}),
	};

	const isGetLike = method === "GET" || method === "DELETE";
	const isFormData =
		params &&
		(Object.prototype.toString.call(params) === "[object FormData]" ||
			Object.prototype.toString.call(params) === "[object URLSearchParams]");

	// 处理 GET/DELETE Query 拼接
	if (isGetLike && params && Object.keys(params).length > 0) {
		finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs.stringify(params, { arrayFormat: "indices" });
	} else if (params !== undefined && params !== null) {
		// 非 GET/DELETE，处理请求体
		if (isFormData) {
			payload = params;
			// 不设置 Content-Type, 让浏览器自动推断，避免边界问题
		} else {
			// @ts-ignore
			headers["Content-Type"] = "application/json";
			payload = JSON.stringify(params);
		}
	}

	return {
		url: finalUrl,
		options: {
			...options,
			method,
			body: isGetLike ? undefined : payload,
			headers,
		} as RequestInit,
	};
};

/**
 * 响应拦截器
 */
export const interceptorsResponse = async <T>(res: Response): Promise<T> => {
	const requestUrl = res.url;

	// 判断返回是不是 blob
	const contentType = res.headers.get("content-type") || "";
	const isBlob = isBlobResponse(contentType);

	// 如果是 blob 类型，直接返回 blob，避免重复读取响应
	if (isBlob) {
		return (await res.blob()) as T;
	}

	// 非 blob 类型，读取文本内容用于 JSON 解析或错误处理
	const text = await res.text();

	if (res.ok) {
		const response = JSON.parse(text);
		return response as T;
	}

	// 处理错误响应
	try {
		const errorData = JSON.parse(text);
		throw { message: errorData?.message || errorData || "接口错误", url: requestUrl, status: res.status };
	} catch {
		throw { message: text || "接口错误", url: requestUrl, status: res.status };
	}
};
