"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var rp = require("request-promise");
var Message = (function () {
    function Message(sender, recipient, seq) {
        this.sender = sender;
        this.recipient = recipient;
        this.seq = seq;
    }
    Message.prototype.send = function (host) {
        var payload = {
            url: host,
            qs: {},
            method: 'POST',
            json: this.export(),
        };
        // console.log(util.inspect(payload, {depth: null}));
        return Promise.resolve(rp(payload));
    };
    Message.prototype.export = function () {
        return {
            object: "page",
            entry: [
                {
                    id: this.recipient,
                    time: (new Date).getTime(),
                    messaging: [
                        this.payload,
                    ],
                },
            ],
        };
    };
    return Message;
}());
exports.Message = Message;
var TextMessage = (function (_super) {
    __extends(TextMessage, _super);
    function TextMessage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TextMessage.prototype.create = function (text) {
        this.payload = {
            sender: {
                id: this.sender,
            },
            recipient: {
                id: this.recipient,
            },
            timestamp: (new Date).getTime(),
            message: {
                mid: "mid." + 0,
                seq: this.seq,
                text: text,
            },
        };
        return this;
    };
    return TextMessage;
}(Message));
exports.TextMessage = TextMessage;
var QuickReplyMessage = (function (_super) {
    __extends(QuickReplyMessage, _super);
    function QuickReplyMessage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    QuickReplyMessage.prototype.create = function (text, payload) {
        this.payload = {
            sender: {
                id: this.sender,
            },
            recipient: {
                id: this.recipient,
            },
            timestamp: (new Date).getTime(),
            message: {
                mid: "mid." + 0,
                seq: this.seq,
                text: text,
                quick_reply: {
                    payload: payload,
                },
            },
        };
        return this;
    };
    return QuickReplyMessage;
}(Message));
exports.QuickReplyMessage = QuickReplyMessage;
var DelayMessage = (function (_super) {
    __extends(DelayMessage, _super);
    function DelayMessage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.delay = 0;
        return _this;
    }
    DelayMessage.prototype.create = function (delayMs) {
        this.delay = delayMs;
        return this;
    };
    DelayMessage.prototype.send = function () {
        // console.log(`delaying ${this.delay} ms`);
        return Promise.delay(this.delay);
    };
    return DelayMessage;
}(Message));
exports.DelayMessage = DelayMessage;
var PostbackMessage = (function (_super) {
    __extends(PostbackMessage, _super);
    function PostbackMessage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PostbackMessage.prototype.create = function (payload) {
        this.payload = {
            sender: {
                id: this.sender,
            },
            recipient: {
                id: this.recipient,
            },
            timestamp: (new Date).getTime(),
            postback: {
                payload: payload,
            },
        };
        return this;
    };
    return PostbackMessage;
}(Message));
exports.PostbackMessage = PostbackMessage;
var PostbackMessageWithReferral = (function (_super) {
    __extends(PostbackMessageWithReferral, _super);
    function PostbackMessageWithReferral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PostbackMessageWithReferral.prototype.create = function (payload, referral) {
        this.payload = {
            sender: {
                id: this.sender,
            },
            recipient: {
                id: this.recipient,
            },
            timestamp: (new Date).getTime(),
            postback: {
                payload: payload,
                referral: {
                    ref: referral,
                    source: "SHORTLINK",
                    type: "OPEN_THREAD",
                }
            },
        };
        return this;
    };
    return PostbackMessageWithReferral;
}(Message));
exports.PostbackMessageWithReferral = PostbackMessageWithReferral;
