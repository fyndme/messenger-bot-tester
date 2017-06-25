export interface CheckResult {
    type: ResponseTypes;
    state: boolean;
    recipient: string;
}
export declare enum ResponseTypes {
    sender_action = 0,
    text = 1,
    image_attachment = 2,
    audio_attachment = 3,
    video_attachment = 4,
    file_attachment = 5,
    generic_template = 6,
    button_template = 7,
    receipt_template = 8,
    quick_replies = 9,
}
export declare function checkSendAPI(payload: any): CheckResult;
