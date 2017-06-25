/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import * as types from './webhook-types';
export declare class Message {
    sender: string;
    recipient: string;
    seq: number;
    protected payload: types.TextMessage | types.Postback;
    constructor(sender: string, recipient: string, seq: number);
    send(host: string): Promise<void>;
    export(): types.pagePayload;
}
export declare class TextMessage extends Message {
    protected payload: types.TextMessage;
    create(text: string): this;
}
export declare class QuickReplyMessage extends Message {
    protected payload: types.QuickReplyMessage;
    create(text: string, payload: string): this;
}
export declare class DelayMessage extends Message {
    protected delay: number;
    create(delayMs: number): this;
    send(): Promise<void>;
}
export declare class PostbackMessage extends Message {
    protected payload: types.Postback;
    create(payload: string): this;
}
export declare class PostbackMessageWithReferral extends Message {
    protected payload: types.PostbackWithReferral;
    create(payload: string, referral: string): this;
}
