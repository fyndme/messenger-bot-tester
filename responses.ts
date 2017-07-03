import * as _ from 'lodash';

import { checkSendAPI, ResponseTypes, CheckResult } from './checker';
import * as sendTypes from './send-types';

export class Response {
    check(payload: sendTypes.Payload): boolean {
        return true;
    }
    public type: ResponseTypes = null;
}

export class TextResponse extends Response {
    protected allowedPhrases: Array<string>;
    constructor(allowedPhrases: Array<string>) {
        super();
        this.allowedPhrases = allowedPhrases;
    }
    public type: ResponseTypes = ResponseTypes.text;

    check(payload:sendTypes.Payload): boolean {
      const textCheck: boolean = this.allowedPhrases.length === 0 ? true : _.includes(this.allowedPhrases, payload.message.text);
      if (textCheck === false) {
        throw new Error(`Text mismatch expected '${this.allowedPhrases}', but got '${payload.message.text}'`);
      }
      return super.check(payload) && textCheck;
    }
}

export class ImageResponse extends Response {
    protected url: string;
    constructor(url: string) {
        super();
        this.url = url;
    }
    public type: ResponseTypes = ResponseTypes.image_attachment;

    check(payload:sendTypes.Payload): boolean {
      const attachment = payload.message.attachment.payload as sendTypes.URLPayload;
      const urlCheck: boolean = this.url === attachment.url;
      if (urlCheck === false) {
        throw new Error(`URL mismatch expected '${this.url}', but got '${attachment.url}'`);
      }
      return super.check(payload) && urlCheck;
    }
}

export class AudioResponse extends ImageResponse {
  constructor(url: string) {
    super(url);
  }
  public type: ResponseTypes = ResponseTypes.audio_attachment;
}

export class FileResponse extends ImageResponse {
  constructor(url: string) {
    super(url);
  }
  public type: ResponseTypes = ResponseTypes.file_attachment;
}

export class VideoResponse extends ImageResponse {
  constructor(url: string) {
    super(url);
  }
  public type: ResponseTypes = ResponseTypes.video_attachment;
}

export class QuickRepliesResponse extends TextResponse {
    protected buttons: Array<sendTypes.Button>;
    constructor(allowedPhraes: Array<string> = [], buttonArray: Array<sendTypes.Button> = []) {
        super(allowedPhraes);
        this.buttons = buttonArray;
    }
    public type: ResponseTypes = ResponseTypes.quick_replies;

    check(payload:sendTypes.Payload): boolean {
        const buttonsMatch = _.intersectionWith(this.buttons, payload.message.quick_replies, _.isEqual).length >= this.buttons.length;
        if (buttonsMatch === false) {
          throw new Error(`button content doesn't match`);
        }
        return super.check(payload) && buttonsMatch;
    }
}

export class ButtonTemplateResponse extends Response {
    protected allowedText: Array<string>;
    protected buttons: Array<sendTypes.Button>;
    constructor(allowedText: Array<string> = [], buttonArray: Array<sendTypes.Button> = []) {
        super();
        this.allowedText = allowedText;
        this.buttons = buttonArray;
    }
    public type: ResponseTypes = ResponseTypes.button_template;

    check(payload:sendTypes.Payload): boolean {
        const attachment = payload.message.attachment.payload as sendTypes.ButtonPayload;
        const textMatches = _.includes(this.allowedText, attachment.text);
        if (textMatches === false) {
          throw new Error(`Recipient: '${payload.recipient.id}'. text doesn't match expected '${this.allowedText}' but recieved '${attachment.text}'`);
        }
        const buttonsMatch = _.intersectionWith(this.buttons, attachment.buttons, _.isEqual).length >= this.buttons.length;
        if (buttonsMatch === false) {
          throw new Error(`button doesn't match`);
        }
        return super.check(payload) && textMatches && buttonsMatch;
    }
}

export class GenericTemplateResponse extends Response {
    protected _elementCount: number = -1;
    protected _elements: Object = null;
    constructor() {
        super();
    }
    public type: ResponseTypes = ResponseTypes.generic_template;

    elementCount(equalTo: number): this {
        this._elementCount = equalTo;
        return this;
    }

    elements(elem: Object): this {
        this._elements= elem;
        return this;
    }

    check(payload:sendTypes.Payload): boolean {
        const attachment = payload.message.attachment.payload as sendTypes.GenericPayload;
        const elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
        //Simply and fast way for comparing Object
        //Works when you have simple JSON-style objects without methods and DOM nodes inside
        //The ORDER of the properties IS IMPORTANT
        var isElementsEquals = this._elements === null ? true : JSON.stringify(this._elements) === JSON.stringify(attachment.elements);
        if (elementCount === false) {
          throw new Error(`element's have different count expected ${this._elementCount} but received ${attachment.elements.length}`);
        }
        if (isElementsEquals === false) {
            throw new Error(`element's are different expected ${JSON.stringify(this._elements)} but received ${JSON.stringify(attachment.elements)}`);
        }
        return super.check(payload) && elementCount && isElementsEquals;
    }
}

export class ReceiptTemplateResponse extends Response {
    protected _elementCount: number = -1;
    constructor() {
        super();
    }
    public type: ResponseTypes = ResponseTypes.receipt_template;

    elementCount(equalTo: number): this {
        this._elementCount = equalTo;
        return this;
    }

    check(payload:sendTypes.Payload): boolean {
        const attachment = payload.message.attachment.payload as sendTypes.ReceiptPayload;
        const elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
        if (elementCount === false) {
          throw new Error(`element's have different count expected ${this._elementCount} but received ${attachment.elements.length}`);
        }
        return super.check(payload) && elementCount;
    }
}
