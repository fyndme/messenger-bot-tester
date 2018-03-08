"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apiCheck = require("api-check");
var ResponseTypes;
(function (ResponseTypes) {
    ResponseTypes[ResponseTypes["sender_action"] = 0] = "sender_action";
    ResponseTypes[ResponseTypes["text"] = 1] = "text";
    ResponseTypes[ResponseTypes["image_attachment"] = 2] = "image_attachment";
    ResponseTypes[ResponseTypes["audio_attachment"] = 3] = "audio_attachment";
    ResponseTypes[ResponseTypes["video_attachment"] = 4] = "video_attachment";
    ResponseTypes[ResponseTypes["file_attachment"] = 5] = "file_attachment";
    ResponseTypes[ResponseTypes["generic_template"] = 6] = "generic_template";
    ResponseTypes[ResponseTypes["button_template"] = 7] = "button_template";
    ResponseTypes[ResponseTypes["receipt_template"] = 8] = "receipt_template";
    ResponseTypes[ResponseTypes["quick_replies"] = 9] = "quick_replies";
})(ResponseTypes = exports.ResponseTypes || (exports.ResponseTypes = {}));
function checkSendAPI(payload) {
    var checks = [
        checkSenderAction(payload),
        checkTextMessage(payload),
        checkImage(payload),
        checkAudio(payload),
        checkVideo(payload),
        checkFile(payload),
        checkGenericTemplate(payload),
        checkButtonTemplate(payload),
        checkReceiptTemplate(payload),
        checkQuickReplies(payload),
    ];
    var validChecks = checks.filter(function (result) { return result.state === true; });
    if (validChecks.length === 1) {
        return validChecks[0];
    }
    // console.log(payload);
    // console.log(checks);
    return null;
}
exports.checkSendAPI = checkSendAPI;
function checkTextMessage(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            text: apiCheck.string,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.text,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.text,
        state: false,
        error: result,
    };
}
function checkSenderAction(payload) {
    var checkeSA = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        sender_action: apiCheck.string,
    }).strict;
    var result = checkeSA(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.sender_action,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.sender_action,
        state: false,
        error: result,
    };
}
function checkQuickReplies(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            text: apiCheck.string,
            quick_replies: apiCheck.arrayOf(apiCheck.shape({
                content_type: apiCheck.oneOf(['text']),
                title: apiCheck.string,
                payload: apiCheck.string,
            }).strict),
        }),
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.quick_replies,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.quick_replies,
        state: false,
        error: result,
    };
}
var buttonArray = apiCheck.arrayOf(apiCheck.oneOfType([
    apiCheck.shape({
        type: apiCheck.oneOf(['postback', 'phone_number']),
        title: apiCheck.string,
        payload: apiCheck.string,
    }).strict,
    apiCheck.shape({
        type: apiCheck.oneOf(['web_url']),
        title: apiCheck.string,
        url: apiCheck.string,
	webview_height_ratio: apiCheck.string.optional,
    }).strict,
]));
function checkGenericTemplate(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            attachment: apiCheck.shape({
                type: apiCheck.oneOf(['template']),
                payload: apiCheck.shape({
                    template_type: apiCheck.oneOf(['generic']),
                    elements: apiCheck.arrayOf(apiCheck.shape({
                        title: apiCheck.string,
                        item_url: apiCheck.string.optional,
                        image_url: apiCheck.string.optional,
                        subtitle: apiCheck.string.optional,
                        buttons: buttonArray,
                    }).strict),
                }).strict,
            }).strict,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.generic_template,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.generic_template,
        state: false,
        error: result,
    };
}
function checkButtonTemplate(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            attachment: apiCheck.shape({
                type: apiCheck.oneOf(['template']),
                payload: apiCheck.shape({
                    template_type: apiCheck.oneOf(['button']),
                    text: apiCheck.string,
                    buttons: buttonArray,
                }).strict,
            }).strict,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        if (payload.message.attachment.payload.text === '') {
            return {
                type: ResponseTypes.button_template,
                state: false,
                error: new Error('Template titles can\'t be empty'),
            };
        }
        if (payload.message.attachment.payload.buttons.length === 0) {
            return {
                type: ResponseTypes.button_template,
                state: false,
                error: new Error('Button array can\'t be empty'),
            };
        }
        for (var i = 0; i < payload.message.attachment.payload.buttons.length; i++) {
            if (payload.message.attachment.payload.buttons[0].title === '') {
                return {
                    type: ResponseTypes.button_template,
                    state: false,
                    error: new Error('Button titles can\'t be empty'),
                };
            }
        }
        return {
            type: ResponseTypes.button_template,
            state: true,
            recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.button_template,
        state: false,
        error: result,
    };
}
function checkImage(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            attachment: apiCheck.shape({
                type: apiCheck.oneOf(['image']),
                payload: apiCheck.shape({
                    url: apiCheck.string,
                }).strict,
            }).strict,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.image_attachment,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.image_attachment,
        state: false,
        error: result,
    };
}
function checkAudio(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            attachment: apiCheck.shape({
                type: apiCheck.oneOf(['audio']),
                payload: apiCheck.shape({
                    url: apiCheck.string,
                }).strict,
            }).strict,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.audio_attachment,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.audio_attachment,
        state: false,
        error: result,
    };
}
function checkVideo(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            attachment: apiCheck.shape({
                type: apiCheck.oneOf(['video']),
                payload: apiCheck.shape({
                    url: apiCheck.string,
                }).strict,
            }).strict,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.video_attachment,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.video_attachment,
        state: false,
        error: result,
    };
}
function checkFile(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            attachment: apiCheck.shape({
                type: apiCheck.oneOf(['file']),
                payload: apiCheck.shape({
                    url: apiCheck.string,
                }).strict,
            }).strict,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.file_attachment,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.file_attachment,
        state: false,
        error: result,
    };
}
function checkReceiptTemplate(payload) {
    var checker = apiCheck.shape({
        recipient: apiCheck.shape({
            id: apiCheck.string,
        }).strict,
        message: apiCheck.shape({
            attachment: apiCheck.shape({
                type: apiCheck.oneOf(['template']),
                payload: apiCheck.shape({
                    template_type: apiCheck.oneOf(['receipt']),
                    recipient_name: apiCheck.string,
                    order_number: apiCheck.string,
                    currency: apiCheck.string,
                    payment_method: apiCheck.string,
                    timestamp: apiCheck.string.optional,
                    order_url: apiCheck.string.optional,
                    elements: apiCheck.arrayOf(apiCheck.shape({
                        title: apiCheck.string,
                        subtitle: apiCheck.string.optional,
                        quantity: apiCheck.number.optional,
                        price: apiCheck.number,
                        currency: apiCheck.string.optional,
                        image_url: apiCheck.string.optional,
                    }).strict),
                    address: apiCheck.shape({
                        street_1: apiCheck.string,
                        street_2: apiCheck.string.optional,
                        city: apiCheck.string,
                        postal_code: apiCheck.string,
                        state: apiCheck.string,
                        country: apiCheck.string,
                    }).strict.optional,
                    summary: apiCheck.shape({
                        subtotal: apiCheck.number.optional,
                        shipping_cost: apiCheck.number.optional,
                        total_tax: apiCheck.number.optional,
                        total_cost: apiCheck.number,
                    }).strict,
                    adjustments: apiCheck.arrayOf(apiCheck.shape({
                        name: apiCheck.string.optional,
                        amount: apiCheck.number.optional,
                    }).strict).optional,
                }).strict,
            }).strict,
        }).strict,
        notification_type: apiCheck.string.optional,
    }).strict;
    var result = checker(payload);
    if (typeof result === 'undefined') {
        return {
            type: ResponseTypes.receipt_template,
            state: true, recipient: payload.recipient.id
        };
    }
    // console.log(result);
    return {
        type: ResponseTypes.receipt_template,
        state: false,
        error: result,
    };
}
