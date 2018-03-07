export interface QuickReply {
    content_type: string;
    title: string;
    payload: string;
}
export interface Button {
    type: string;
    title: string;
    payload?: string;
    url?: string;
    webview_height_ratio?: string;
}
export interface Item {
    title: string;
    subtitle?: string;
    image_url?: string;
    buttons?: Array<Button>;
}
export interface Adjustment {
    name?: string;
    amount?: number;
}
export interface TextMessage {
    text: string;
}
export interface GenericPayload {
    template_type: string;
    elements: Array<Item>;
}
export interface ButtonPayload {
    template_type: string;
    text: string;
    buttons: Array<Button>;
}
export interface URLPayload {
    url: string;
}
export interface ReceiptPayload {
    template_type: string;
    recipient_name: string;
    order_number: string;
    currency: string;
    payment_method: string;
    timestamp?: number;
    order_url?: string;
    elements: Array<Item>;
    address?: {
        street_1: string;
        street_2?: string;
        city: string;
        postal_code: string;
        state: string;
        country: string;
    };
    summary: {
        subtotal?: number;
        shipping_cost?: number;
        total_tax?: number;
        total_cost: number;
    };
    adjustments?: Array<Adjustment>;
}
export interface Attachement {
    type: string;
    payload: GenericPayload | ButtonPayload | URLPayload;
}
export interface Message {
    attachment?: Attachement;
    text?: string;
    quick_replies?: Array<QuickReply>;
    metadata?: string;
}
export interface Payload {
    recipient: {
        id?: string;
        phone_number?: string;
    };
    message?: Message;
    sender_action?: string;
    notification_type?: string;
}
export interface Response {
    recipient_id: string;
    message_id: string;
}
export interface Error {
    error: {
        message: string;
        type: string;
        code: Number;
        fbtrace_id: string;
    };
}
export interface FacebookUser {
    first_name: string;
    last_name: string;
    profile_pic: string;
    locale: string;
    timezone: number;
    gender: string;
}
