import { Response } from "express";

type TResponse<T> = {
    statusCode: number;
    success: boolean;
    message: string;
    meta?: {
        total: number;
    };
    data: T;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
    res.status(data.statusCode).json({
        httpStatusCode: data.statusCode,
        success: data.success,
        message: data.message,
        meta: data.meta || null,
        data: data.data,
    });
};

export default sendResponse;
