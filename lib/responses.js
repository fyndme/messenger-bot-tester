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
var _ = require("lodash");
var checker_1 = require("./checker");
var Response = (function () {
    function Response() {
        this.type = null;
    }
    Response.prototype.check = function (payload) {
        return true;
    };
    return Response;
}());
exports.Response = Response;
var TextResponse = (function (_super) {
    __extends(TextResponse, _super);
    function TextResponse(allowedPhrases) {
        var _this = _super.call(this) || this;
        _this.type = checker_1.ResponseTypes.text;
        _this.allowedPhrases = allowedPhrases;
        return _this;
    }
    TextResponse.prototype.check = function (payload) {
        var textCheck = this.allowedPhrases.length === 0 ? true : _.includes(this.allowedPhrases, payload.message.text);
        if (textCheck === false) {
            throw new Error("Text mismatch expected '" + this.allowedPhrases + "', but got '" + payload.message.text + "'");
        }
        return _super.prototype.check.call(this, payload) && textCheck;
    };
    return TextResponse;
}(Response));
exports.TextResponse = TextResponse;
var ImageResponse = (function (_super) {
    __extends(ImageResponse, _super);
    function ImageResponse(url) {
        var _this = _super.call(this) || this;
        _this.type = checker_1.ResponseTypes.image_attachment;
        _this.url = url;
        return _this;
    }
    ImageResponse.prototype.check = function (payload) {
        var attachment = payload.message.attachment.payload;
        var urlCheck = this.url === attachment.url;
        if (urlCheck === false) {
            throw new Error("URL mismatch expected '" + this.url + "', but got '" + attachment.url + "'");
        }
        return _super.prototype.check.call(this, payload) && urlCheck;
    };
    return ImageResponse;
}(Response));
exports.ImageResponse = ImageResponse;
var AudioResponse = (function (_super) {
    __extends(AudioResponse, _super);
    function AudioResponse(url) {
        var _this = _super.call(this, url) || this;
        _this.type = checker_1.ResponseTypes.audio_attachment;
        return _this;
    }
    return AudioResponse;
}(ImageResponse));
exports.AudioResponse = AudioResponse;
var FileResponse = (function (_super) {
    __extends(FileResponse, _super);
    function FileResponse(url) {
        var _this = _super.call(this, url) || this;
        _this.type = checker_1.ResponseTypes.file_attachment;
        return _this;
    }
    return FileResponse;
}(ImageResponse));
exports.FileResponse = FileResponse;
var VideoResponse = (function (_super) {
    __extends(VideoResponse, _super);
    function VideoResponse(url) {
        var _this = _super.call(this, url) || this;
        _this.type = checker_1.ResponseTypes.video_attachment;
        return _this;
    }
    return VideoResponse;
}(ImageResponse));
exports.VideoResponse = VideoResponse;
var QuickRepliesResponse = (function (_super) {
    __extends(QuickRepliesResponse, _super);
    function QuickRepliesResponse(allowedPhraes, buttonArray) {
        if (allowedPhraes === void 0) { allowedPhraes = []; }
        if (buttonArray === void 0) { buttonArray = []; }
        var _this = _super.call(this, allowedPhraes) || this;
        _this.type = checker_1.ResponseTypes.quick_replies;
        _this.buttons = buttonArray;
        return _this;
    }
    QuickRepliesResponse.prototype.check = function (payload) {
        var buttonsMatch = _.intersectionWith(this.buttons, payload.message.quick_replies, _.isEqual).length >= this.buttons.length;
        if (buttonsMatch === false) {
            throw new Error("button content doesn't match");
        }
        return _super.prototype.check.call(this, payload) && buttonsMatch;
    };
    return QuickRepliesResponse;
}(TextResponse));
exports.QuickRepliesResponse = QuickRepliesResponse;
var ButtonTemplateResponse = (function (_super) {
    __extends(ButtonTemplateResponse, _super);
    function ButtonTemplateResponse(allowedText, buttonArray) {
        if (allowedText === void 0) { allowedText = []; }
        if (buttonArray === void 0) { buttonArray = []; }
        var _this = _super.call(this) || this;
        _this.type = checker_1.ResponseTypes.button_template;
        _this.allowedText = allowedText;
        _this.buttons = buttonArray;
        return _this;
    }
    ButtonTemplateResponse.prototype.check = function (payload) {
        var attachment = payload.message.attachment.payload;
        var textMatches = _.includes(this.allowedText, attachment.text);
        if (textMatches === false) {
            throw new Error("text doesn't match expected '" + this.allowedText + "' but recieved '" + attachment.text + "'");
        }
        var buttonsMatch = _.intersectionWith(this.buttons, attachment.buttons, _.isEqual).length >= this.buttons.length;
        if (buttonsMatch === false) {
            throw new Error("button doesn't match");
        }
        return _super.prototype.check.call(this, payload) && textMatches && buttonsMatch;
    };
    return ButtonTemplateResponse;
}(Response));
exports.ButtonTemplateResponse = ButtonTemplateResponse;
var GenericTemplateResponse = (function (_super) {
    __extends(GenericTemplateResponse, _super);
    function GenericTemplateResponse() {
        var _this = _super.call(this) || this;
        _this._elementCount = -1;
        _this._elements = null;
        _this.type = checker_1.ResponseTypes.generic_template;
        return _this;
    }
    GenericTemplateResponse.prototype.elementCount = function (equalTo) {
        this._elementCount = equalTo;
        return this;
    };
    GenericTemplateResponse.prototype.elements = function (elem) {
        this._elements = elem;
        return this;
    };
    GenericTemplateResponse.prototype.check = function (payload) {
        var attachment = payload.message.attachment.payload;
        var elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
        //Simply and fast way for comparing Object
        //Works when you have simple JSON-style objects without methods and DOM nodes inside
        //The ORDER of the properties IS IMPORTANT
        var isElementsEquals = this._elements === null ? true : JSON.stringify(this._elements) === JSON.stringify(attachment.elements);
        if (elementCount === false) {
            throw new Error("element's have different count expected " + this._elementCount + " but received " + attachment.elements.length);
        }
        if (isElementsEquals === false) {
            throw new Error("element's are different expected " + JSON.stringify(this._elements) + " but received " + JSON.stringify(attachment.elements));
        }
        return _super.prototype.check.call(this, payload) && elementCount && isElementsEquals;
    };
    return GenericTemplateResponse;
}(Response));
exports.GenericTemplateResponse = GenericTemplateResponse;
var ReceiptTemplateResponse = (function (_super) {
    __extends(ReceiptTemplateResponse, _super);
    function ReceiptTemplateResponse() {
        var _this = _super.call(this) || this;
        _this._elementCount = -1;
        _this.type = checker_1.ResponseTypes.receipt_template;
        return _this;
    }
    ReceiptTemplateResponse.prototype.elementCount = function (equalTo) {
        this._elementCount = equalTo;
        return this;
    };
    ReceiptTemplateResponse.prototype.check = function (payload) {
        var attachment = payload.message.attachment.payload;
        var elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
        if (elementCount === false) {
            throw new Error("element's have different count expected " + this._elementCount + " but received " + attachment.elements.length);
        }
        return _super.prototype.check.call(this, payload) && elementCount;
    };
    return ReceiptTemplateResponse;
}(Response));
exports.ReceiptTemplateResponse = ReceiptTemplateResponse;
