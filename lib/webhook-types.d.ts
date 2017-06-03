export interface AttachmentObject {
    type: string;
    payload: string;
    url?: string;
    location?: {
        'coordinates.lat': number;
        'coordinates.long': number;
    };
}
export interface AttachementMessage extends Message {
    message: {
        mid: string;
        seq: number;
        attachment: Array<AttachmentObject>;
    };
}
export interface QuickReplyMessage extends Message {
    message: {
        mid: string;
        seq: number;
        text: string;
        quick_reply: {
            payload: string;
        };
    };
}
export interface TextMessage extends Message {
    message: {
        mid: string;
        seq: number;
        text: string;
    };
}
export interface Postback extends Message {
    postback: {
        payload: string;
    };
}
export interface PostbackWithReferral extends Message {
    postback: {
        payload: string;
        referral: {
            ref: string;
            source: string;
            type: string;
        };
    };
}
export interface Delivered {
    sender: {
        id: string;
    };
    recipient: {
        id: string;
    };
    delivery: {
        mids?: Array<string>;
        watermark: number;
        seq: number;
    };
}
export interface Read extends Message {
    read: {
        watermark: number;
        seq: number;
    };
}
export interface Echo extends Message {
    message: {
        is_echo: boolean;
        app_id: string;
        metadata?: string;
        mid: string;
        seq: string;
    };
}
export interface Message {
    sender: {
        id: string;
    };
    recipient: {
        id: string;
    };
    timestamp: number;
}
export interface Entry {
    id: string;
    time: number;
    messaging: Array<TextMessage | QuickReplyMessage | Postback | Delivered | Read | Echo>;
}
export interface pagePayload {
    object: string;
    entry: Array<Entry>;
}
