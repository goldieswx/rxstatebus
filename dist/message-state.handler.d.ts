import { BusMessage, BusMessageCollection, BusMessageHeader, BusMessageHook, MessageStateCompactedMessage } from "./types/bus.type";
export declare class MessageStateHandler {
    private _busMessages;
    private _sequenceId;
    private _retainInHistory;
    constructor(options?: any);
    _getNextSequenceId(): number;
    _updateHistoryWithCurrent(messageCollection: BusMessageCollection<any>): void;
    private _findSequence;
    private _findSequenceHistory;
    getHook<T>(header: BusMessageHeader, hookId: string): BusMessageHook<T>;
    getMessage<T>(header: BusMessageHeader): BusMessage<T>;
    getHookHistory<T>(header: BusMessageHeader, hookId: string, includeCurrent: boolean): BusMessageHook<T>[];
    getDataHistory<T>(header: BusMessageHeader, includeCurrent: boolean): T[];
    newMessage(serviceId: string, itemId: any, data: any, timestamp: Date, clear: boolean): BusMessageCollection<any>;
    private _getBusMessages;
    getBusMessages(serviceId: string, itemId: any): BusMessageCollection<any>;
    callServiceItems(serviceId: string, fn: (itemId: string) => any): void;
    getServiceItems(serviceId: string, fn: (item: BusMessageCollection<any>, key: string) => any): void;
    hookMessage(serviceId: string, itemId: any, hookId: string, hookFn: (BusMessageCollection: any, serviceId?: string, itemId?: any, hookId?: string) => any, compactFn?: (resultingHookData: any) => any): BusMessageCollection<any>;
    compactMessage<T>(m: BusMessage<any>): MessageStateCompactedMessage<T>;
}
