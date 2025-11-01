import fetch, { RequestInit, Response } from 'node-fetch';
import { OpenAiApiErrorResponse } from './interfaces/IOpenAiClient';

export type HttpRequestMethod = 'GET' | 'POST';
export type ApiResponse<P = any> = {
    success: boolean;
    payload: P | null;
    error?: Error;
};
export type FetchOptions = {
    url: string;
    request: RequestInit;
};


export default class HttpClient {
    constructor() {}

    public static success<T>(data: T) {
        return { success: true, payload: data } as ApiResponse<T>;
    }

    public  static failure(error: Error) {
        console.error(error.message);
        return { success: false, error, payload: null } as ApiResponse;
    }

    protected async fetch<T>(options: FetchOptions): Promise<ApiResponse<T>> {
        try {
            const request: RequestInit = {
                method: options.request.method,
                headers: options.request.headers,
            };

            if (options.request.body) {
                request.body = options.request.body;
            }

            const res = await fetch(options.url, request);

            if (!res.ok) {
                console.error("Request not ok, status: ", res.status, res.statusText)
                return HttpClient.handleRequestNotOk(res);
            }


            const jso = await res.json();

            return HttpClient.success<T>(jso);
        } catch (error) {
            console.log("HTTP Request Failed: ", error);
            return HttpClient.failure(Error('Error fetching data'));
        }
    }

    protected static fetchOptions<T>(
        url: string,
        apiKey: string,
        method: HttpRequestMethod,
        headers: RequestInit['headers'],
        body?: T,
    ): FetchOptions {
        return {
            url,
            request: {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...headers,
                },
                ...(body && { body }),
            },
        } as FetchOptions;
    }

    private static async handleRequestNotOk(res: Response): Promise<ApiResponse> {
        let errorBody: OpenAiApiErrorResponse | null =  null;
        try {
            errorBody = await res.json() as OpenAiApiErrorResponse
            return this.failure(Error(`Status: ${res.status} ${res.statusText}. Error: ${errorBody.error.message}`));
        }
        catch (error) {
            return this.failure(Error(`Status: ${res.status} ${res.statusText}. Error: Not given`));
        }
    }
}
