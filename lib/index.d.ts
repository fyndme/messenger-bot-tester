/// <reference types="express" />
/// <reference types="bluebird" />
import * as express from 'express';
import * as Promise from 'bluebird';
import { checkSendAPI } from './checker';
import { Response } from './responses';
import { Message } from './messages';
import * as sendTypes from './send-types';
export * from './responses';
export * from './messages';
export { checkSendAPI };
export default class Tester {
    protected expressApp: express.Application;
    protected host: string;
    protected port: number;
    private expressInstance;
    expressPromise: any;
    promise: {
        [id: string]: Promise<void>;
    };
    private finalResolveFunction;
    private rejectFunction;
    private stepMapArray;
    private multipleStepsOrder;
    private multiScriptId;
    constructor(portToListenOn: number, addressToSendTo: string);
    startListening(): Promise<void>;
    stopListening(): Promise<void>;
    private checkResponse(realResponse, parsedResponse, res);
    private runNextStepMultipleScripts(scriptId);
    private runNextStep(recipient);
    runScript(script: Script): Promise<void>;
    runMultipleScripts(scriptId: string, scriptList: Script[], runningOrder: string[]): Promise<void>;
}
export declare class Script {
    private seq;
    userID: string;
    pageID: string;
    script: Array<Message | Response>;
    constructor(user: string, page: string);
    sendTextMessage(text: string): this;
    sendDelay(delayMs: number): this;
    sendPostbackMessage(payload: string): this;
    sendPostbackMessageWithReferral(payload: string, referral: string): this;
    sendQuickReplyMessage(text: string, payload: string): this;
    expectRawResponse(responseInstance: Response): this;
    expectTextResponse(text: string): this;
    expectTextResponses(text: Array<string>): this;
    expectQuickRepliesResponse(text?: Array<string>, buttonArray?: Array<sendTypes.Button>): this;
    expectButtonTemplateResponse(text?: Array<string>, buttonArray?: Array<sendTypes.Button>): this;
    expectGenericTemplateResponse(): this;
    expectTemplateResponse(elementCount: number, elements: Object): this;
}
