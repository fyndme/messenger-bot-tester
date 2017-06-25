import { ResponseTypes } from './checker';
import * as sendTypes from './send-types';
export declare class Response {
    check(payload: sendTypes.Payload): boolean;
    type: ResponseTypes;
}
export declare class TextResponse extends Response {
    protected allowedPhrases: Array<string>;
    constructor(allowedPhrases: Array<string>);
    type: ResponseTypes;
    check(payload: sendTypes.Payload): boolean;
}
export declare class ImageResponse extends Response {
    protected url: string;
    constructor(url: string);
    type: ResponseTypes;
    check(payload: sendTypes.Payload): boolean;
}
export declare class AudioResponse extends ImageResponse {
    constructor(url: string);
    type: ResponseTypes;
}
export declare class FileResponse extends ImageResponse {
    constructor(url: string);
    type: ResponseTypes;
}
export declare class VideoResponse extends ImageResponse {
    constructor(url: string);
    type: ResponseTypes;
}
export declare class QuickRepliesResponse extends TextResponse {
    protected buttons: Array<sendTypes.Button>;
    constructor(allowedPhraes?: Array<string>, buttonArray?: Array<sendTypes.Button>);
    type: ResponseTypes;
    check(payload: sendTypes.Payload): boolean;
}
export declare class ButtonTemplateResponse extends Response {
    protected allowedText: Array<string>;
    protected buttons: Array<sendTypes.Button>;
    constructor(allowedText?: Array<string>, buttonArray?: Array<sendTypes.Button>);
    type: ResponseTypes;
    check(payload: sendTypes.Payload): boolean;
}
export declare class GenericTemplateResponse extends Response {
    protected _elementCount: number;
    protected _elements: Object;
    constructor();
    type: ResponseTypes;
    elementCount(equalTo: number): this;
    elements(elem: Object): this;
    check(payload: sendTypes.Payload): boolean;
}
export declare class ReceiptTemplateResponse extends Response {
    protected _elementCount: number;
    constructor();
    type: ResponseTypes;
    elementCount(equalTo: number): this;
    check(payload: sendTypes.Payload): boolean;
}
