"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
var express = require("express");
var Promise = require("bluebird");
var bodyParser = require("body-parser");
var _ = require("lodash");
var checker_1 = require("./checker");
exports.checkSendAPI = checker_1.checkSendAPI;
var responses_1 = require("./responses");
var messages_1 = require("./messages");
__export(require("./responses"));
__export(require("./messages"));
var Tester = (function () {
    function Tester(portToListenOn, addressToSendTo) {
        var _this = this;
        this.promise = {};
        this.finalResolveFunction = {};
        this.rejectFunction = {};
        this.stepMapArray = {};
        this.multipleStepsOrder = [];
        this.host = addressToSendTo;
        this.port = portToListenOn;
        this.expressApp = express();
        this.expressApp.use(bodyParser.json());
        var _savedThis = this;
        this.expressApp.get('/v2.6/:id', function (req, res) {
            // console.log('requesting', (<any>req.params).id);
            var user = {
                first_name: 'user',
                last_name: 'last',
                profile_pic: 'http://none',
                locale: 'en_us',
                timezone: 0,
                gender: 'male',
            };
            res.send(user);
        });
        this.expressApp.get('/v2.6/me/thread_settings', function (req, res) {
            // console.log('thread_settings');
            res.send({});
        });
        this.expressApp.post('/v2.6/me/messages', function (req, res) {
            //send api
            var body = req.body;
            var parsedResponse = checker_1.checkSendAPI(body);
            // console.log('response:', parsedResponse);
            if (parsedResponse === null || parsedResponse.type === null) {
                res.sendStatus(400);
                // don't know who to respond to'
                throw new Error('Bad response structure');
            }
            var token = req.query.access_token;
            if (typeof token !== 'string') {
                return _savedThis.rejectFunction[getScriptKey(_this.multiScriptId, parsedResponse.recipient)](new Error('Token must be included on all requests'));
            }
            if (parsedResponse.type === checker_1.ResponseTypes.sender_action) {
                res.sendStatus(200);
                return;
            }
            _savedThis.checkResponse(body, parsedResponse, res);
        });
        return this;
    }
    Tester.prototype.startListening = function () {
        var _this = this;
        this.expressPromise = new Promise(function (resolve, reject) {
            _this.expressInstance = _this.expressApp.listen(_this.port, function () {
                console.log("listening on " + _this.port);
                resolve();
            });
        });
        return this.expressPromise;
    };
    Tester.prototype.stopListening = function () {
        this.expressInstance.close();
        console.log("stopped listening on " + this.port);
        return Promise.resolve();
    };
    Tester.prototype.endMultipleScriptTest = function () {
        this.multiScriptId = null;
        this.multipleStepsOrder = [];
    };
    Tester.prototype.checkResponse = function (realResponse, parsedResponse, res) {
        var _this = this;
        var currentStep = this.stepMapArray[parsedResponse.recipient][0];
        if (currentStep instanceof responses_1.Response) {
            var _savedThis_1 = this;
            this.stepMapArray[parsedResponse.recipient].shift();
            var promiseId = void 0;
            if (!_.isNull(this.multiScriptId) && !_.isUndefined(this.multiScriptId)) {
                promiseId = this.multiScriptId;
                var expectedUser = this.multipleStepsOrder.shift();
                console.log("=> multiscript Id is: ", promiseId);
                console.log("response popped uesr ", expectedUser);
                if (_.isArray(expectedUser)) {
                    var userIdx = expectedUser.indexOf(parsedResponse.recipient);
                    if (userIdx == -1) {
                        return _savedThis_1.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error("Multi-script error failed got resposne for user '" + parsedResponse.recipient + "'  but expeccted response for any of the users '" + expectedUser + "'"));
                    }
                    expectedUser.splice(userIdx, 1);
                    if (!_.isEmpty(expectedUser)) {
                        this.multipleStepsOrder.unshift(expectedUser);
                    }
                }
                else {
                    if (expectedUser !== parsedResponse.recipient) {
                        return _savedThis_1.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error("Multi-script error failed got resposne for user '" + parsedResponse.recipient + "'  but expeccted response for user '" + expectedUser + "'"));
                    }
                }
            }
            else {
                promiseId = parsedResponse.recipient;
            }
            console.log('====> checking the response... promise is', promiseId);
            console.log("script id", this.multiScriptId);
            console.log("scripts order", this.multipleStepsOrder);
            this.promise[promiseId] = this.promise[promiseId].then(function () { return new Promise(function (resolve) {
                console.log("create expect promise for " + currentStep.constructor.name);
                console.log('currentStep', currentStep);
                console.log('checking type..');
                if (currentStep.type !== parsedResponse.type) {
                    return _savedThis_1.rejectFunction[getScriptKey(_this.multiScriptId, parsedResponse.recipient)](new Error("Script does not match response type, got '" + checker_1.ResponseTypes[parsedResponse.type] + "' but expected '" + checker_1.ResponseTypes[currentStep.type] + "'"));
                }
                // console.log('checking contents..');
                try {
                    if (currentStep.check(realResponse)) {
                        // console.log('PERFECT');
                        res.sendStatus(200);
                        return resolve();
                    }
                }
                catch (err) {
                    res.sendStatus(200);
                    return _savedThis_1.rejectFunction[getScriptKey(_this.multiScriptId, parsedResponse.recipient)](err);
                }
                res.sendStatus(200);
                return _savedThis_1.rejectFunction[getScriptKey(_this.multiScriptId, parsedResponse.recipient)](new Error("Script does not match response expected"));
            }); })
                .then(function () {
                // console.log('running next step...');user
                if (!_.isNull(_this.multiScriptId) && !_.isUndefined(_this.multiScriptId)) {
                    return _savedThis_1.runNextStepMultipleScripts(_savedThis_1.multiScriptId);
                }
                else {
                    return _savedThis_1.runNextStep(parsedResponse.recipient);
                }
            })
                .then(function () { return null; });
        }
        else {
            // console.log("==> recipient: ", parsedResponse.recipient);
            // console.log("==> reject map: ", this.rejectFunction);
            this.rejectFunction[getScriptKey(this.multiScriptId, parsedResponse.recipient)](new Error("Script does not have a response, but received one"));
            res.sendStatus(200);
        }
    };
    Tester.prototype.runNextStepMultipleScripts = function (scriptId) {
        var _this = this;
        var _savedThis = this;
        var nextStep;
        var nextUser;
        var _loop_1 = function () {
            var potentialNextUser = _savedThis.multipleStepsOrder[0];
            if (_.isArray(potentialNextUser)) {
                return "break";
            }
            else {
                nextUser = _savedThis.multipleStepsOrder.shift();
                // console.log("==> popped next user : ", nextUser);
                if (typeof nextUser === 'undefined') {
                    // console.log('end of array');
                    this_1.promise[scriptId] = this_1.promise[scriptId].then(function () {
                        // console.log('clear');
                        _savedThis.finalResolveFunction[scriptId]();
                    });
                    return { value: null };
                }
                nextStep = this_1.stepMapArray[nextUser].shift();
                // console.log('working on:', (<any>nextStep).constructor.name);
                if (nextStep instanceof responses_1.Response) {
                    var localStep = nextStep;
                    // console.log(`expecting a ${(<any>localStep).constructor.name}`);
                    // console.log("unshifting user ", nextUser);
                    this_1.stepMapArray[nextUser].unshift(nextStep);
                    this_1.multipleStepsOrder.unshift(nextUser);
                    return "break";
                }
                else if (nextStep instanceof messages_1.Message) {
                    var localStep_1 = nextStep;
                    this_1.promise[scriptId] = this_1.promise[scriptId].then(function () {
                        // console.log('sending', (<any>localStep).constructor.name);
                        return localStep_1.send(_this.host);
                    });
                }
                else {
                    // console.log("corrupt step ", nextStep);
                    // console.log("corrupt user ", nextUser);
                    this_1.promise[scriptId] = this_1.promise[scriptId].then(function () { return Promise.reject(new Error('corrupt script')); });
                }
            }
        };
        var this_1 = this;
        do {
            var state_1 = _loop_1();
            if (typeof state_1 === "object")
                return state_1.value;
            if (state_1 === "break")
                break;
        } while (nextStep instanceof messages_1.Message);
        if (nextStep instanceof responses_1.Response) {
            return nextStep;
        }
        return null;
    };
    Tester.prototype.runNextStep = function (recipient) {
        var _this = this;
        var _savedThis = this;
        var nextStep;
        var _loop_2 = function () {
            nextStep = this_2.stepMapArray[recipient].shift();
            if (typeof nextStep === 'undefined') {
                // console.log('end of array');
                this_2.promise[recipient] = this_2.promise[recipient].then(function () {
                    // console.log('clear');
                    _savedThis.finalResolveFunction[recipient]();
                });
                return { value: null };
            }
            // console.log('working on:', (<any>nextStep).constructor.name);
            if (nextStep instanceof responses_1.Response) {
                var localStep = nextStep;
                // console.log(`expecting a ${(<any>localStep).constructor.name}`);
                this_2.stepMapArray[recipient].unshift(nextStep);
                return "break";
            }
            else if (nextStep instanceof messages_1.Message) {
                var localStep_2 = nextStep;
                this_2.promise[recipient] = this_2.promise[recipient].then(function () {
                    // console.log('sending', (<any>localStep).constructor.name);
                    return localStep_2.send(_this.host);
                });
            }
            else {
                // console.log(nextStep);
                this_2.promise[recipient] = this_2.promise[recipient].then(function () { return Promise.reject(new Error('corrupt script')); });
            }
        };
        var this_2 = this;
        do {
            var state_2 = _loop_2();
            if (typeof state_2 === "object")
                return state_2.value;
            if (state_2 === "break")
                break;
        } while (nextStep instanceof messages_1.Message);
        if (nextStep instanceof responses_1.Response) {
            return nextStep;
        }
        return null;
    };
    Tester.prototype.runScript = function (script) {
        var _savedThis = this;
        this.stepMapArray[script.userID] = _.clone(script.script);
        if (typeof this.expressPromise === 'undefined') {
            this.startListening();
        }
        return this.expressPromise
            .then(function () { return new Promise(function (resolve, reject) {
            _savedThis.promise[script.userID] = Promise.resolve();
            _savedThis.finalResolveFunction[script.userID] = resolve;
            _savedThis.rejectFunction[script.userID] = reject;
            _savedThis.runNextStep(script.userID);
        }); });
    };
    Tester.prototype.runMultipleScripts = function (scriptId, scriptList, runningOrder) {
        var _this = this;
        console.log("==> called this correctly:", runningOrder);
        var _savedThis = this;
        // add scripts to script map
        scriptList.forEach(function (s) { _this.stepMapArray[s.userID] = _.clone(s.script); });
        return this.expressPromise
            .then(function () { return new Promise(function (resolve, reject) {
            _savedThis.promise[scriptId] = Promise.resolve();
            _savedThis.finalResolveFunction[scriptId] = resolve;
            _savedThis.rejectFunction[scriptId] = reject;
            _savedThis.multipleStepsOrder = runningOrder;
            _savedThis.multiScriptId = scriptId;
            _savedThis.runNextStepMultipleScripts(scriptId);
        }); });
    };
    return Tester;
}());
exports.default = Tester;
var Script = (function () {
    function Script(user, page) {
        this.seq = 0;
        this.script = [];
        this.userID = user.toString();
        this.pageID = page.toString();
    }
    Script.prototype.sendTextMessage = function (text) {
        this.script.push(new messages_1.TextMessage(this.userID, this.pageID, this.seq++).create(text));
        return this;
    };
    Script.prototype.sendDelay = function (delayMs) {
        this.script.push(new messages_1.DelayMessage(this.userID, this.pageID, 0).create(delayMs));
        return this;
    };
    Script.prototype.sendPostbackMessage = function (payload) {
        this.script.push(new messages_1.PostbackMessage(this.userID, this.pageID, this.seq++).create(payload));
        return this;
    };
    Script.prototype.sendPostbackMessageWithReferral = function (payload, referral) {
        this.script.push(new messages_1.PostbackMessageWithReferral(this.userID, this.pageID, this.seq++).create(payload, referral));
        return this;
    };
    Script.prototype.sendQuickReplyMessage = function (text, payload) {
        this.script.push(new messages_1.QuickReplyMessage(this.userID, this.pageID, this.seq++).create(text, payload));
        return this;
    };
    Script.prototype.expectRawResponse = function (responseInstance) {
        this.script.push(responseInstance);
        return this;
    };
    Script.prototype.expectTextResponse = function (text) {
        return this.expectRawResponse(new responses_1.TextResponse([text]));
    };
    Script.prototype.expectTextResponses = function (text) {
        return this.expectRawResponse(new responses_1.TextResponse(text));
    };
    Script.prototype.expectQuickRepliesResponse = function (text, buttonArray) {
        if (text === void 0) { text = []; }
        if (buttonArray === void 0) { buttonArray = []; }
        return this.expectRawResponse(new responses_1.QuickRepliesResponse(text, buttonArray));
    };
    Script.prototype.expectButtonTemplateResponse = function (text, buttonArray) {
        if (text === void 0) { text = []; }
        if (buttonArray === void 0) { buttonArray = []; }
        return this.expectRawResponse(new responses_1.ButtonTemplateResponse(text, buttonArray));
    };
    Script.prototype.expectGenericTemplateResponse = function () {
        return this.expectRawResponse(new responses_1.GenericTemplateResponse());
    };
    Script.prototype.expectTemplateResponse = function (elementCount, elements) {
        return this.expectRawResponse(new responses_1.GenericTemplateResponse().elementCount(elementCount).elements(elements));
    };
    return Script;
}());
exports.Script = Script;
function getScriptKey(multiscriptId, recipientId) {
    return multiscriptId ? multiscriptId : recipientId;
}
