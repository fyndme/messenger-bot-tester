/* tslint:disable */
import * as express from 'express';
import * as rp from 'request-promise';
import * as Promise from 'bluebird'
import * as bodyParser from 'body-parser';
import * as util from 'util';
import * as _ from 'lodash';

import { checkSendAPI, ResponseTypes, CheckResult } from './checker';
import { Response, TextResponse, GenericTemplateResponse, ButtonTemplateResponse, QuickRepliesResponse } from './responses';
import { Message, TextMessage, DelayMessage, PostbackMessage, PostbackMessageWithReferral, QuickReplyMessage } from './messages';

import * as types from './webhook-types';
import * as sendTypes from './send-types';

export * from './responses';
export * from './messages';
export { checkSendAPI };

import { Server } from 'http';

export default class Tester {
    protected expressApp: express.Application;
    protected host: string;
    protected port: number;
    private expressInstance: Server;
    public expressPromise;
    public promise: { [id: string] : Promise<void>; } = {};
    private finalResolveFunction: { [id: string] : () => void; } = {};
    private rejectFunction: { [id: string] : (err?: Error) => void; } = {};
    private stepMapArray: { [id: string] : Array<Message | Response>; } = {};
    private multipleStepsOrder: string[] = [];
    private multiScriptId: string;

    constructor(portToListenOn: number, addressToSendTo: string) {
        this.host = addressToSendTo;
        this.port = portToListenOn;
        this.expressApp = express();
        this.expressApp.use(bodyParser.json());
        const _savedThis = this;
        this.expressApp.get('/v2.6/:id', (req: express.Request, res) => {
            // console.log('requesting', (<any>req.params).id);
            const user: sendTypes.FacebookUser = {
                first_name: 'user',
                last_name: 'last',
                profile_pic: 'http://none',
                locale: 'en_us',
                timezone: 0,
                gender: 'male',
            };
            res.send(user);
        })
        this.expressApp.get('/v2.6/me/thread_settings', (req: express.Request, res) => {
            // console.log('thread_settings');
            res.send({});
        })
        this.expressApp.post('/v2.6/me/messages', (req: express.Request, res: express.Response) => {
            //send api
            const body = (<any>req).body as sendTypes.Payload;
            const parsedResponse = checkSendAPI(body);
            // console.log('response:', parsedResponse);

            if (parsedResponse === null || parsedResponse.type === null) {
                res.sendStatus(400);
                // don't know who to respond to'
                throw new Error('Bad response structure');
            }

            const token: string = req.query.access_token;
            if (typeof token !== 'string') {
                return _savedThis.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error('Token must be included on all requests'));
            }

            if (parsedResponse.type === ResponseTypes.sender_action) {
                res.sendStatus(200);
                return;
            }

            _savedThis.checkResponse(body, parsedResponse, res);
        });

        return this;
    }

    public startListening(): Promise<void> {
        this.expressPromise = new Promise((resolve, reject) => {
            this.expressInstance = this.expressApp.listen(this.port, () => {
                console.log(`listening on ${this.port}`);
                resolve();
            });
        });
        return this.expressPromise;
    }

    public stopListening(): Promise<void> {
        this.expressInstance.close()
        console.log(`stopped listening on ${this.port}`);
        return Promise.resolve();
    }

    public endMultipleScriptTest() {
      this.multiScriptId = null;
      this.multipleStepsOrder = [];
    }

    private checkResponse(realResponse: any, parsedResponse: CheckResult, res: express.Response): void {
        const currentStep = this.stepMapArray[parsedResponse.recipient][0];
        if (currentStep instanceof Response) {
            const _savedThis = this;
            this.stepMapArray[parsedResponse.recipient].shift();
            let promiseId: string;
            if (!_.isNull(this.multiScriptId) && !_.isUndefined(this.multiScriptId)) {
              promiseId = this.multiScriptId;
              const expectedUser = this.multipleStepsOrder.shift();
              // console.log("=> multiscript Id is: ", promiseId);
              // console.log("response popped uesr ", expectedUser);
              if (expectedUser !== parsedResponse.recipient) {
                return _savedThis.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error(`Multi-script error failed got resposne for user '${parsedResponse.recipient}'  but expeccted response for user '${expectedUser}'`));
              }
            } else {
              promiseId = parsedResponse.recipient;
            }
            // console.log('====> checking the response... promise is', promiseId);
            // console.log("script id", this.multiScriptId);
            // console.log("scripts order", this.multipleStepsOrder);
            this.promise[promiseId] = this.promise[promiseId].then(() => new Promise((resolve) => {
                // console.log(`create expect promise for ${(<any>currentStep).constructor.name}`);
                // console.log('currentStep', currentStep);

                // console.log('checking type..');
                if (currentStep.type !== parsedResponse.type) {
                    return _savedThis.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error(`Script does not match response type, got '${ResponseTypes[parsedResponse.type]}' but expected '${ResponseTypes[currentStep.type]}'`));
                }

                // console.log('checking contents..');
                try {
                    if (currentStep.check(realResponse)) {
                        // console.log('PERFECT');
                        res.sendStatus(200);
                        return resolve();
                    }
                } catch(err) {
                    res.sendStatus(200);
                    return _savedThis.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](err);
                }

                res.sendStatus(200);
                return _savedThis.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error(`Script does not match response expected`));

            }))
                .then(() => {
                    // console.log('running next step...');
                    if (!_.isNull(this.multiScriptId) && !_.isUndefined(this.multiScriptId)) {
                      return _savedThis.runNextStepMultipleScripts(_savedThis.multiScriptId);
                    } else {
                      return _savedThis.runNextStep(parsedResponse.recipient);
                    }
                })
                .then(() => null);
        } else {
            // console.log("==> recipient: ", parsedResponse.recipient);
            // console.log("==> reject map: ", this.rejectFunction);
            this.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error(`Script does not have a response, but received one`));
            res.sendStatus(200);
        }
    }

    private runNextStepMultipleScripts(scriptId: string): Response {
      const _savedThis = this;
      let nextStep: Message | Response;
      let nextUser: string;

      do {
          nextUser = _savedThis.multipleStepsOrder.shift();
          // console.log("==> popped next user : ", nextUser);


          if (typeof nextUser === 'undefined') {
              // console.log('end of array');
              this.promise[scriptId] = this.promise[scriptId].then(() => {
                  // console.log('clear');
                  _savedThis.finalResolveFunction[scriptId]();
              });
              return null;
          }
          nextStep = this.stepMapArray[nextUser].shift();
          // console.log('working on:', (<any>nextStep).constructor.name);

          if (nextStep instanceof Response) {
              const localStep: Response = nextStep;
              // console.log(`expecting a ${(<any>localStep).constructor.name}`);
              // console.log("unshifting user ", nextUser);
              this.stepMapArray[nextUser].unshift(nextStep);
              this.multipleStepsOrder.unshift(nextUser);
              break;
          } else if (nextStep instanceof Message) {
              const localStep: Message = nextStep;
              this.promise[scriptId] = this.promise[scriptId].then(() => {
                  // console.log('sending', (<any>localStep).constructor.name);
                  return localStep.send(this.host);
              });
          } else {
              // console.log("corrupt step ", nextStep);
              // console.log("corrupt user ", nextUser);
              this.promise[scriptId] = this.promise[scriptId].then(() => Promise.reject(new Error('corrupt script')));
          }
      } while (nextStep instanceof Message)

      if (nextStep instanceof Response) {
          return nextStep;
      }

      return null;
    }

    private runNextStep(recipient: string): Response {
        let _savedThis = this;
        let nextStep: Message | Response;
        do {
            nextStep = this.stepMapArray[recipient].shift();

            if (typeof nextStep === 'undefined') {
                // console.log('end of array');
                this.promise[recipient] = this.promise[recipient].then(() => {
                    // console.log('clear');
                    _savedThis.finalResolveFunction[recipient]();
                });
                return null;
            }
            // console.log('working on:', (<any>nextStep).constructor.name);

            if (nextStep instanceof Response) {
                const localStep: Response = nextStep;
                // console.log(`expecting a ${(<any>localStep).constructor.name}`);
                this.stepMapArray[recipient].unshift(nextStep);
                break;
            } else if (nextStep instanceof Message) {
                const localStep: Message = nextStep;
                this.promise[recipient] = this.promise[recipient].then(() => {
                    // console.log('sending', (<any>localStep).constructor.name);
                    return localStep.send(this.host);
                });
            } else {
                // console.log(nextStep);
                this.promise[recipient] = this.promise[recipient].then(() => Promise.reject(new Error('corrupt script')));
            }
        } while (nextStep instanceof Message)

        if (nextStep instanceof Response) {
            return nextStep;
        }

        return null;
    }

    public runScript(script: Script): Promise<void> {
        let _savedThis: this = this;
        this.stepMapArray[script.userID] = _.clone(script.script);

        if (typeof this.expressPromise === 'undefined') {
            this.startListening();
        }

        return this.expressPromise
            .then(() => new Promise((resolve, reject) => {
                _savedThis.promise[script.userID] = Promise.resolve();
                _savedThis.finalResolveFunction[script.userID] = resolve;
                _savedThis.rejectFunction[script.userID] = reject;
                _savedThis.runNextStep(script.userID);
            }));
    }

    public runMultipleScripts(scriptId: string, scriptList: Script[], runningOrder: string[]): Promise<void> {
      let _savedThis: this = this;
      // add scripts to script map
      scriptList.forEach((s) => {this.stepMapArray[s.userID] = _.clone(s.script);});

      return this.expressPromise
          .then(() => new Promise((resolve, reject) => {
            _savedThis.promise[scriptId] = Promise.resolve();
            _savedThis.finalResolveFunction[scriptId] = resolve;
            _savedThis.rejectFunction[scriptId] = reject;
            _savedThis.multipleStepsOrder = runningOrder;
            _savedThis.multiScriptId = scriptId;
            _savedThis.runNextStepMultipleScripts(scriptId);
          }));
    }
}

export class Script {
    private seq = 0;
    public userID: string;
    public pageID: string;
    public script: Array<Message | Response> = [];

    constructor(user: string, page: string) {
        this.userID = user.toString();
        this.pageID = page.toString();
    }

    public sendTextMessage(text: string): this {
        this.script.push(new TextMessage(this.userID, this.pageID, this.seq++).create(text));
        return this;
    }

    public sendDelay(delayMs: number): this {
        this.script.push(new DelayMessage(this.userID, this.pageID, 0).create(delayMs));
        return this;
    }

    public sendPostbackMessage(payload: string): this {
        this.script.push(new PostbackMessage(this.userID, this.pageID, this.seq++).create(payload));
        return this;
    }

    public sendPostbackMessageWithReferral(payload: string, referral: string): this {
        this.script.push(new PostbackMessageWithReferral(this.userID, this.pageID, this.seq++).create(payload, referral));
        return this;
    }

    public sendQuickReplyMessage(text: string, payload: string): this {
        this.script.push(new QuickReplyMessage(this.userID, this.pageID, this.seq++).create(text, payload));
        return this;
    }

    public expectRawResponse(responseInstance: Response): this {
        this.script.push(responseInstance);
        return this;
    }

    public expectTextResponse(text: string): this {
        return this.expectRawResponse(new TextResponse([text]));
    }

    public expectTextResponses(text: Array<string>): this {
        return this.expectRawResponse(new TextResponse(text));
    }

    public expectQuickRepliesResponse(text: Array<string> = [], buttonArray: Array<sendTypes.Button> = []): this {
        return this.expectRawResponse(new QuickRepliesResponse(text, buttonArray));
    }

    public expectButtonTemplateResponse(text: Array<string> = [], buttonArray: Array<sendTypes.Button> = []): this {
        return this.expectRawResponse(new ButtonTemplateResponse(text, buttonArray));
    }

    public expectGenericTemplateResponse(): this {
        return this.expectRawResponse(new GenericTemplateResponse());
    }

    public expectTemplateResponse(elementCount: number, elements: Object): this {
        return this.expectRawResponse(new GenericTemplateResponse().elementCount(elementCount).elements(elements));
    }
}


function getScriptKey(multiscriptId, recipientId) {
  return multiscriptId? multiscriptId : recipientId;
}
